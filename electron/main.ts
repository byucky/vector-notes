// Import necessary modules
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';
import { db } from '../src/utilities/db';
import { AppSettings } from '../src/services/settings.service';

// Define the path for storing settings
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');

// Simple encryption key (in a real app, you'd want to handle this more securely)
const ENCRYPTION_KEY = 'your-secret-encryption-key';

// Function to encrypt sensitive data
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt sensitive data
function decrypt(text: string): string {
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (error) {
    console.error('Decryption error:', error);
    return '';
  }
}

// Function to load settings
function loadSettings(): any {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
  }
  return {};
}

// Function to save settings
function saveSettings(settings: any): void {
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

// Set up IPC handlers
ipcMain.handle('get-settings', () => {
  console.log('get settings handler called');
  const settings = loadSettings();
  return settings;
});

ipcMain.handle('save-settings', (_, settings: AppSettings) => {
  console.log('save settings handler called');
  saveSettings(settings);
  return true;
});

// Database IPC handlers
ipcMain.handle('get-notes', async () => {
  console.log('get notes handler called');
  try {
    const notes = db.getNotes();
    return notes;
  } catch (error) {
    console.error('Error getting notes:', error);
    throw error;
  }
});

ipcMain.handle('get-note', async (_, id: string) => {
  try {
    const note = db.getNote(id);
    return note;
  } catch (error) {
    console.error('Error getting note:', error);
    throw error;
  }
});

ipcMain.handle('create-note', async (_, note: { id: string, title: string, content: string }) => {
  try {
    db.createNote(note);
    return true;
  } catch (error) {
    console.error('Error creating note:', error);
    throw error;
  }
});

ipcMain.handle('update-note', async (_, note: { id: string, title: string, content: string }) => {
  try {
    db.updateNote(note);
    return true;
  } catch (error) {
    console.error('Error updating note:', error);
    throw error;
  }
});

ipcMain.handle('delete-note', async (_, id: string) => {
  try {
    db.deleteNote(id);
    return true;
  } catch (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
});

// Database initialization function - will be called from main.js
export function initializeDatabase() {
  try {
    // Just accessing the db singleton will initialize it
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