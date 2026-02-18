// Disable no-unused-vars, broken for spread args
/* eslint no-unused-vars: off */
// eslint-disable-next-line import/no-duplicates
import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
// eslint-disable-next-line import/no-duplicates
import { clipboard } from 'electron';

export type Channels = 'ipc-example' | 'commands:changed' | 'navigate';

const electronHandler = {
  ipcRenderer: {
    sendMessage(channel: Channels, ...args: unknown[]) {
      ipcRenderer.send(channel, ...args);
    },
    on(channel: Channels, func: (...args: unknown[]) => void) {
      const subscription = (_event: IpcRendererEvent, ...args: unknown[]) =>
        func(...args);
      ipcRenderer.on(channel, subscription);

      return () => {
        ipcRenderer.removeListener(channel, subscription);
      };
    },
    once(channel: Channels, func: (...args: unknown[]) => void) {
      ipcRenderer.once(channel, (_event, ...args) => func(...args));
    },
  },
  clip: {
    read: () => clipboard.readText(),
    write: (text: string) => clipboard.writeText(text),
  },
  window: {
    toggleAlwaysOnTop: (shouldPin: any) =>
      ipcRenderer.send('toggle-always-on-top', shouldPin),
    moveToTopRight: () => ipcRenderer.send('move-to-top-right'),
    maximize: () => ipcRenderer.send('maximize-window'),
  },
  commands: {
    getAll: () => ipcRenderer.invoke('commands:get'),
    add: (cmd: { command: string; description: string }) =>
      ipcRenderer.invoke('commands:add', cmd),
    remove: (index: number) => ipcRenderer.invoke('commands:remove', index),
  },
};

contextBridge.exposeInMainWorld('electron', electronHandler);

export type ElectronHandler = typeof electronHandler;
