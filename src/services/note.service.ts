import { Injectable } from '@angular/core';
import { ipcRenderer } from 'electron';
import { Note } from '../components/note-editor/note';

@Injectable({
  providedIn: 'root'
})
export class NoteService {
  private ipcRenderer: typeof ipcRenderer;

  constructor() {
    // Access ipcRenderer from the global window object
    this.ipcRenderer = (window as any).require('electron').ipcRenderer;
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
}