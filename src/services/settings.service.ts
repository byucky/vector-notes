import { Injectable } from '@angular/core';

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

export interface AppSettings {
  openaiApiKey: string;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private ipcRenderer: Window['electron']['ipcRenderer'];

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer;
  }

  /**
   * Get all settings
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = await this.ipcRenderer.invoke('get-settings');
      return {
        openaiApiKey: settings.openaiApiKey || '',
      };
    } catch (error) {
      console.error('Error getting settings:', error);
      return {
        openaiApiKey: '',
      };
    }
  }

  /**
   * Save all settings
   */
  async saveSettings(settings: Partial<AppSettings>): Promise<boolean> {
    try {
      return await this.ipcRenderer.invoke('save-settings', settings);
    } catch (error) {
      console.error('Error saving settings:', error);
      return false;
    }
  }

  /**
   * Update a specific setting
   */
  async updateSetting<K extends keyof AppSettings>(
    key: K, 
    value: AppSettings[K]
  ): Promise<boolean> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, [key]: value };
      return await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error);
      return false;
    }
  }
} 