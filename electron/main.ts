// Import necessary modules
import { ipcMain } from 'electron';
import { db, Database } from '../src/utilities/db';
import { AppSettings } from '../src/services/settings.service';
import { loadSettings, saveSettings } from '../src/utilities/settings';
import { processNote, searchSimilarNotes } from '../src/utilities/embedder';
import { Note } from '../src/components/note-editor/note';


// Set up IPC handlers
ipcMain.handle('get-settings', () => {
  const settings = loadSettings();
  return settings;
});

ipcMain.handle('save-settings', (_, settings: AppSettings) => {
  saveSettings(settings);
  return true;
});

// Database IPC handlers
ipcMain.handle('get-notes', async () => {
  try {
    return db.getNotes();
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
});

ipcMain.handle('get-note', async (_, id: string) => {
  try {
    const note = await db.getNote(id);
    return note;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
});

ipcMain.handle('create-note', async (_, note: { id: string, title: string, content: string }) => {
  try {
    await db.createNote(note);
    return true;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
});

ipcMain.handle('update-note', async (_, note: { id: string, title: string, content: string }) => {
  try {
    await db.updateNote(note);
    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
});

ipcMain.handle('delete-note', async (_, id: string) => {
  try {
    await db.deleteNote(id);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
});

ipcMain.handle('embed-note', async (_, note: Note) => {
  try {
    await processNote(note);
    return true;
  } catch (error) {
    console.error('Error embedding note:', error);
    throw error;
  }
});

ipcMain.handle('search-similar-notes', async (_, query: string) => {
  try {
    const similarNotes = await searchSimilarNotes(query);
    console.log('similarNotes', similarNotes);
    return similarNotes;
  } catch (error) {
    console.error('Error searching for similar notes:', error);
    throw error;
  }
});

// Database initialization function - will be called from main.js
export async function initializeDatabase() {
  try {
    // Just accessing the db singleton will initialize it
    Database.getInstance();
    await Database.initializationPromise;
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Database cleanup function - will be called from main.js
export function cleanupDatabase() {
  try {
    db.close();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
} 