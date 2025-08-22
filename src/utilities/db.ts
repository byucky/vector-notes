import * as sqliteVec from "sqlite-vec";
import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import BetterSqlite3 from 'better-sqlite3';


// Define the database path
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'notes.db');

export interface embeddedObject {
  object: string;
  embedding: number[];
  index: number;
}

// Database class to handle all SQLite operations
export class Database {
  private db: BetterSqlite3.Database;
  private static instance: Database;

  private constructor() {
    // Create the database directory if it doesn't exist
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Initialize the database
    this.db = new BetterSqlite3(dbPath);

    // Load the vector search extension
    try {
      sqliteVec.load(this.db);
      const { vec_version } = this.db.prepare('select vec_version() as vec_version').get() as { vec_version: string };
      console.log('sqlite-vec extension loaded successfully', vec_version);
      
      // Test if vec_distance function is available
      try {
        this.db.prepare('SELECT vec_distance(?, ?)').get(Buffer.from([0, 0, 0]), Buffer.from([0, 0, 0]));
        console.log('vec_distance function is available');
      } catch (testError) {
        console.error('vec_distance function test failed:', testError);
        throw new Error('Vector functions not properly loaded');
      }
    } catch (error) {
      console.error('Failed to load VSS extension:', error);
      throw error;
    }

    // Enable foreign keys
    this.db.pragma('foreign_keys = ON');

    // Initialize the database schema
    this.initSchema();
  }

  // Singleton pattern to ensure only one database connection
  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  // Initialize the database schema
  private initSchema(): void {
    // Create notes table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL
      )
    `);

    // Create note_embeddings table for vector storage
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS note_embeddings (
        id TEXT PRIMARY KEY,
        embedding BLOB NOT NULL,
        FOREIGN KEY (id) REFERENCES notes(id) ON DELETE CASCADE
      )
    `);

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC)
    `);
  }

  // Get all notes
  public getNotes(): any[] {
    const stmt = this.db.prepare(`
      SELECT id, title, content, created_at, updated_at
      FROM notes
      ORDER BY updated_at DESC
    `);
    return stmt.all();
  }

  // Get a note by ID
  public getNote(id: string): any {
    const stmt = this.db.prepare(`
      SELECT id, title, content, created_at, updated_at
      FROM notes
      WHERE id = ?
    `);
    return stmt.get(id);
  }

  // Create a new note
  public createNote(note: { id: string, title: string, content: string }): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      INSERT INTO notes (id, title, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(note.id, note.title, note.content, now, now);
  }

  // Update an existing note
  public updateNote(note: { id: string, title: string, content: string }): void {
    const now = Date.now();
    const stmt = this.db.prepare(`
      UPDATE notes
      SET title = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(note.title, note.content, now, note.id);
  }

  // Delete a note
  public deleteNote(id: string): void {
    const stmt = this.db.prepare(`
      DELETE FROM notes
      WHERE id = ?
    `);
    stmt.run(id);
  }

  // Store vector embedding for a note
  public storeEmbedding(id: string, embedding: embeddedObject[]): void {
    // Convert the embedding array to a single vector
    // Flatten the array of embeddedObject arrays into a single number array
    const flatEmbedding: number[] = [];
    embedding.forEach(obj => {
      flatEmbedding.push(...obj.embedding);
    });

    // Convert the embedding to a BLOB for storage
    const embeddingBuffer = Buffer.from(new Float64Array(flatEmbedding).buffer);

    // Insert or replace the embedding
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO note_embeddings (id, embedding)
      VALUES (?, ?)
    `);
    stmt.run(id, embeddingBuffer);
  }

  // Search for similar notes using vector similarity
  public searchSimilarNotes(embedding: number[], limit: number = 5): any[] {
    // Convert the embedding to a BLOB for comparison
    const embeddingBuffer = Buffer.from(new Float64Array(embedding).buffer);

    const stmt = this.db.prepare(`
      SELECT notes.id, notes.title, notes.content, notes.created_at, notes.updated_at,
             vec_distance(note_embeddings.embedding, ?) as distance
      FROM note_embeddings
      JOIN notes ON note_embeddings.id = notes.id
      ORDER BY distance ASC
      LIMIT ?
    `);
    return stmt.all(embeddingBuffer, limit);
  }

  // Close the database connection
  public close(): void {
    this.db.close();
  }
}

// Export a singleton instance
export const db = Database.getInstance();
