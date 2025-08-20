import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Note } from '../components/note-editor/note';
import { NoteService } from './note.service';

export interface NoteState {
  notes: Note[];
  selectedNote: Note | null;
  loading: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NoteStateService {
  private stateSubject = new BehaviorSubject<NoteState>({
    notes: [],
    selectedNote: null,
    loading: false
  });

  public state$: Observable<NoteState> = this.stateSubject.asObservable();

  constructor(
    private noteService: NoteService,
  ) {}

  /**
   * Get the current state
   */
  getState(): NoteState {
    return this.stateSubject.value;
  }

  /**
   * Load all notes
   */
  async loadNotes(): Promise<void> {
    this.updateState({ loading: true });
    
    try {
      const notes = await this.noteService.getNotes();
      this.updateState({ 
        notes, 
        loading: false 
      });
    } catch (error) {
      console.error('Error loading notes:', error);
      this.updateState({ 
        notes: [], 
        loading: false 
      });
    }
  }

  /**
   * Select a note by ID
   */
  async selectNote(noteId: string): Promise<void> {
    const currentState = this.getState();
    
    // If there's a currently selected note with changes, embed it before switching
    if (currentState.selectedNote) {
      await this.embedNote(currentState.selectedNote);
    }
    
    const note = currentState.notes.find(n => n.id === noteId);
    
    if (note) {
      // If the note is already in memory, use it
      this.updateState({ selectedNote: note });
    } else {
      // If not in memory, fetch it from the database
      this.updateState({ loading: true });
      try {
        const fetchedNote = await this.noteService.getNote(noteId);
        this.updateState({ 
          selectedNote: fetchedNote, 
          loading: false 
        });
      } catch (error) {
        console.error('Error fetching note:', error);
        this.updateState({ 
          selectedNote: null, 
          loading: false 
        });
      }
    }
  }

  /**
   * Create a new note
   */
  async createNote(): Promise<void> {
    const newNoteId = this.generateNoteId();
    const newNote = {
      id: newNoteId,
      title: '',
      content: ''
    };
    
    try {
      const success = await this.noteService.createNote(newNote);
      if (success) {
        // Reload notes to get the updated list
        await this.loadNotes();
        
        // Select the new note
        const note = new Note(newNoteId, '', '');
        this.updateState({ selectedNote: note });
      }
    } catch (error) {
      console.error('Error creating new note:', error);
    }
  }

  /**
   * Update the current note
   */
  async updateNote(updatedNote: Note): Promise<void> {
    try {
      const success = await this.noteService.updateNote({
        id: updatedNote.id,
        title: updatedNote.title,
        content: updatedNote.content
      });
      
      if (success) {
        // Update the note in the state
        const currentState = this.getState();
        const updatedNotes = currentState.notes.map(note => 
          note.id === updatedNote.id ? updatedNote : note
        );
        
        this.updateState({ 
          notes: updatedNotes,
          selectedNote: updatedNote 
        });
      }
    } catch (error) {
      console.error('Error updating note:', error);
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(noteId: string): Promise<void> {
    try {
      const success = await this.noteService.deleteNote(noteId);
      if (success) {
        const currentState = this.getState();
        const updatedNotes = currentState.notes.filter(note => note.id !== noteId);
        
        // If the deleted note was selected, clear the selection
        const selectedNote = currentState.selectedNote?.id === noteId ? null : currentState.selectedNote;
        
        this.updateState({ 
          notes: updatedNotes,
          selectedNote 
        });
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  }

  /**
   * Clear the selected note
   */
  async clearSelection(): Promise<void> {
    const currentState = this.getState();
    
    // If there's a currently selected note embed it before clearing
    if (currentState.selectedNote) {
      await this.embedNote(currentState.selectedNote);
    }
    
    this.updateState({ selectedNote: null });
  }

  /**
   * Embed a note if it has changed
   */
  private async embedNote(note: Note): Promise<void> {
    try {
      console.log(`Embedding note ${note.id}`);
      
      // Embed the note
      await this.noteService.processNote(note);
    } catch (error) {
      console.error(`Error embedding note ${note.id}:`, error);
    }
  }

  /**
   * Manually trigger embedding for the current note
   */
  async embedCurrentNote(): Promise<void> {
    const currentState = this.getState();
    if (currentState.selectedNote) {
      await this.embedNote(currentState.selectedNote);
    }
  }

  /**
   * Generate a unique note ID
   */
  private generateNoteId(): string {
    return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Update the state
   */
  private updateState(partialState: Partial<NoteState>): void {
    const currentState = this.getState();
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }
} 