import { IpcMain, Dialog, BrowserWindow } from 'electron';
import log from 'electron-log';
import { SSHManager } from './ssh-manager';
import { ConfigStore } from './config-store';
import { ShortcutManager } from './shortcut-manager';
import { IPC_CHANNELS, SSHConnectionParams } from '../shared/types';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

export function registerIPCHandlers(
  ipcMain: IpcMain,
  sshManager: SSHManager,
  configStore: ConfigStore,
  dialog: Dialog,
  shortcutManager: ShortcutManager,
  getActiveSessionId: () => string | null
): void {
  log.info('Registering IPC handlers...');

  // SSH 连接
  ipcMain.handle(
    IPC_CHANNELS.SSH_CONNECT,
    async (_event, params: SSHConnectionParams) => {
      log.info('IPC: ssh:connect', params.host);
      return await sshManager.connect(params);
    }
  );

  // SSH 断开
  ipcMain.handle(
    IPC_CHANNELS.SSH_DISCONNECT,
    async (_event, { sessionId }: { sessionId: string }) => {
      log.info('IPC: ssh:disconnect', sessionId);
      sshManager.disconnect(sessionId);
      return { success: true };
    }
  );

  // SSH 发送数据
  ipcMain.handle(
    IPC_CHANNELS.SSH_SEND,
    async (_event, { sessionId, data }: { sessionId: string; data: string }) => {
      const success = sshManager.send(sessionId, data);
      return { success };
    }
  );

  // SSH 终端尺寸调整
  ipcMain.handle(
    IPC_CHANNELS.SSH_RESIZE,
    async (_event, { sessionId, cols, rows }: { sessionId: string; cols: number; rows: number }) => {
      const success = sshManager.resize(sessionId, cols, rows);
      return { success };
    }
  );

  // 配置获取
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_GET,
    async (_event, { key }: { key: string }) => {
      try {
        const value = configStore.get(key as any);
        return { success: true, value };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  );

  // 配置设置
  ipcMain.handle(
    IPC_CHANNELS.CONFIG_SET,
    async (_event, { key, value }: { key: string; value: any }) => {
      try {
        configStore.set(key as any, value);
        return { success: true };
      } catch (error) {
        return { success: false, error: String(error) };
      }
    }
  );

  // 书签 CRUD
  ipcMain.handle('bookmarks:getAll', async () => {
    return configStore.getBookmarks();
  });

  ipcMain.handle(
    'bookmarks:create',
    async (_event, bookmark: any) => {
      const newBookmark = { ...bookmark, id: uuidv4() };
      configStore.addBookmark(newBookmark);
      return newBookmark;
    }
  );

  ipcMain.handle(
    'bookmarks:update',
    async (_event, { id, updates }: { id: string; updates: any }) => {
      configStore.updateBookmark(id, updates);
      return { success: true };
    }
  );

  ipcMain.handle(
    'bookmarks:delete',
    async (_event, { id }: { id: string }) => {
      configStore.deleteBookmark(id);
      return { success: true };
    }
  );

  // 分组 CRUD
  ipcMain.handle('groups:getAll', async () => {
    return configStore.getGroups();
  });

  ipcMain.handle(
    'groups:create',
    async (_event, group: any) => {
      const newGroup = { ...group, id: uuidv4() };
      configStore.addGroup(newGroup);
      return newGroup;
    }
  );

  ipcMain.handle(
    'groups:update',
    async (_event, { id, updates }: { id: string; updates: any }) => {
      configStore.updateGroup(id, updates);
      return { success: true };
    }
  );

  ipcMain.handle(
    'groups:delete',
    async (_event, { id }: { id: string }) => {
      configStore.deleteGroup(id);
      return { success: true };
    }
  );

  // 快捷键 CRUD
  ipcMain.handle('shortcuts:getAll', async () => {
    return configStore.getShortcuts();
  });

  ipcMain.handle(
    'shortcuts:create',
    async (_event, shortcut: any) => {
      const newShortcut = { ...shortcut, id: uuidv4() };
      configStore.addShortcut(newShortcut);
      return newShortcut;
    }
  );

  ipcMain.handle(
    'shortcuts:update',
    async (_event, { id, updates }: { id: string; updates: any }) => {
      configStore.updateShortcut(id, updates);
      return { success: true };
    }
  );

  ipcMain.handle(
    'shortcuts:delete',
    async (_event, { id }: { id: string }) => {
      configStore.deleteShortcut(id);
      return { success: true };
    }
  );

  // 设置
  ipcMain.handle('settings:get', async () => {
    return configStore.getSettings();
  });

  ipcMain.handle(
    'settings:update',
    async (_event, updates: any) => {
      configStore.updateSettings(updates);
      return { success: true };
    }
  );

  // 转发 SSH 管理器事件到渲染进程
  sshManager.on('output', (data: { sessionId: string; data: string }) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win: BrowserWindow) => {
      win.webContents.send(IPC_CHANNELS.SSH_OUTPUT, data);
    });
  });

  sshManager.on('status', (data: { sessionId: string; status: string; [key: string]: any }) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win: BrowserWindow) => {
      win.webContents.send(IPC_CHANNELS.SSH_STATUS, data);
    });
  });

  sshManager.on('closed', (data: { sessionId: string; reason: string }) => {
    const windows = BrowserWindow.getAllWindows();
    windows.forEach((win: BrowserWindow) => {
      win.webContents.send(IPC_CHANNELS.SSH_CLOSED, data);
    });
  });

  // 打开文件对话框
  ipcMain.handle(IPC_CHANNELS.DIALOG_OPEN_FILE, async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: '文本文件', extensions: ['txt', 'md', 'sh', 'bash', 'zsh'] }],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, canceled: true };
    }

    const filePath = result.filePaths[0];
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, filePath, content };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 保存文件对话框
  ipcMain.handle(IPC_CHANNELS.DIALOG_SAVE_FILE, async (_event, { content, defaultPath }: { content: string; defaultPath?: string }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: defaultPath || 'commands.txt',
      filters: [{ name: '文本文件', extensions: ['txt', 'md', 'sh', 'bash', 'zsh'] }],
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    try {
      fs.writeFileSync(result.filePath, content, 'utf-8');
      return { success: true, filePath: result.filePath };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 读取文件（无对话框）
  ipcMain.handle('file:read', async (_event, filePath: string) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { success: true, content };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 写入文件（无对话框）
  ipcMain.handle('file:write', async (_event, { filePath, content }: { filePath: string; content: string }) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  });

  // 注册快捷键（从配置加载）
  ipcMain.handle(IPC_CHANNELS.SHORTCUTS_REGISTER, async () => {
    try {
      const shortcuts = configStore.getShortcuts();
      shortcutManager.unregisterAll();

      for (const shortcut of shortcuts) {
        if (shortcut.scope === 'global') {
          const success = shortcutManager.register(shortcut, (command) => {
            const activeSessionId = getActiveSessionId();
            if (activeSessionId) {
              sshManager.send(activeSessionId, command + '\n');
              // Also send to renderer for display
              const windows = BrowserWindow.getAllWindows();
              windows.forEach((win: BrowserWindow) => {
                win.webContents.send(IPC_CHANNELS.SHORTCUTS_EXECUTE, { command, sessionId: activeSessionId });
              });
            }
          });
          if (!success) {
            log.warn(`Failed to register shortcut: ${shortcut.keys.join('+')}`);
          }
        }
      }
      return { success: true };
    } catch (error) {
      log.error('Failed to register shortcuts:', error);
      return { success: false, error: String(error) };
    }
  });

  // 取消注册所有快捷键
  ipcMain.handle(IPC_CHANNELS.SHORTCUTS_UNREGISTER, async () => {
    shortcutManager.unregisterAll();
    return { success: true };
  });

  log.info('IPC handlers registered');
}
