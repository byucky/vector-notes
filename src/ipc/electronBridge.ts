export type IpcInvoke = (channel: string, ...args: any[]) => Promise<any>;

export function getIpcInvoke(): IpcInvoke {
  const w = window as any;
  const invoke = w?.electron?.ipcRenderer?.invoke;
  if (typeof invoke !== 'function') {
    throw new Error(
      'Electron IPC bridge not found. Ensure you are running inside Electron and preload exposes window.electron.ipcRenderer.invoke.'
    );
  }
  return invoke.bind(w.electron.ipcRenderer);
}

