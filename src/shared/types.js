"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_GROUP = exports.DEFAULT_SETTINGS = exports.IPC_CHANNELS = void 0;
// IPC 通道名称
exports.IPC_CHANNELS = {
    // SSH
    SSH_CONNECT: 'ssh:connect',
    SSH_DISCONNECT: 'ssh:disconnect',
    SSH_SEND: 'ssh:send',
    SSH_OUTPUT: 'ssh:output',
    SSH_STATUS: 'ssh:status',
    SSH_CLOSED: 'ssh:closed',
    // Config
    CONFIG_GET: 'config:get',
    CONFIG_SET: 'config:set',
    // Dialog
    DIALOG_SELECT_DIR: 'dialog:selectDir',
    // App
    APP_GET_CONFIG_DIR: 'app:getConfigDir',
    APP_IS_FIRST_LAUNCH: 'app:isFirstLaunch',
};
// 默认配置
exports.DEFAULT_SETTINGS = {
    fontSize: 14,
    scrollbackLines: 1000,
    multiLineSendInterval: 100,
    configDir: '',
};
exports.DEFAULT_GROUP = {
    id: 'default',
    name: '未分组',
    parentId: null,
};
