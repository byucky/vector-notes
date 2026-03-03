import { BehaviorSubject, Observable } from 'rxjs';
import { Note } from '../domain/note';
import type { NoteEmbeddingDto } from '../ipc/dto';
import { noteApi } from '../ipc/noteApi';

export interface NoteState {
  notes: Note[];
  selectedNote: Note | null;
  searchResults: NoteEmbeddingDto[];
  loading: boolean;
}

class NoteStore {
  private stateSubject = new BehaviorSubject<NoteState>({
    notes: [],
    selectedNote: null,
    searchResults: [],
    loading: false,
  });

  public state$: Observable<NoteState> = this.stateSubject.asObservable();

  getState(): NoteState {
    return this.stateSubject.value;
  }

  private updateState(partialState: Partial<NoteState>): void {
    const currentState = this.getState();
    this.stateSubject.next({ ...currentState, ...partialState });
  }

  async loadNotes(): Promise<void> {
    this.updateState({ loading: true });
    try {
      const notes = await noteApi.getNotes();
      this.updateState({ notes, loading: false });
    } catch (error) {
      console.error('Error loading notes:', error);
      this.updateState({ notes: [], loading: false });
    }
  }

  async selectNote(noteId: string): Promise<void> {
    const currentState = this.getState();

    if (currentState.selectedNote) {
      void this.embedNoteIfChanged(currentState.selectedNote);
    }

    const noteInMemory = currentState.notes.find((n) => n.id === noteId);
    if (noteInMemory) {
      this.updateState({ selectedNote: noteInMemory });
      return;
    }

    this.updateState({ loading: true });
    try {
      const fetched = await noteApi.getNote(noteId);
      this.updateState({ selectedNote: fetched, loading: false });
    } catch (error) {
      console.error('Error fetching note:', error);
      this.updateState({ selectedNote: null, loading: false });
    }
  }

  async createNote(): Promise<void> {
    const newNoteId = this.generateNoteId();
    const newNote = { id: newNoteId, title: '', content: '' };

    try {
      const success = await noteApi.createNote(newNote);
      if (!success) return;

      await this.loadNotes();
      this.updateState({ selectedNote: new Note(newNoteId, '', '') });
    } catch (error) {
      console.error('Error creating new note:', error);
    }
  }

  async updateNote(updatedNote: Note): Promise<void> {
    try {
      const success = await noteApi.updateNote({
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content,
      });
      if (!success) return;

      const currentState = this.getState();
      const updatedNotes = currentState.notes.map((n) => (n.id === updatedNote.id ? updatedNote : n));
      this.updateState({ notes: updatedNotes, selectedNote: updatedNote });
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }

  async deleteNote(noteId: string): Promise<void> {
    try {
      const success = await noteApi.deleteNote(noteId);
      if (!success) return;

      const currentState = this.getState();
      const notes = currentState.notes.filter((n) => n.id !== noteId);
      const selectedNote = currentState.selectedNote?.id === noteId ? null : currentState.selectedNote;
      this.updateState({ notes, selectedNote });
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  clearSelection(): void {
    this.updateState({ selectedNote: null });
  }

  setSearchResults(searchResults: NoteEmbeddingDto[]): void {
    this.updateState({ searchResults });
  }

  clearSearchResults(): void {
    this.updateState({ searchResults: [] });
  }

  async search(query: string, limit?: number): Promise<void> {
    try {
      const results = await noteApi.searchSimilarNotes(query);
      this.setSearchResults((results ?? []).slice(0, limit ?? results.length));
    } catch (error) {
      console.error('Search error:', error);
      this.setSearchResults([]);
    }
  }

  private async embedNoteIfChanged(note: Note): Promise<void> {
    try {
      if (note.has_changed) {
        await noteApi.embedNote(note);
      }
    } catch (error) {
      console.error(`Error embedding note ${note.id}:`, error);
    }
  }

  private generateNoteId(): string {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).slice(2, 11);
  }
}

export const noteStore = new NoteStore();
export type { Note };

