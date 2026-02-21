import { app, BrowserWindow, clipboard, Menu, shell, Tray } from 'electron';
import { getCommands, removeCommandByIndex } from './commandsStore';
import { getSettings } from './settingsStore';

let tray: Tray | null = null;
let clipboardHistory: string[] = [];
const POLL_INTERVAL_MS = 1000;

let getMainWindow: () => BrowserWindow | null = () => null;
let onWindowMissing: () => void = () => {};

/** Bring the window to front, restoring/focusing as needed */
function showAndFocusWindow(): void {
  const win = getMainWindow();
  if (!win || win.isDestroyed()) {
    onWindowMissing();
    return;
  }
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  if (process.platform === 'darwin') app.dock?.show();
}

function buildClipboardItems(): Electron.MenuItemConstructorOptions[] {
  return clipboardHistory.map((item, index) => ({
    label: `${index} - ${item.substring(0, 50)}`,
    click: () => clipboard.writeText(item),
  }));
}

function buildHistoryManagement(): Electron.MenuItemConstructorOptions[] {
  if (clipboardHistory.length === 0) return [];

  const removeItems: Electron.MenuItemConstructorOptions[] =
    clipboardHistory.map((item, idx) => ({
      label: `${idx} - ${item.substring(0, 50)}`,
      click: () => {
        clipboardHistory.splice(idx, 1);
        updateContextMenu();
      },
    }));

  return [
    {
      label: 'Remove History Item',
      submenu: removeItems,
    },
    {
      label: 'Clear History',
      click: () => {
        clipboardHistory = [];
        updateContextMenu();
      },
    },
  ];
}

function buildCommandSubmenu(): Electron.MenuItemConstructorOptions {
  const commands = getCommands();

  const commandItems: Electron.MenuItemConstructorOptions[] =
    commands.length > 0
      ? commands.map((cmd) => ({
          label: `${cmd.description} - ${cmd.command}`.substring(0, 60),
          click: () => clipboard.writeText(cmd.command),
        }))
      : [{ label: '(no commands)', enabled: false }];

  const removeItems: Electron.MenuItemConstructorOptions[] = commands.map(
    (cmd, idx) => ({
      label: `${cmd.description} - ${cmd.command}`.substring(0, 60),
      click: async () => {
        await removeCommandByIndex(idx, () => {
          updateContextMenu();
          getMainWindow()?.webContents.send('commands:changed');
        });
      },
    }),
  );

  return {
    label: 'Commands',
    submenu: [
      ...commandItems,
      { type: 'separator' as const },
      {
        label: '+ Add Command...',
        click: () => {
          showAndFocusWindow();
          getMainWindow()?.webContents.send('navigate', '/shell');
        },
      },
      {
        label: 'Remove Command',
        submenu:
          removeItems.length > 0
            ? removeItems
            : [{ label: '(no commands)', enabled: false }],
      },
    ],
  };
}

function buildAppItems(): Electron.MenuItemConstructorOptions[] {
  return [
    {
      label: 'Show Stash',
      type: 'normal' as const,
      click: showAndFocusWindow,
    },
    {
      label: 'Settings...',
      click: () => {
        showAndFocusWindow();
        getMainWindow()?.webContents.send('navigate', '/settings');
      },
    },
    {
      label: 'About',
      click: () => shell.openExternal('https://github.com/pc6n/stash'),
    },
    {
      label: 'Quit',
      type: 'normal' as const,
      click: () => app.quit(),
    },
  ];
}

export function updateContextMenu(): void {
  if (!tray) return;
  const historyMgmt = buildHistoryManagement();
  const template: Electron.MenuItemConstructorOptions[] = [
    ...buildClipboardItems(),
    { type: 'separator' },
    ...historyMgmt,
    ...(historyMgmt.length > 0 ? [{ type: 'separator' as const }] : []),
    buildCommandSubmenu(),
    { type: 'separator' },
    ...buildAppItems(),
  ];
  tray.setContextMenu(Menu.buildFromTemplate(template));
}

export function createTray(
  iconPath: string,
  mainWindowGetter: () => BrowserWindow | null,
  recreateWindow: () => void,
): void {
  getMainWindow = mainWindowGetter;
  onWindowMissing = recreateWindow;
  tray = new Tray(iconPath);
  tray.setToolTip('Stash');
  updateContextMenu();
}

export function startClipboardPolling(): void {
  setInterval(() => {
    const text = clipboard.readText();
    if (!text) return;
    if (clipboardHistory.length && clipboardHistory[0] === text) return;

    clipboardHistory.unshift(text);
    const max = Math.min(getSettings().maxClipboardHistory, 20);
    clipboardHistory = clipboardHistory.slice(0, max);
    updateContextMenu();
  }, POLL_INTERVAL_MS);
}
