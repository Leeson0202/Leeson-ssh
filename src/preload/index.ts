import { contextBridge, ipcRenderer } from 'electron';
import { SSHConnectionParams, IPC_CHANNELS } from '../shared/types';

// 定义暴露给渲染进程的 API
const electronAPI = {
  // SSH 相关
  ssh: {
    connect: (params: SSHConnectionParams) =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_CONNECT, params),

    disconnect: (sessionId: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_DISCONNECT, { sessionId }),

    send: (sessionId: string, data: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_SEND, { sessionId, data }),

    resize: (sessionId: string, cols: number, rows: number) =>
      ipcRenderer.invoke(IPC_CHANNELS.SSH_RESIZE, { sessionId, cols, rows }),

    onOutput: (callback: (data: { sessionId: string; data: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.SSH_OUTPUT, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_OUTPUT, handler);
    },

    onStatus: (callback: (data: any) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.SSH_STATUS, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_STATUS, handler);
    },

    onClosed: (callback: (data: { sessionId: string; reason: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.SSH_CLOSED, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SSH_CLOSED, handler);
    },
  },

  // 配置相关
  config: {
    get: (key: string) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET, { key }),
    set: (key: string, value: any) =>
      ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, { key, value }),
  },

  // 书签
  bookmarks: {
    getAll: () => ipcRenderer.invoke('bookmarks:getAll'),
    create: (bookmark: any) => ipcRenderer.invoke('bookmarks:create', bookmark),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('bookmarks:update', { id, updates }),
    delete: (id: string) => ipcRenderer.invoke('bookmarks:delete', { id }),
  },

  // 分组
  groups: {
    getAll: () => ipcRenderer.invoke('groups:getAll'),
    create: (group: any) => ipcRenderer.invoke('groups:create', group),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('groups:update', { id, updates }),
    delete: (id: string) => ipcRenderer.invoke('groups:delete', { id }),
  },

  // 快捷键
  shortcuts: {
    getAll: () => ipcRenderer.invoke('shortcuts:getAll'),
    create: (shortcut: any) => ipcRenderer.invoke('shortcuts:create', shortcut),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('shortcuts:update', { id, updates }),
    delete: (id: string) => ipcRenderer.invoke('shortcuts:delete', { id }),
    register: () => ipcRenderer.invoke(IPC_CHANNELS.SHORTCUTS_REGISTER),
    unregister: () => ipcRenderer.invoke(IPC_CHANNELS.SHORTCUTS_UNREGISTER),
    onExecute: (callback: (data: { command: string; sessionId: string }) => void) => {
      const handler = (_event: any, data: any) => callback(data);
      ipcRenderer.on(IPC_CHANNELS.SHORTCUTS_EXECUTE, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.SHORTCUTS_EXECUTE, handler);
    },
  },

  // 会话
  session: {
    setActive: (sessionId: string | null) =>
      ipcRenderer.invoke(IPC_CHANNELS.SESSION_SET_ACTIVE, { sessionId }),
  },

  // 窗口
  window: {
    detachCommandBook: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_DETACH_COMMANDBOOK),
    attachCommandBook: () => ipcRenderer.invoke(IPC_CHANNELS.WINDOW_ATTACH_COMMANDBOOK),
    onAttachCommandBook: (callback: () => void) => {
      const handler = () => callback();
      ipcRenderer.on(IPC_CHANNELS.WINDOW_ATTACH_COMMANDBOOK, handler);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.WINDOW_ATTACH_COMMANDBOOK, handler);
    },
  },

  // 设置
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (updates: any) => ipcRenderer.invoke('settings:update', updates),
  },

  // 应用
  app: {
    getConfigDir: () => ipcRenderer.invoke(IPC_CHANNELS.APP_GET_CONFIG_DIR),
    isFirstLaunch: () => ipcRenderer.invoke(IPC_CHANNELS.APP_IS_FIRST_LAUNCH),
    selectDirectory: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SELECT_DIR),
    getPlatform: () => process.platform,
  },

  // 文件对话框
  dialog: {
    openFile: () => ipcRenderer.invoke(IPC_CHANNELS.DIALOG_OPEN_FILE),
    saveFile: (content: string, defaultPath?: string) =>
      ipcRenderer.invoke(IPC_CHANNELS.DIALOG_SAVE_FILE, { content, defaultPath }),
  },

  // 文件操作
  file: {
    read: (filePath: string) => ipcRenderer.invoke('file:read', filePath),
    write: (filePath: string, content: string) => ipcRenderer.invoke('file:write', { filePath, content }),
  },

  // 快捷键事件
  onShortcut: (callback: (action: string) => void) => {
    const handler = (_event: any, action: string) => callback(action);
    ipcRenderer.on('shortcut:trigger', handler);
    return () => ipcRenderer.removeListener('shortcut:trigger', handler);
  },
};

// 暴露 API
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// 类型声明
export type ElectronAPI = typeof electronAPI;
