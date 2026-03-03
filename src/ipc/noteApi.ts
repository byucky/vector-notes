import { getIpcInvoke } from './electronBridge';
import { Note } from '../domain/note';
import type { NoteEmbeddingDto } from './dto';

export const noteApi = {
  async getNotes(): Promise<Note[]> {
    const invoke = getIpcInvoke();
    const notes = (await invoke('get-notes')) as any[];
    return (notes ?? []).map(
      (note) => new Note(note.id, note.title, note.content, note.created_at, note.updated_at)
    );
  },

  async getNote(id: string): Promise<Note | null> {
    const invoke = getIpcInvoke();
    const note = (await invoke('get-note', id)) as any;
    if (!note) return null;
    return new Note(note.id, note.title, note.content, note.created_at, note.updated_at);
  },

  async createNote(note: { id: string; title: string; content: string }): Promise<boolean> {
    const invoke = getIpcInvoke();
    await invoke('create-note', note);
    return true;
  },

  async updateNote(note: { id: string; title: string; content: string }): Promise<boolean> {
    const invoke = getIpcInvoke();
    await invoke('update-note', note);
    return true;
  },

  async deleteNote(id: string): Promise<boolean> {
    const invoke = getIpcInvoke();
    await invoke('delete-note', id);
    return true;
  },

  async embedNote(note: Note): Promise<boolean> {
    const invoke = getIpcInvoke();
    await invoke('embed-note', note);
    return true;
  },

  async searchSimilarNotes(query: string): Promise<NoteEmbeddingDto[]> {
    const invoke = getIpcInvoke();
    return (await invoke('search-similar-notes', query)) as NoteEmbeddingDto[];
  },
};

