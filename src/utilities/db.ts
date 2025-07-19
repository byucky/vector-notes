import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import BetterSqlite3 from 'better-sqlite3';
import sqliteVss from 'sqlite-vss';

// Define the database path
const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'notes.db');

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
      sqliteVss.load(this.db);
      console.log('VSS extension loaded successfully');
    } catch (error) {
      console.warn('Failed to load VSS extension:', error);
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

    // Create vector embeddings table (only if VSS extension is available)
    try {
      this.db.exec(`
        CREATE VIRTUAL TABLE IF NOT EXISTS note_embeddings USING vss0(
          embedding(1536),
          id TEXT,
          FOREIGN KEY(id) REFERENCES notes(id) ON DELETE CASCADE
        )
      `);
      console.log('Vector embeddings table created successfully');
    } catch (error) {
      console.warn('Failed to create vector embeddings table:', error);
    }

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
  public storeEmbedding(id: string, embedding: number[]): void {
    // First delete any existing embedding for this note
    const deleteStmt = this.db.prepare(`
      DELETE FROM note_embeddings
      WHERE id = ?
    `);
    deleteStmt.run(id);

    // Then insert the new embedding
    const insertStmt = this.db.prepare(`
      INSERT INTO note_embeddings (id, embedding)
      VALUES (?, ?)
    `);
    insertStmt.run(id, embedding);
  }

  // Search for similar notes using vector similarity
  public searchSimilarNotes(embedding: number[], limit: number = 5): any[] {
    const stmt = this.db.prepare(`
      SELECT notes.id, notes.title, notes.content, notes.created_at, notes.updated_at
      FROM note_embeddings
      JOIN notes ON note_embeddings.id = notes.id
      ORDER BY vss_search(note_embeddings.embedding, ?) DESC
      LIMIT ?
    `);
    return stmt.all(embedding, limit);
  }

  // Close the database connection
  public close(): void {
    this.db.close();
  }
}

// Export a singleton instance
export const db = Database.getInstance();
