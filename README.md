# Leeson-ssh

跨平台 SSH 客户端工具，支持多标签终端、书签管理、命令笔记本和自定义快捷键。

![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS-0078D6?style=flat-square)
![Electron](https://img.shields.io/badge/Electron-41.1.0-47848F?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3.3-3178C6?style=flat-square)

## 功能特性

### SSH 连接
- 支持密码和私钥（.pem / id_rsa）认证
- 连接状态实时显示（连接中/已连接/断开/重连中）
- 自动重连：网络波动后自动恢复连接，指数退避策略（1s → 2s → 4s → ... 最大 60s）
- 支持最多 20 个并发 SSH 会话
- 快速连接：无需保存书签，直接填写信息连接

### 多标签终端
- 多标签同时管理多个 SSH 会话
- 标签页拖拽排序
- 标签名称自定义（双击重命名）
- 连接状态指示器（绿色=已连接，黄色=连接中，红色=断开）
- 支持快捷键新建/关闭标签（Ctrl+T / Ctrl+W）

### 书签管理
- 保存 SSH 连接信息为书签
- 支持分组管理（最多 2 层嵌套）
- 书签搜索（按名称/IP 模糊匹配）
- 左键单击：一键连接
- 右键菜单：编辑、删除、复制、移动分组

### 命令笔记本
- 打开本地 .txt 文件作为命令笔记
- 实时编辑，自动保存（失焦或 Ctrl+S）
- 当前行高亮显示
- 快捷键发送当前行：
  - Windows：`Ctrl+I`
  - macOS：`Cmd+I`
- 可折叠/展开，也可独立悬浮为新窗口

### 自定义快捷键
- 绑定键盘快捷键到常用命令
- 支持组合键：
  - Windows：Ctrl / Alt / Shift
  - macOS：Cmd / Opt / Shift
- 作用范围：全局或指定标签
- 冲突检测与覆盖确认
- 导入/导出快捷键配置（JSON 格式）

### 界面与主题
- Ant Design 5 现代暗色主题
- 高 DPI / Retina 屏幕适配
- 终端支持复制、粘贴、清屏

## 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│  - SSHManager: ssh2 连接管理、自动重连、keepalive             │
│  - ConfigStore: electron-store 持久化存储                    │
│  - ShortcutManager: 全局快捷键注册                          │
│  - IPC Handlers: 消息路由                                   │
└─────────────────────────────────────────────────────────────┘
                              │ IPC
┌─────────────────────────────────────────────────────────────┐
│                      Preload Script                          │
│  - contextBridge 暴露安全 API                               │
│  - window.electronAPI.connect, disconnect, settings.get...   │
└─────────────────────────────────────────────────────────────┘
                              │ contextBridge
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│  - React 18 + Ant Design 5                                  │
│  - xterm.js 终端 + FitAddon                                 │
│  - 多标签管理、书签侧边栏、命令笔记本                        │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

### 环境要求
- Node.js 18+
- npm 9+
- Windows 10+ / macOS 11+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
# 同时启动主进程和渲染进程
npm run dev
```

- 渲染进程：Vite dev server at http://localhost:5173
- 主进程：TypeScript 编译后由 Electron 加载

### 构建

```bash
# 构建主进程
npm run build:main

# 构建渲染进程
npm run build:renderer

# 构建全部
npm run build
```

### 打包

```bash
# 构建并打包（未安装包）
npm run pack

# 构建并打包（安装包）
npm run dist

# 仅 Windows
npm run dist:win

# 仅 macOS
npm run dist:mac
```

## 项目结构

```
leeson-ssh/
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口，窗口管理
│   │   ├── ssh-manager.ts       # ssh2 连接管理
│   │   ├── config-store.ts      # electron-store 封装
│   │   ├── shortcut-manager.ts   # 全局快捷键
│   │   └── ipc-handlers.ts      # IPC 通道处理
│   ├── preload/                  # 预加载脚本
│   │   └── index.ts             # contextBridge API
│   ├── renderer/                 # React 应用
│   │   ├── App.tsx              # 根组件
│   │   └── components/
│   │       ├── Sidebar.tsx      # 书签面板
│   │       ├── TabBar.tsx       # 终端标签栏
│   │       ├── Terminal.tsx     # xterm.js 封装
│   │       ├── CommandBook.tsx  # 命令笔记本
│   │       └── ...
│   └── shared/                  # 共享类型定义
│       └── types.ts            # IPC_CHANNELS, 接口定义
├── resources/                    # 应用图标
├── package.json
├── tsconfig.json
├── tsconfig.main.json           # 主进程 TypeScript 配置
├── vite.config.ts               # Vite 配置
└── electron-builder.yml        # 打包配置
```

## 快捷键

| 操作 | Windows | macOS |
|------|---------|-------|
| 新建标签 | Ctrl+T | Cmd+T |
| 关闭标签 | Ctrl+W | Cmd+W |
| 发送命令笔记本当前行 | Ctrl+I | Cmd+I |
| 保存 | Ctrl+S | Cmd+S |
| 复制 | Ctrl+C | Cmd+C |
| 粘贴 | Ctrl+V | Cmd+V |

## 许可证

MIT
