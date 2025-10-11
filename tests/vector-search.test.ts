import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Mock electron app for testing - must be before imports that use it
jest.mock('electron', () => ({
  app: {
    getPath: () => path.join(__dirname, 'test-data-vector')
  }
}));

import { Database, embeddedObject } from '../src/utilities/db';

/**
 * Helper function to create a simple embedding vector
 * This creates deterministic embeddings for testing purposes
 */
function createTestEmbedding(seed: number, dimension: number = 1536): number[] {
  const embedding: number[] = [];
  for (let i = 0; i < dimension; i++) {
    // Create a deterministic but varied embedding based on seed
    embedding.push(Math.sin(i * seed / 10) * Math.cos(seed));
  }
  return embedding;
}

/**
 * Helper function to create similar embeddings
 * Creates embeddings that are similar to the base embedding
 */
function createSimilarEmbedding(baseEmbedding: number[], similarity: number = 0.9): number[] {
  return baseEmbedding.map((val, idx) => {
    // Add small random variation
    const noise = (Math.random() - 0.5) * (1 - similarity);
    return val + noise;
  });
}

/**
 * Helper function to normalize a vector
 */
function normalizeVector(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  return vector.map(val => val / magnitude);
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }
  
  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  
  return dotProduct / (magnitudeA * magnitudeB);
}

