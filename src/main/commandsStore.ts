import path from 'path';
import { app, ipcMain } from 'electron';
import { promises as fs } from 'fs';
import log from 'electron-log';

export interface ShellCommand {
  command: string;
  description: string;
}

const DEFAULT_COMMANDS: ShellCommand[] = [
  { command: 'sudo certbot --nginx', description: 'create cert' },
  { command: 'sudo systemctl restart nginx', description: 'restart nginx' },
];

let commands: ShellCommand[] = [];

const commandsFilePath = () =>
  path.join(app.getPath('userData'), 'commands.json');

export async function loadCommands(): Promise<ShellCommand[]> {
  try {
    const raw = await fs.readFile(commandsFilePath(), 'utf8');
    commands = JSON.parse(raw);
  } catch {
    commands = DEFAULT_COMMANDS;
  }
  return commands;
}

async function persist(): Promise<void> {
  try {
    await fs.writeFile(commandsFilePath(), JSON.stringify(commands, null, 2));
  } catch (err) {
    log.error('Failed to save commands:', err);
  }
}

export function getCommands(): ShellCommand[] {
  return commands;
}

/** Call once after app.whenReady(). Returns a cleanup callback. */
export function registerCommandsIPC(
  onChanged: () => void,
): void {
  ipcMain.handle('commands:get', () => commands);

  ipcMain.handle('commands:add', async (_event, cmd: ShellCommand) => {
    commands.push(cmd);
    await persist();
    onChanged();
    return commands;
  });

  ipcMain.handle('commands:remove', async (_event, index: number) => {
    if (index >= 0 && index < commands.length) {
      commands.splice(index, 1);
      await persist();
      onChanged();
    }
    return commands;
  });
}

export async function removeCommandByIndex(
  index: number,
  onChanged: () => void,
): Promise<void> {
  if (index < 0 || index >= commands.length) return;
  commands.splice(index, 1);
  await persist();
  onChanged();
}
