import { 
  DuckDBInstance, 
  DuckDBConnection, 
  DuckDBMaterializedResult,
  DuckDBValue
} from '@duckdb/node-api';
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { NoteDto } from './dtoUtility';
import { v4 as uuidv4 } from 'uuid';

// Define the database path
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'notes.duckdb');
const EMBED_ARRAY_LENGTH = 10;

export interface embeddedObject {
  noteId: string;
  embedding: number[];
}

// Database class to handle all DuckDB operations
export class Database {
  public static initializationPromise: Promise<void>;
  private static instance: Database;
  private db!: DuckDBConnection;

  private constructor() {
    // Create the database directory if it doesn't exist
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Store the initialization promise
    Database.initializationPromise = this.initializeDatabase()
    .then(() => {
      return this.initSchema();
    })
    .then(() => {
      console.log('DuckDB database initialized successfully');
    })
    .catch((error: any) => {
      console.error('Error initializing database:', error);
      throw error;
    });
  }

  private async initializeDatabase(): Promise<void> {
    console.log('Creating DuckDB connection');
    const dbInstance = await DuckDBInstance.create(dbPath);
    this.db = await dbInstance.connect();
  }

  // Singleton pattern to ensure only one database connection
  public static getInstance(): Database {
    console.log('Getting database instance');
    if (!Database.instance) {
      console.log('Creating new database instance');
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Initialize the database schema
  private async initSchema(): Promise<void> {
    console.log('Initializing database schema');
    // 1) Ensure vss is available on THIS connection
    try {
      await this.db.run(`
        INSTALL vss;
        LOAD vss;
        -- optional but useful when you want the HNSW index to persist to disk
        SET hnsw_enable_experimental_persistence = true;
      `);
    } catch (e) {
      throw new Error(
        `DuckDB VSS extension not available. Ensure your DuckDB version supports it and that the process can install/load extensions. Original: ${e}`
      );
    }

    const result = await this.db.run(`
      SELECT * FROM duckdb_extensions();
    `);
    const resultString = await result.getRows();
    console.log('result', resultString);

    // Create notes table
    await this.db.run(`
      CREATE TABLE IF NOT EXISTS notes (
        id VARCHAR PRIMARY KEY,
        title VARCHAR NOT NULL,
        content TEXT,
        created_at TIMESTAMP NOT NULL,
        updated_at TIMESTAMP NOT NULL
      )
    `);

    await this.db.run(`
      CREATE TABLE IF NOT EXISTS note_embeddings (
        id VARCHAR PRIMARY KEY,
        embedding FLOAT[${EMBED_ARRAY_LENGTH}] NOT NULL,
        note_id VARCHAR NOT NULL,
        FOREIGN KEY (note_id) REFERENCES notes(id)
      );
      CREATE INDEX IF NOT EXISTS idx_note_embeddings_embedding ON note_embeddings USING HNSW (embedding);
    `);

    // Create index for faster queries
    await this.db.run(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
    `);
    
    console.log('Database schema initialized successfully');
  }

  // Get all notes
  public async getNotes(): Promise<NoteDto[]> {
    console.log('Getting notes from sql');
    const reader = await this.db.runAndReadAll(`
      SELECT 
        id, 
        title, 
        content, 
        created_at, 
        updated_at
      FROM notes
      ORDER BY updated_at DESC
    `);
    try {
      await this.getAllEmbeddings();
    } catch (error) {
      console.error('Error getting all embeddings:', error);
    }

    return reader.getRows().map(convertDBRowToNoteDto);
  }

  private async getAllEmbeddings(): Promise<void> {
    const reader = await this.db.runAndReadAll(`
      SELECT id, embedding, note_id FROM note_embeddings
    `)
    const embeddings = reader.getRows();
    console.log('embeddings', embeddings);
  }

  // Get a note by ID
    public async getNote(id: string): Promise<DuckDBMaterializedResult> {
      return this.db.run(`
        SELECT 
          id, 
          title, 
          content, 
          created_at, 
          updated_at
        FROM notes
        WHERE id = ?
      `, [id]);
  }

  // Create a new note
  public async createNote(note: { id: string, title: string, content: string }): Promise<DuckDBMaterializedResult> {
    const now = new Date();
    return this.db.run(`
        INSERT INTO notes (id, title, content, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `, [note.id, note.title, note.content, now.toISOString(), now.toISOString()])
  }

  // Update an existing note
  public async updateNote(note: { id: string, title: string, content: string }): Promise<DuckDBMaterializedResult> {
    const now = new Date();
    return this.db.run(`
        UPDATE notes
        SET title = ?, content = ?, updated_at = ?
        WHERE id = ?;
      `, [note.title, note.content, now.toISOString(), note.id])
  }

  // Delete a note
  public async deleteNote(id: string): Promise<DuckDBMaterializedResult> {
    return this.db.run(`
        DELETE FROM notes
        WHERE id = ?;
      `, [id])
  }

  // Store vector embedding for a note
  public async storeEmbedding(embedding: embeddedObject, noteId: string): Promise<DuckDBMaterializedResult> {
    const id = uuidv4();
    const query = `
      INSERT OR REPLACE INTO note_embeddings (id, embedding, note_id)
      VALUES (?, [${this.mapEmbeddingToQuery(embedding.embedding)}]::FLOAT[${EMBED_ARRAY_LENGTH}], ?);
    `
    return this.db.run(query, [id, noteId])
  }

  // Search for similar notes using vector similarity
  // DuckDB has native cosine_similarity function
  public async searchSimilarNotes(embedding: number[], limit: number = 5): Promise<NoteDto[]> {
    console.log('embedding', embedding);
    const reader = await this.db.runAndReadAll(
      `
        SELECT notes.id, notes.title, notes.content, notes.created_at, notes.updated_at
        FROM note_embeddings
        JOIN notes ON note_embeddings.id = notes.id
        ORDER BY array_distance(embedding, [${this.mapEmbeddingToQuery(embedding)}]::FLOAT[${EMBED_ARRAY_LENGTH}])
        LIMIT ?
      `, [limit]
    );

    const rows = reader.getRows();
    console.log('rows', rows);
    return rows.map(convertDBRowToNoteDto);
  }

  private mapEmbeddingToQuery(embedding: number[]): string {
    const slicedEmbedding = embedding.splice(0, EMBED_ARRAY_LENGTH).map((value) => `${value}`).join(',');
    console.log('slicedEmbedding', slicedEmbedding);
    return slicedEmbedding;
  }

  // Close the database connection
  public close(): void {
    console.log('Closing database connection');
    this.db.disconnectSync();
  }
}

const convertDBRowToNoteDto = (row: DuckDBValue[]): NoteDto => {
  return {
    id: row[0] as string,
    title: row[1] as string,
    content: row[2] as string,
    created_at: new Date(row[3] as string).getTime() / 1000,
    updated_at: new Date(row[4] as string).getTime() / 1000
  }
}

// Export a singleton instance
export const db = Database.getInstance();
