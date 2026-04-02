export interface SSHConnectionParams {
    host: string;
    port: number;
    username: string;
    auth: AuthParams;
    sessionName?: string;
}
export type AuthType = 'password' | 'private_key' | 'agent';
export interface PasswordAuth {
    type: 'password';
    password: string;
}
export interface PrivateKeyAuth {
    type: 'private_key';
    privateKey: string;
    passphrase?: string;
}
export interface AgentAuth {
    type: 'agent';
}
export type AuthParams = PasswordAuth | PrivateKeyAuth | AgentAuth;
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'connection_failed' | 'timeout' | 'authentication_failed' | 'network_error';
export interface SessionInfo {
    sessionId: string;
    sessionName: string;
    host: string;
    port: number;
    username: string;
    status: ConnectionStatus;
}
export declare const IPC_CHANNELS: {
    readonly SSH_CONNECT: "ssh:connect";
    readonly SSH_DISCONNECT: "ssh:disconnect";
    readonly SSH_SEND: "ssh:send";
    readonly SSH_RESIZE: "ssh:resize";
    readonly SSH_OUTPUT: "ssh:output";
    readonly SSH_STATUS: "ssh:status";
    readonly SSH_CLOSED: "ssh:closed";
    readonly CONFIG_GET: "config:get";
    readonly CONFIG_SET: "config:set";
    readonly DIALOG_SELECT_DIR: "dialog:selectDir";
    readonly DIALOG_OPEN_FILE: "dialog:openFile";
    readonly DIALOG_SAVE_FILE: "dialog:saveFile";
    readonly APP_GET_CONFIG_DIR: "app:getConfigDir";
    readonly APP_IS_FIRST_LAUNCH: "app:isFirstLaunch";
};
export interface Bookmark {
    id: string;
    name: string;
    host: string;
    port: number;
    username: string;
    authType: AuthType;
    credentialRef: string;
    notes: string;
    groupId: string;
}
export interface BookmarkGroup {
    id: string;
    name: string;
    parentId: string | null;
}
export interface Shortcut {
    id: string;
    keys: string[];
    command: string;
    scope: 'global' | string;
}
export interface Settings {
    fontSize: number;
    scrollbackLines: number;
    multiLineSendInterval: number;
    configDir: string;
    lastCommandBookPath?: string;
}
export interface AppConfig {
    bookmarks: Bookmark[];
    groups: BookmarkGroup[];
    shortcuts: Shortcut[];
    settings: Settings;
}
export declare const DEFAULT_SETTINGS: Settings;
export declare const DEFAULT_GROUP: BookmarkGroup;
