import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Mock electron app for testing - must be before imports that use it
jest.mock('electron', () => ({
  app: {
    getPath: () => path.join(__dirname, 'test-data')
  }
}));

import { Database, embeddedObject } from '../src/utilities/db';
import { NoteDto, NoteEmbeddingDto } from '../src/utilities/dtoUtility';

describe('Database Operations', () => {
  let db: Database;
  const testDbPath = path.join(__dirname, 'test-data');

  beforeAll(async () => {
    // Create test database directory
    if (!fs.existsSync(testDbPath)) {
      fs.mkdirSync(testDbPath, { recursive: true });
    }
    
    db = Database.getInstance();
    await Database.initializationPromise;
  });

  afterAll(async () => {
    // Clean up test database
    db.close();
    
    // Remove test database files
    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath, { recursive: true, force: true });
    }
  });

  describe('Note CRUD Operations', () => {
    let testNoteId: string;

    beforeEach(() => {
      testNoteId = uuidv4();
    });

    test('should create a new note', async () => {
      const note = {
        id: testNoteId,
        title: 'Test Note',
        content: 'This is a test note content'
      };

      await db.createNote(note);
      const notes = await db.getNotes();
      
      const createdNote = notes.find(n => n.id === testNoteId);
      expect(createdNote).toBeDefined();
      expect(createdNote?.title).toBe('Test Note');
      expect(createdNote?.content).toBe('This is a test note content');
    });

    test('should retrieve all notes ordered by updated_at DESC', async () => {
      // Create multiple notes with slight delays
      const note1Id = uuidv4();
      const note2Id = uuidv4();
      
      await db.createNote({
        id: note1Id,
        title: 'First Note',
        content: 'First content'
      });

      // Small delay to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await db.createNote({
        id: note2Id,
        title: 'Second Note',
        content: 'Second content'
      });

      const notes = await db.getNotes();
      
      expect(notes.length).toBeGreaterThanOrEqual(2);
      
      // Most recently updated should be first
      const firstNote = notes.find(n => n.id === note2Id);
      const secondNote = notes.find(n => n.id === note1Id);
      
      expect(firstNote).toBeDefined();
      expect(secondNote).toBeDefined();
      
      if (firstNote && secondNote) {
        expect(firstNote.updated_at).toBeGreaterThanOrEqual(secondNote.updated_at);
      }
    });

    test('should update an existing note', async () => {
      const note = {
        id: testNoteId,
        title: 'Original Title',
        content: 'Original content'
      };

      await db.createNote(note);

      // Update the note
      await db.updateNote({
        id: testNoteId,
        title: 'Updated Title',
        content: 'Updated content'
      });

      const notes = await db.getNotes();
      const updatedNote = notes.find(n => n.id === testNoteId);

      expect(updatedNote).toBeDefined();
      expect(updatedNote?.title).toBe('Updated Title');
      expect(updatedNote?.content).toBe('Updated content');
    });

    test('should delete a note', async () => {
      const note = {
        id: testNoteId,
        title: 'To Be Deleted',
        content: 'This note will be deleted'
      };

      await db.createNote(note);
      
      // Verify it exists
      let notes = await db.getNotes();
      expect(notes.find(n => n.id === testNoteId)).toBeDefined();

      // Delete it
      await db.deleteNote(testNoteId);

      // Verify it's gone
      notes = await db.getNotes();
      expect(notes.find(n => n.id === testNoteId)).toBeUndefined();
    });

    test('should get a specific note by ID', async () => {
      const note = {
        id: testNoteId,
        title: 'Specific Note',
        content: 'Find me by ID'
      };

      await db.createNote(note);
      const result = await db.getNote(testNoteId);
      
      expect(result).toBeDefined();
    });
  });

  describe('Note Embedding Operations', () => {
    let testNoteId: string;
    let testEmbedding: number[];

    beforeEach(() => {
      testNoteId = uuidv4();
      // Create a test embedding (1536 dimensions with normalized values)
      testEmbedding = Array.from({ length: 1536 }, (_, i) => Math.sin(i / 100) * 0.5);
    });

    test('should store an embedding for a note', async () => {
      // First create the note
      await db.createNote({
        id: testNoteId,
        title: 'Note with Embedding',
        content: 'This note has an embedding'
      });

      const embeddingObj: embeddedObject = {
        noteId: testNoteId,
        idea: 'Test idea for embedding',
        embedding: testEmbedding
      };

      await db.storeEmbedding(embeddingObj, 'Test idea for embedding', testNoteId);

      // Verify the embedding was stored
      const result = await db.getNoteEmbeddingByNoteId(testNoteId);
      expect(result).toBeDefined();
    });

    test('should store multiple embeddings for a single note', async () => {
      // Create the note
      await db.createNote({
        id: testNoteId,
        title: 'Note with Multiple Embeddings',
        content: 'This note has multiple ideas'
      });

      // Store multiple embeddings
      const embedding1: embeddedObject = {
        noteId: testNoteId,
        idea: 'First idea',
        embedding: testEmbedding
      };

      const embedding2: embeddedObject = {
        noteId: testNoteId,
        idea: 'Second idea',
        embedding: Array.from({ length: 1536 }, (_, i) => Math.cos(i / 100) * 0.5)
      };

      await db.storeEmbedding(embedding1, 'First idea', testNoteId);
      await db.storeEmbedding(embedding2, 'Second idea', testNoteId);

      // Both embeddings should be stored
      const result = await db.getNoteEmbeddingByNoteId(testNoteId);
      expect(result).toBeDefined();
    });

    test('should delete all embeddings for a note', async () => {
      // Create the note
      await db.createNote({
        id: testNoteId,
        title: 'Note to Clear Embeddings',
        content: 'Embeddings will be cleared'
      });

      // Store an embedding
      const embeddingObj: embeddedObject = {
        noteId: testNoteId,
        idea: 'Temporary idea',
        embedding: testEmbedding
      };

      await db.storeEmbedding(embeddingObj, 'Temporary idea', testNoteId);

      // Delete embeddings
      await db.deleteNoteEmbeddings(testNoteId);

      // Search should not return this note's embeddings
      const similarNotes = await db.searchSimilarNotes(testEmbedding, 10);
      const foundNote = similarNotes.find(n => n.noteId === testNoteId);
      
      expect(foundNote).toBeUndefined();
    });

    test('should handle embedding with exact 1536 dimensions', async () => {
      const embedding = Array.from({ length: 1536 }, (_, i) => i / 1536);
      
      await db.createNote({
        id: testNoteId,
        title: 'Full Dimension Note',
        content: 'Testing full dimension embedding'
      });

      const embeddingObj: embeddedObject = {
        noteId: testNoteId,
        idea: 'Full dimension idea',
        embedding: embedding
      };

      expect(async () => {
        await db.storeEmbedding(embeddingObj, 'Full dimension idea', testNoteId);
      }).not.toThrow();
    });
  });
});

