import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    invoke: (channel: string, ...args: any[]) => {
      console.log('Invoking channel:', channel);
      // Whitelist channels
      const validChannels = [
        'get-api-key',
        'save-api-key',
        'get-notes',
        'get-note',
        'create-note',
        'update-note',
        'delete-note'
      ];
      if (validChannels.includes(channel)) {
        console.log(`channel ${channel} is valid`);
        return ipcRenderer.invoke(channel, ...args);
      }
      
      throw new Error(`Unauthorized IPC channel: ${channel}`);
    }
  }
});