describe('Vector Search Functionality', () => {
  let db: Database;
  const testDbPath = path.join(__dirname, 'test-data-vector');

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

  describe('Vector Similarity Search', () => {
    let baseNoteId: string;
    let similarNoteId: string;
    let differentNoteId: string;
    let baseEmbedding: number[];

    beforeAll(async () => {
      // Clean up any existing test data
      const existingNotes = await db.getNotes();
      for (const note of existingNotes) {
        await db.deleteNoteEmbeddings(note.id);
        await db.deleteNote(note.id);
      }

      // Create test data with known similarities
      baseNoteId = uuidv4();
      similarNoteId = uuidv4();
      differentNoteId = uuidv4();

      // Create base embedding
      baseEmbedding = normalizeVector(createTestEmbedding(42));

      // Create a very similar embedding (should rank high)
      const similarEmbedding = normalizeVector(createSimilarEmbedding(baseEmbedding, 0.95));

      // Create a different embedding (should rank lower)
      const differentEmbedding = normalizeVector(createTestEmbedding(999));

      // Verify our test data has the expected similarity relationships
      const simToSimilar = cosineSimilarity(baseEmbedding, similarEmbedding);
      const simToDifferent = cosineSimilarity(baseEmbedding, differentEmbedding);
      
      console.log('Test data similarity:', { simToSimilar, simToDifferent });
      expect(simToSimilar).toBeGreaterThan(simToDifferent);

      // Create notes
      await db.createNote({
        id: baseNoteId,
        title: 'Machine Learning Basics',
        content: 'Introduction to neural networks and deep learning fundamentals'
      });

      await db.createNote({
        id: similarNoteId,
        title: 'Deep Learning Guide',
        content: 'Understanding neural networks, backpropagation, and training models'
      });

      await db.createNote({
        id: differentNoteId,
        title: 'Cooking Recipes',
        content: 'How to make delicious pasta and Italian cuisine'
      });

      // Store embeddings
      await db.storeEmbedding(
        {
          noteId: baseNoteId,
          idea: 'Machine learning and neural networks',
          embedding: baseEmbedding
        },
        'Machine learning and neural networks',
        baseNoteId
      );

      await db.storeEmbedding(
        {
          noteId: similarNoteId,
          idea: 'Deep learning and training neural networks',
          embedding: similarEmbedding
        },
        'Deep learning and training neural networks',
        similarNoteId
      );

      await db.storeEmbedding(
        {
          noteId: differentNoteId,
          idea: 'Italian cooking and pasta recipes',
          embedding: differentEmbedding
        },
        'Italian cooking and pasta recipes',
        differentNoteId
      );
    });

    test('should find similar notes using vector search', async () => {
      const results = await db.searchSimilarNotes(baseEmbedding, 3);
      
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(3);
      
      // Check that we got some results
      const noteIds = results.map(r => r.noteId);
      expect(noteIds).toContain(baseNoteId);
    });

    test('should return results ordered by similarity', async () => {
      const results = await db.searchSimilarNotes(baseEmbedding, 3);
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      
      // The base note or similar note should appear before the different note
      const baseIdx = results.findIndex(r => r.noteId === baseNoteId);
      const similarIdx = results.findIndex(r => r.noteId === similarNoteId);
      const differentIdx = results.findIndex(r => r.noteId === differentNoteId);
      
      // Either base or similar should appear first
      if (baseIdx !== -1 && differentIdx !== -1) {
        expect(baseIdx).toBeLessThan(differentIdx);
      }
      if (similarIdx !== -1 && differentIdx !== -1) {
        expect(similarIdx).toBeLessThan(differentIdx);
      }
    });

    test('should respect the limit parameter', async () => {
      const limit = 2;
      const results = await db.searchSimilarNotes(baseEmbedding, limit);
      
      expect(results.length).toBeLessThanOrEqual(limit);
    });

    test('should handle search with no results gracefully', async () => {
      // Create a completely different embedding
      const uniqueEmbedding = normalizeVector(createTestEmbedding(9999999));
      
      const results = await db.searchSimilarNotes(uniqueEmbedding, 1);
      
      // Should still return some results (the closest ones)
      expect(Array.isArray(results)).toBe(true);
    });

    test('should return note content with search results', async () => {
      const results = await db.searchSimilarNotes(baseEmbedding, 3);
      
      expect(results.length).toBeGreaterThan(0);
      
      // Check that results contain the expected fields
      results.forEach(result => {
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('idea');
        expect(result).toHaveProperty('noteId');
        expect(result).toHaveProperty('content');
        expect(typeof result.content).toBe('string');
      });
    });
  });

  describe('Multiple Embeddings Per Note', () => {
    let multiNoteId: string;

    beforeAll(async () => {
      multiNoteId = uuidv4();

      await db.createNote({
        id: multiNoteId,
        title: 'Complex Note',
        content: 'This note covers multiple topics: AI, cooking, and travel'
      });

      // Store multiple embeddings for different ideas in the same note
      const aiEmbedding = normalizeVector(createTestEmbedding(100));
      const cookingEmbedding = normalizeVector(createTestEmbedding(200));
      const travelEmbedding = normalizeVector(createTestEmbedding(300));

      await db.storeEmbedding(
        { noteId: multiNoteId, idea: 'Artificial intelligence', embedding: aiEmbedding },
        'Artificial intelligence',
        multiNoteId
      );

      await db.storeEmbedding(
        { noteId: multiNoteId, idea: 'Cooking techniques', embedding: cookingEmbedding },
        'Cooking techniques',
        multiNoteId
      );

      await db.storeEmbedding(
        { noteId: multiNoteId, idea: 'Travel destinations', embedding: travelEmbedding },
        'Travel destinations',
        multiNoteId
      );
    });

    test('should find note through any of its embeddings', async () => {
      // Search with an AI-related embedding
      const aiSearchEmbedding = normalizeVector(createTestEmbedding(101));
      const aiResults = await db.searchSimilarNotes(aiSearchEmbedding, 5);
      
      const foundViaAI = aiResults.some(r => r.noteId === multiNoteId);
      expect(foundViaAI).toBe(true);

      // Search with a cooking-related embedding
      const cookingSearchEmbedding = normalizeVector(createTestEmbedding(201));
      const cookingResults = await db.searchSimilarNotes(cookingSearchEmbedding, 5);
      
      const foundViaCooking = cookingResults.some(r => r.noteId === multiNoteId);
      expect(foundViaCooking).toBe(true);
    });

    test('should return different idea text for different embeddings of same note', async () => {
      const aiSearchEmbedding = normalizeVector(createTestEmbedding(101));
      const results = await db.searchSimilarNotes(aiSearchEmbedding, 5);
      
      const multiNoteResults = results.filter(r => r.noteId === multiNoteId);
      
      if (multiNoteResults.length > 1) {
        // If we got multiple results from the same note, they should have different ideas
        const ideas = multiNoteResults.map(r => r.idea);
        const uniqueIdeas = new Set(ideas);
        expect(uniqueIdeas.size).toBeGreaterThan(1);
      }
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle empty database search', async () => {
      // Create a fresh test database
      const emptyEmbedding = normalizeVector(createTestEmbedding(88888));
      
      // This might return empty or existing results, but shouldn't crash
      const results = await db.searchSimilarNotes(emptyEmbedding, 5);
      expect(Array.isArray(results)).toBe(true);
    });

    test('should handle search with limit of 1', async () => {
      const embedding = normalizeVector(createTestEmbedding(77777));
      const results = await db.searchSimilarNotes(embedding, 1);
      
      expect(results.length).toBeLessThanOrEqual(1);
    });

    test('should handle search with large limit', async () => {
      const embedding = normalizeVector(createTestEmbedding(66666));
      const results = await db.searchSimilarNotes(embedding, 1000);
      
      expect(Array.isArray(results)).toBe(true);
      // Should not return more results than we have embeddings
    });

    test('should handle embeddings with extreme values', async () => {
      const noteId = uuidv4();
      await db.createNote({
        id: noteId,
        title: 'Extreme Values Note',
        content: 'Testing extreme embedding values'
      });

      // Create embedding with large values
      const extremeEmbedding = Array.from({ length: 1536 }, () => 
        (Math.random() - 0.5) * 1000
      );

      const embeddingObj: embeddedObject = {
        noteId: noteId,
        idea: 'Extreme value test',
        embedding: extremeEmbedding
      };

      await expect(
        db.storeEmbedding(embeddingObj, 'Extreme value test', noteId)
      ).resolves.not.toThrow();

      // Should be able to search with it too
      const results = await db.searchSimilarNotes(extremeEmbedding, 5);
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Embedding Dimension Tests', () => {
    test('should handle 1536-dimensional embeddings correctly', async () => {
      const noteId = uuidv4();
      await db.createNote({
        id: noteId,
        title: 'Full Dimension Test',
        content: 'Testing full 1536 dimensions'
      });

      const fullEmbedding = createTestEmbedding(12345, 1536);
      expect(fullEmbedding.length).toBe(1536);

      const embeddingObj: embeddedObject = {
        noteId: noteId,
        idea: 'Full 1536-dimensional embedding',
        embedding: fullEmbedding
      };

      await expect(
        db.storeEmbedding(embeddingObj, 'Full 1536-dimensional embedding', noteId)
      ).resolves.not.toThrow();

      // Verify we can search with full dimensions
      const results = await db.searchSimilarNotes(fullEmbedding, 5);
      expect(Array.isArray(results)).toBe(true);
      
      const found = results.some(r => r.noteId === noteId);
      expect(found).toBe(true);
    });
  });
});

