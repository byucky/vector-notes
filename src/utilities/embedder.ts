import { Note } from "../domain/note";
import { embeddedObject, db } from "./db";
import { NoteEmbeddingDto } from "./dtoUtility";
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

let cachedOpenAiClient: OpenAI | null = null;
let cachedOpenAiClientApiKey: string | null = null;

const getOpenAIApiKey = (): string | null => {
    const settings = loadSettings();
    const key = settings?.openaiApiKey;
    if (typeof key !== 'string') return null;
    const trimmed = key.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const getOpenAiClient = (): OpenAI => {
    const apiKey = getOpenAIApiKey();
    if (!apiKey) {
        throw new Error('OpenAI API key not found');
    }

    if (!cachedOpenAiClient || cachedOpenAiClientApiKey !== apiKey) {
        cachedOpenAiClient = new OpenAI({ apiKey });
        cachedOpenAiClientApiKey = apiKey;
    }

    return cachedOpenAiClient;
};

/**
  * Embed Ideas
  * Converts note content into vector embeddings for similarity search
  * 
  * @param note The note to embed
  * @returns Promise<EmbeddingResult> - Vector embedding and metadata
  */
export const processNote = async (note: Note): Promise<void> => {

    const openaikey = getOpenAIApiKey();
    if (!openaikey) {
        console.warn('Skipping note embedding: OpenAI API key not configured');
        return;
    }

    const noteIdeas = await splitNoteIdeas(note);
    const embeddings = await embedIdeas(noteIdeas, note.id);

    // remove old embeddings.
    db.deleteNoteEmbeddings(note.id);

    for (const embedding of embeddings) {
        await db.storeEmbedding(embedding, embedding.idea, note.id);
    }
    console.log('Finished embedding note');
}

const splitNoteIdeas = async (note: Note): Promise<string[]> => {
    const openAiClient = getOpenAiClient();
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
    const openAiClient = getOpenAiClient();
    const allRequests = await openAiClient.embeddings.create({
        model: 'text-embedding-3-small',
        input: ideas
    });
    
    const embeddings: embeddedObject[] = allRequests.data.map((embedding, index) => {
        return {
            idea: ideas[index],
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
export const searchSimilarNotes = async (query: string, limit: number = 5): Promise<NoteEmbeddingDto[]> => {
    try {
        console.log('Finding similar notes for:', query);

        // First, embed the search query to get its vector representation
        const queryEmbedding = await embedQuery(query);
        
        // Use the database's vector similarity search
        const similarNotes = await db.searchSimilarNotes(queryEmbedding, limit);

        console.log(similarNotes);

        return similarNotes;
    } catch (error) {
        console.error('Error finding similar notes:', error);
        return [];
    }
}

/**
 * Embed a single query string for similarity search
 * 
 * @param query The search query to embed
 * @returns Promise<number[]> - Vector embedding of the query
 */
const embedQuery = async (query: string): Promise<number[]> => {
    const openaikey = getOpenAIApiKey();
    if (!openaikey) {
        throw new Error('OpenAI API key not found');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openaikey}`
        },
        body: JSON.stringify({
            model: 'text-embedding-3-small',
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
