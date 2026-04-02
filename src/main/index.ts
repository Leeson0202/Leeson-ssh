import { app, BrowserWindow, ipcMain, dialog, globalShortcut } from 'electron';
import * as path from 'path';
import log from 'electron-log';
import { SSHManager } from './ssh-manager';
import { ConfigStore } from './config-store';
import { ShortcutManager } from './shortcut-manager';
import { registerIPCHandlers } from './ipc-handlers';
import { IPC_CHANNELS } from '../shared/types';

const isDev = !app.isPackaged;

// 配置日志
log.transports.file.level = 'info';
log.transports.console.level = 'debug';
log.info('Application starting...');

// 全局异常处理
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception:', error);
  app.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

let mainWindow: BrowserWindow | null = null;
let commandBookWindow: BrowserWindow | null = null;
let sshManager: SSHManager;
let configStore: ConfigStore;
let shortcutManager: ShortcutManager;
let activeSessionId: string | null = null;

function createWindow(): void {
  log.info('Creating main window...');

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Leeson-ssh',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  // CSP headers
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'self' data:; img-src 'self' data:;"
        ],
      },
    });
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    log.info('Main window shown');
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // 加载页面
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  log.info('Window created successfully');
}

// 创建命令笔记本浮动窗口
function createCommandBookWindow(): BrowserWindow {
  log.info('Creating CommandBook window...');

  commandBookWindow = new BrowserWindow({
    width: 600,
    height: 400,
    minWidth: 300,
    minHeight: 200,
    title: '命令笔记本',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    show: false,
  });

  commandBookWindow.once('ready-to-show', () => {
    commandBookWindow?.show();
    log.info('CommandBook window shown');
  });

  commandBookWindow.on('closed', () => {
    commandBookWindow = null;
    // 通知主窗口命令笔记本已关闭
    mainWindow?.webContents.send(IPC_CHANNELS.WINDOW_ATTACH_COMMANDBOOK);
  });

  // 加载页面，添加参数标识这是命令笔记本窗口
  if (isDev) {
    commandBookWindow.loadURL('http://localhost:5173?window=commandbook');
  } else {
    commandBookWindow.loadFile(path.join(__dirname, '../renderer/index.html'), {
      query: { window: 'commandbook' }
    });
  }

  log.info('CommandBook window created successfully');
  return commandBookWindow;
}

// 检查是否为首次启动
async function checkFirstLaunch(): Promise<boolean> {
  const configDir = configStore.get('settings').configDir;
  return !configDir;
}

app.whenReady().then(async () => {
  log.info('App ready');

  // 初始化配置存储
  configStore = new ConfigStore();
  await configStore.init();

  // 初始化 SSH 管理器
  sshManager = new SSHManager();

  // 初始化快捷键管理器
  shortcutManager = new ShortcutManager();

  // 注册 IPC 处理器
  registerIPCHandlers(
    ipcMain,
    sshManager,
    configStore,
    dialog,
    shortcutManager,
    () => activeSessionId
  );

  // 注册全局快捷键管理器（内置的 toggle-sidebar 快捷键）
  globalShortcut.register('CommandOrControl+Shift+S', () => {
    if (mainWindow?.isFocused()) {
      mainWindow.webContents.send('shortcut:trigger', 'toggle-sidebar');
    }
  });

  // 从配置加载并注册自定义快捷键
  try {
    const shortcuts = configStore.getShortcuts();
    for (const shortcut of shortcuts) {
      if (shortcut.scope === 'global') {
        shortcutManager.register(shortcut, (command) => {
          if (activeSessionId) {
            sshManager.send(activeSessionId, command + '\n');
            mainWindow?.webContents.send(IPC_CHANNELS.SHORTCUTS_EXECUTE, { command, sessionId: activeSessionId });
          }
        });
      }
    }
  } catch (error) {
    log.error('Failed to load shortcuts:', error);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  log.info('All windows closed');
  globalShortcut.unregisterAll();

  // 关闭所有 SSH 连接
  sshManager.disconnectAll();

  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  log.info('Application quitting...');
});

// IPC: 获取配置目录
ipcMain.handle(IPC_CHANNELS.APP_GET_CONFIG_DIR, () => {
  return configStore.get('settings').configDir;
});

// IPC: 检查首次启动
ipcMain.handle(IPC_CHANNELS.APP_IS_FIRST_LAUNCH, async () => {
  return await checkFirstLaunch();
});

// IPC: 选择目录对话框
ipcMain.handle(IPC_CHANNELS.DIALOG_SELECT_DIR, async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory'],
    title: '选择配置存储目录',
  });
  return result.canceled ? null : result.filePaths[0];
});

// IPC: 设置当前活动的 SSH 会话
ipcMain.handle(IPC_CHANNELS.SESSION_SET_ACTIVE, async (_event, { sessionId }: { sessionId: string | null }) => {
  activeSessionId = sessionId;
  return { success: true };
});

// IPC: 获取平台
ipcMain.handle(IPC_CHANNELS.APP_GET_PLATFORM, () => {
  return process.platform;
});

// IPC: 脱离命令笔记本为独立窗口
ipcMain.handle(IPC_CHANNELS.WINDOW_DETACH_COMMANDBOOK, async () => {
  if (commandBookWindow) {
    commandBookWindow.focus();
    return { success: true };
  }
  createCommandBookWindow();
  return { success: true };
});

// IPC: 关闭命令笔记本窗口（重新附加到主窗口）
ipcMain.handle(IPC_CHANNELS.WINDOW_ATTACH_COMMANDBOOK, async () => {
  if (commandBookWindow) {
    commandBookWindow.close();
    commandBookWindow = null;
  }
  return { success: true };
});

export { mainWindow, sshManager, configStore };
