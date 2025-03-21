// Import necessary modules
import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

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
ipcMain.handle('get-api-key', () => {
  const settings = loadSettings();
  if (settings.openaiApiKey) {
    return decrypt(settings.openaiApiKey);
  }
  return '';
});

ipcMain.handle('save-api-key', (_, apiKey: string) => {
  const settings = loadSettings();
  settings.openaiApiKey = encrypt(apiKey);
  saveSettings(settings);
  return true;
});

// Rest of your Electron main process code... 