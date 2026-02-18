import path from 'path';
import { app, ipcMain, BrowserWindow } from 'electron';
import { promises as fs } from 'fs';
import log from 'electron-log';

export interface AppSettings {
  maxClipboardHistory: number;
}

const DEFAULTS: AppSettings = { maxClipboardHistory: 30 };

let settings: AppSettings = { ...DEFAULTS };

const settingsFilePath = () =>
  path.join(app.getPath('userData'), 'settings.json');

export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await fs.readFile(settingsFilePath(), 'utf8');
    const parsed = JSON.parse(raw);
    settings = { ...DEFAULTS, ...parsed };
  } catch {
    settings = { ...DEFAULTS };
  }
  return settings;
}

async function persist(): Promise<void> {
  try {
    await fs.writeFile(settingsFilePath(), JSON.stringify(settings, null, 2));
  } catch (err) {
    log.error('Failed to save settings:', err);
  }
}

export function getSettings(): AppSettings {
  return settings;
}

export function registerSettingsIPC(
  getMainWindow: () => BrowserWindow | null,
): void {
  ipcMain.handle('settings:get', () => settings);

  ipcMain.handle(
    'settings:update',
    async (_event, partial: Partial<AppSettings>) => {
      settings = { ...settings, ...partial };
      await persist();
      getMainWindow()?.webContents.send('settings:changed', settings);
      return settings;
    },
  );
}
