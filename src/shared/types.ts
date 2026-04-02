// SSH 连接相关类型
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

export type ConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'connection_failed'
  | 'timeout'
  | 'authentication_failed'
  | 'network_error';

// Session 相关类型
export interface SessionInfo {
  sessionId: string;
  sessionName: string;
  host: string;
  port: number;
  username: string;
  status: ConnectionStatus;
}

// IPC 通道名称
export const IPC_CHANNELS = {
  // SSH
  SSH_CONNECT: 'ssh:connect',
  SSH_DISCONNECT: 'ssh:disconnect',
  SSH_SEND: 'ssh:send',
  SSH_RESIZE: 'ssh:resize',
  SSH_OUTPUT: 'ssh:output',
  SSH_STATUS: 'ssh:status',
  SSH_CLOSED: 'ssh:closed',

  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',

  // Dialog
  DIALOG_SELECT_DIR: 'dialog:selectDir',
  DIALOG_OPEN_FILE: 'dialog:openFile',
  DIALOG_SAVE_FILE: 'dialog:saveFile',

  // App
  APP_GET_CONFIG_DIR: 'app:getConfigDir',
  APP_IS_FIRST_LAUNCH: 'app:isFirstLaunch',
  APP_GET_PLATFORM: 'app:getPlatform',

  // Shortcuts
  SHORTCUTS_REGISTER: 'shortcuts:register',
  SHORTCUTS_UNREGISTER: 'shortcuts:unregister',
  SHORTCUTS_EXECUTE: 'shortcuts:execute',
  SESSION_SET_ACTIVE: 'session:setActive',

  // Window
  WINDOW_DETACH_COMMANDBOOK: 'window:detachCommandBook',
  WINDOW_ATTACH_COMMANDBOOK: 'window:attachCommandBook',
} as const;

// 配置存储相关类型
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
  scope: 'global' | string; // 'global' or sessionId
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

// 默认配置
export const DEFAULT_SETTINGS: Settings = {
  fontSize: 14,
  scrollbackLines: 1000,
  multiLineSendInterval: 100,
  configDir: '',
};

export const DEFAULT_GROUP: BookmarkGroup = {
  id: 'default',
  name: '未分组',
  parentId: null,
};
