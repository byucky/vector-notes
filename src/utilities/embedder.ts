import { Note } from "../components/note-editor/note";
import { embeddedObject, db } from "./db";
import { loadSettings } from "./settings";


export interface EmbeddingResult {
    noteId: string;
    embedding: number[];
    success: boolean;
    error?: string;
}

export interface CategorizationResult {
    noteId: string;
    categories: string[];
    confidence: number;
    success: boolean;
    error?: string;
}

/**
  * Embed Ideas
  * Converts note content into vector embeddings for similarity search
  * 
  * @param note The note to embed
  * @returns Promise<EmbeddingResult> - Vector embedding and metadata
  */
export const processNote = async (note: Note): Promise<void> => {

    const settings = loadSettings();
    const openaikey = settings.openaiApiKey;

    if (!openaikey) {
        throw new Error('OpenAI API key not found');
    }

    const noteIdeas = await splitNoteIdeas(note, openaikey);
    const embeddings = await embedIdeas(noteIdeas, openaikey);

    db.storeEmbedding(note.id, embeddings); // Store the embedding in the database
}

const splitNoteIdeas = async (note: Note, openaikey: string): Promise<string[]> => {
    const basePrompt = `
    You are a helpful assistant that splits a note into separate ideas.
    The note is titled: ${note.title}
    The note content is: ${note.content}
    Group any common themes into a stringified array of strings that can be parsed by JSON.parse.

    Do not include any other text in your response.
    `;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaikey}`
        },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: basePrompt }],
            temperature: 0.7
        })
    });

    const data = await response.json();

    const ideas = JSON.parse(data.choices[0].message.content) as string[];

    return ideas;
}

const embedIdeas = async (ideas: string[], openaikey: string): Promise<embeddedObject[]> => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaikey}`
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: ideas
        })
    });

    if (!response.ok) {
        throw new Error('Failed to embed ideas');
    }

    const data = await response.json();
    return data.data as embeddedObject[];
}

/**
  * Find similar notes based on embedding similarity
  * 
  * @param note The reference note
  * @param allNotes Array of all notes to search through
  * @param limit Maximum number of similar notes to return
  * @returns Promise<Note[]> - Array of similar notes sorted by similarity
  */
export const searchSimilarNotes = async (query: string, limit: number = 5): Promise<Note[]> => {
    try {
        // TODO: Implement similarity search
        // This could involve:
        // 1. Computing cosine similarity between embeddings
        // 2. Using the VSS extension in SQLite for vector search
        // 3. Implementing k-nearest neighbors algorithm
        // 4. Filtering out the reference note itself

        console.log('Finding similar notes for:', query);

        // Placeholder implementation
        return [];
    } catch (error) {
        console.error('Error finding similar notes:', error);
        return [];
    }
}
