import { SSHConnectionParams } from '../shared/types';
declare const electronAPI: {
    ssh: {
        connect: (params: SSHConnectionParams) => Promise<any>;
        disconnect: (sessionId: string) => Promise<any>;
        send: (sessionId: string, data: string) => Promise<any>;
        onOutput: (callback: (data: {
            sessionId: string;
            data: string;
        }) => void) => () => Electron.IpcRenderer;
        onStatus: (callback: (data: any) => void) => () => Electron.IpcRenderer;
        onClosed: (callback: (data: {
            sessionId: string;
            reason: string;
        }) => void) => () => Electron.IpcRenderer;
    };
    config: {
        get: (key: string) => Promise<any>;
        set: (key: string, value: any) => Promise<any>;
    };
    bookmarks: {
        getAll: () => Promise<any>;
        create: (bookmark: any) => Promise<any>;
        update: (id: string, updates: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    groups: {
        getAll: () => Promise<any>;
        create: (group: any) => Promise<any>;
        update: (id: string, updates: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    shortcuts: {
        getAll: () => Promise<any>;
        create: (shortcut: any) => Promise<any>;
        update: (id: string, updates: any) => Promise<any>;
        delete: (id: string) => Promise<any>;
    };
    settings: {
        get: () => Promise<any>;
        update: (updates: any) => Promise<any>;
    };
    app: {
        getConfigDir: () => Promise<any>;
        isFirstLaunch: () => Promise<any>;
        selectDirectory: () => Promise<any>;
    };
    onShortcut: (callback: (action: string) => void) => () => Electron.IpcRenderer;
};
export type ElectronAPI = typeof electronAPI;
export {};
