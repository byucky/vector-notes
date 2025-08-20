import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

// Define the path for storing settings
const userDataPath = app.getPath('userData');
const settingsPath = path.join(userDataPath, 'settings.json');
// Function to load settings
export const loadSettings = (): any => {
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
export const saveSettings = (settings: any): void => {
    try {
        fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving settings:', error);
    }
}