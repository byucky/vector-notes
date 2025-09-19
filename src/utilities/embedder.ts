import { Note } from "../components/note-editor/note";
import { embeddedObject, db } from "./db";
import { loadSettings } from "./settings";
import OpenAI from "openai";


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

const openAiClient = new OpenAI({
    apiKey: loadSettings().openaiApiKey
});

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

    const noteIdeas = await splitNoteIdeas(note);
    const embeddings = await embedIdeas(noteIdeas, note.id);

    for (const embedding of embeddings) {
        await db.storeEmbedding(embedding, note.id); // Store the embedding in the database
    }
    console.log('Finished embedding note');
}

const splitNoteIdeas = async (note: Note): Promise<string[]> => {
    const basePrompt = `
    You are a helpful assistant that splits a note into separate ideas.
    The note is titled: ${note.title}
    The note content is: ${note.content}
    Group any common themes into a stringified array of strings that can be parsed by JSON.parse.

    Do not include any other text in your response.
    `;

    const response = await openAiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: basePrompt }],
        temperature: 0.7
    });

    const ideas = JSON.parse(response.choices[0].message.content as string);

    return ideas;
}

const embedIdeas = async (ideas: string[], noteId: string): Promise<embeddedObject[]> => {
    const allRequests = await openAiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: ideas
    });
    
    const embeddings: embeddedObject[] = allRequests.data.map((embedding) => {
        return {
            noteId: noteId,
            embedding: embedding.embedding,
        }
    });

    return embeddings;
}

/**
  * Find similar notes based on embedding similarity
  * 
  * @param query The search query string
  * @param limit Maximum number of similar notes to return
  * @returns Promise<Note[]> - Array of similar notes sorted by similarity
  */
export const searchSimilarNotes = async (query: string, limit: number = 5): Promise<Note[]> => {
    try {
        console.log('Finding similar notes for:', query);

        // Load settings to get OpenAI API key
        const settings = loadSettings();
        const openaikey = settings.openaiApiKey;

        if (!openaikey) {
            throw new Error('OpenAI API key not found');
        }

        // First, embed the search query to get its vector representation
        const queryEmbedding = await embedQuery(query, openaikey);
        
        // Use the database's vector similarity search
        const similarNotes = await db.searchSimilarNotes(queryEmbedding, limit);

        console.log('similarNotes', similarNotes);
        
        // Convert the database results to Note objects
        // const notes: Note[] = similarNotes.map((noteData: any) => {
        //     return new Note(
        //         noteData.id,
        //         noteData.title,
        //         noteData.content,
        //         noteData.created_at,
        //         noteData.updated_at
        //     );
        // });

        return [];
    } catch (error) {
        console.error('Error finding similar notes:', error);
        return [];
    }
}

/**
 * Embed a single query string for similarity search
 * 
 * @param query The search query to embed
 * @param openaikey OpenAI API key
 * @returns Promise<number[]> - Vector embedding of the query
 */
const embedQuery = async (query: string, openaikey: string): Promise<number[]> => {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaikey}`
        },
        body: JSON.stringify({
            model: 'text-embedding-ada-002',
            input: query
        })
    });

    if (!response.ok) {
        throw new Error('Failed to embed query');
    }

    const data = await response.json();
    
    // Extract the embedding vector from the response
    if (data.data && data.data.length > 0) {
        return data.data[0].embedding;
    } else {
        throw new Error('No embedding data received from OpenAI');
    }
}
