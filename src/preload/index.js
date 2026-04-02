"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const types_1 = require("../shared/types");
// 定义暴露给渲染进程的 API
const electronAPI = {
    // SSH 相关
    ssh: {
        connect: (params) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SSH_CONNECT, params),
        disconnect: (sessionId) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SSH_DISCONNECT, { sessionId }),
        send: (sessionId, data) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.SSH_SEND, { sessionId, data }),
        onOutput: (callback) => {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on(types_1.IPC_CHANNELS.SSH_OUTPUT, handler);
            return () => electron_1.ipcRenderer.removeListener(types_1.IPC_CHANNELS.SSH_OUTPUT, handler);
        },
        onStatus: (callback) => {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on(types_1.IPC_CHANNELS.SSH_STATUS, handler);
            return () => electron_1.ipcRenderer.removeListener(types_1.IPC_CHANNELS.SSH_STATUS, handler);
        },
        onClosed: (callback) => {
            const handler = (_event, data) => callback(data);
            electron_1.ipcRenderer.on(types_1.IPC_CHANNELS.SSH_CLOSED, handler);
            return () => electron_1.ipcRenderer.removeListener(types_1.IPC_CHANNELS.SSH_CLOSED, handler);
        },
    },
    // 配置相关
    config: {
        get: (key) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CONFIG_GET, { key }),
        set: (key, value) => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.CONFIG_SET, { key, value }),
    },
    // 书签
    bookmarks: {
        getAll: () => electron_1.ipcRenderer.invoke('bookmarks:getAll'),
        create: (bookmark) => electron_1.ipcRenderer.invoke('bookmarks:create', bookmark),
        update: (id, updates) => electron_1.ipcRenderer.invoke('bookmarks:update', { id, updates }),
        delete: (id) => electron_1.ipcRenderer.invoke('bookmarks:delete', { id }),
    },
    // 分组
    groups: {
        getAll: () => electron_1.ipcRenderer.invoke('groups:getAll'),
        create: (group) => electron_1.ipcRenderer.invoke('groups:create', group),
        update: (id, updates) => electron_1.ipcRenderer.invoke('groups:update', { id, updates }),
        delete: (id) => electron_1.ipcRenderer.invoke('groups:delete', { id }),
    },
    // 快捷键
    shortcuts: {
        getAll: () => electron_1.ipcRenderer.invoke('shortcuts:getAll'),
        create: (shortcut) => electron_1.ipcRenderer.invoke('shortcuts:create', shortcut),
        update: (id, updates) => electron_1.ipcRenderer.invoke('shortcuts:update', { id, updates }),
        delete: (id) => electron_1.ipcRenderer.invoke('shortcuts:delete', { id }),
    },
    // 设置
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        update: (updates) => electron_1.ipcRenderer.invoke('settings:update', updates),
    },
    // 应用
    app: {
        getConfigDir: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.APP_GET_CONFIG_DIR),
        isFirstLaunch: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.APP_IS_FIRST_LAUNCH),
        selectDirectory: () => electron_1.ipcRenderer.invoke(types_1.IPC_CHANNELS.DIALOG_SELECT_DIR),
    },
    // 快捷键事件
    onShortcut: (callback) => {
        const handler = (_event, action) => callback(action);
        electron_1.ipcRenderer.on('shortcut:trigger', handler);
        return () => electron_1.ipcRenderer.removeListener('shortcut:trigger', handler);
    },
};
// 暴露 API
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
