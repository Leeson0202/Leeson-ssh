## Why

现有 SSH 客户端工具（如 PuTTY、Terminal）在书签管理、多标签终端、命令笔记本等方面体验割裂，缺乏统一的效率工具整合。Leeson-ssh 定位于**轻量级、跨平台、一站式**的 SSH 管理工具，通过本地 TXT 命令笔记 + 快捷键发送、多标签管理、书签分组等特性，提升开发/运维日常工作效率。

## What Changes

- **跨平台桌面 SSH 客户端**：支持 Windows 10+ 和 macOS 11+，使用 Electron + React 技术栈
- **SSH 基础连接**：支持密码登录和私钥（.pem / id_rsa 等格式）认证
- **服务器书签管理**：保存连接信息为书签，支持分组、搜索、左键快速连接、右键编辑/删除/移动
- **多标签终端**：支持同时打开多个 SSH 会话标签，标签可重命名，显示连接状态
- **命令笔记本**：打开本地 .txt 文件作为命令笔记，当前行高亮，支持 Ctrl/Cmd+I 发送当前行至激活终端
- **自定义快捷键**：用户绑定常用命令至组合键，支持全局/标签级生效，自动检测冲突
- **Ant Design 暗色主题**：现代化 UI，主界面包含左侧书签面板、顶部标签栏、中间终端区、右侧命令笔记本

## Capabilities

### New Capabilities

- `ssh-connection`: SSH 协议连接管理，支持密码/私钥认证、连接状态监控、超时/错误处理
- `bookmark-management`: 书签 CRUD、分组管理、搜索、持久化存储
- `multi-tab-terminal`: 多标签页管理，每个标签独立 SSH 会话，支持新建/切换/关闭
- `command-notebook`: 本地 TXT 文件打开、编辑、当前行高亮、快捷键发送至终端
- `custom-shortcuts`: 用户自定义快捷键绑定命令，支持冲突检测和导入导出

### Modified Capabilities

（无 - 全新项目）

## Impact

- **前端**：React 18 + Ant Design 5 + xterm.js 终端
- **后端/主进程**：Electron Main + ssh2 + electron-store
- **打包**：electron-builder 支持 Windows/macOS 双平台
- **存储**：本地 JSON 配置文件（bookmarks、shortcuts），不涉及云端
