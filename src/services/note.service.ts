import { Injectable } from '@angular/core';
import { Note } from '../components/note-editor/note';

// Define the type for the exposed electron API
declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        invoke(channel: string, ...args: any[]): Promise<any>;
      };
    };
  }
}

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private ipcRenderer: Window['electron']['ipcRenderer'];

  constructor() {
    // Access ipcRenderer from the contextBridge
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  /**
   * Get all notes from the database
   */
  async getNotes(): Promise<Note[]> {
    try {
      const notes = await this.ipcRenderer.invoke('get-notes');
      return notes.map((note: any) => new Note(
        note.id,
        note.title,
        note.content,
        note.created_at,
        note.updated_at
      ));
    } catch (error) {
      console.error('Error getting notes:', error);
      return [];
    }
  }

  /**
   * Get a specific note by ID
   */
  async getNote(id: string): Promise<Note | null> {
    try {
      const note = await this.ipcRenderer.invoke('get-note', id);
      if (note) {
        return new Note(
          note.id,
          note.title,
          note.content,
          note.created_at,
          note.updated_at
        );
      }
      return null;
    } catch (error) {
      console.error('Error getting note:', error);
      return null;
    }
  }

  /**
   * Create a new note
   */
  async createNote(note: { id: string, title: string, content: string }): Promise<boolean> {
    try {
      await this.ipcRenderer.invoke('create-note', note);
      return true;
    } catch (error) {
      console.error('Error creating note:', error);
      return false;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(note: { id: string, title: string, content: string }): Promise<boolean> {
    try {
      await this.ipcRenderer.invoke('update-note', note);
      return true;
    } catch (error) {
      console.error('Error updating note:', error);
      return false;
    }
  }

  /**
   * Delete a note
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      await this.ipcRenderer.invoke('delete-note', id);
      return true;
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  async processNote(note: Note): Promise<boolean> {
    try {
      await this.ipcRenderer.invoke('embed-note', note);
      return true;
    } catch (error) {
      console.error('Error embedding note:', error);
      return false;
    }
  }

  async searchSimilarNotes(query: string): Promise<Note[]> {
    try {
      return await this.ipcRenderer.invoke('search-similar-notes', query);
    } catch (error) {
      console.error('Error searching for similar notes:', error);
      return [];
    }
  }
}