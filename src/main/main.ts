/* eslint global-require: off, no-console: off, promise/always-return: off */
import path from 'path';
import {
  app,
  BrowserWindow,
  shell,
  ipcMain,
  globalShortcut,
  screen,
} from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import { loadCommands, registerCommandsIPC } from './commandsStore';
import {
  createTray,
  startClipboardPolling,
  updateContextMenu,
} from './trayManager';

// --- Auto-updater ---
class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

// --- Globals ---
let mainWindow: BrowserWindow | null = null;

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDebug =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDebug) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];
  return installer
    .default(
      extensions.map((name: string) => installer[name]),
      forceDownload,
    )
    .catch(console.log);
};

const RESOURCES_PATH = app.isPackaged
  ? path.join(process.resourcesPath, 'assets')
  : path.join(__dirname, '../../assets');

const getAssetPath = (...paths: string[]): string =>
  path.join(RESOURCES_PATH, ...paths);

// --- Window IPC ---
function registerWindowIPC(): void {
  ipcMain.on('maximize-window', () => {
    if (!mainWindow) return;
    if (mainWindow.isMaximized()) mainWindow.unmaximize();
    else mainWindow.maximize();
  });

  ipcMain.on('toggle-always-on-top', (_event, shouldPin) => {
    mainWindow?.setAlwaysOnTop(shouldPin);
  });

  ipcMain.on('move-to-top-right', () => {
    if (!mainWindow) return;
    const { width } = screen.getPrimaryDisplay().workAreaSize;
    mainWindow.setPosition(width - mainWindow.getBounds().width, 0);
  });
}

// --- Window lifecycle ---
const createWindow = async () => {
  if (isDebug) await installExtensions();

  mainWindow = new BrowserWindow({
    show: false,
    width: 300,
    height: 600,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      sandbox: false,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
  });

  mainWindow.setAlwaysOnTop(true);
  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) throw new Error('"mainWindow" is not defined');
    if (process.env.START_MINIMIZED) mainWindow.minimize();
    else mainWindow.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // eslint-disable-next-line no-new
  new AppUpdater();
};

// --- Window toggle ---
const showWindowAtCursor = () => {
  if (!mainWindow) return;
  const cursorPos = screen.getCursorScreenPoint();
  mainWindow.setPosition(cursorPos.x, cursorPos.y);
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
};

const toggleWindow = () => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    if (mainWindow.isVisible()) mainWindow.hide();
    else showWindowAtCursor();
  } else {
    createWindow();
    showWindowAtCursor();
  }
};

// --- App lifecycle ---
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app
  .whenReady()
  .then(async () => {
    await loadCommands();
    registerCommandsIPC(updateContextMenu);
    registerWindowIPC();
    createTray(getAssetPath('tray-iconTemplate.png'), () => mainWindow, createWindow);
    startClipboardPolling();
    createWindow();

    app.on('activate', () => {
      if (mainWindow === null) createWindow();
    });

    globalShortcut.register('Command+Shift+W', toggleWindow);
  })
  .catch(console.log);
