import { getIpcInvoke } from './electronBridge';
import type { AppSettings } from '../domain/settings';

export const settingsApi = {
  async getSettings(): Promise<AppSettings> {
    const invoke = getIpcInvoke();
    const settings = (await invoke('get-settings')) as Partial<AppSettings> | undefined;
    return {
      openaiApiKey: typeof settings?.openaiApiKey === 'string' ? settings.openaiApiKey : '',
    };
  },

  async saveSettings(settings: AppSettings): Promise<boolean> {
    const invoke = getIpcInvoke();
    return (await invoke('save-settings', settings)) as boolean;
  },
};

