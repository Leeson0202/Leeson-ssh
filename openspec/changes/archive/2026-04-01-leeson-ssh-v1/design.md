## 背景

Leeson-ssh 是一款面向开发者、运维工程师和 QA 的跨平台 SSH 客户端。项目从零开始，使用 Electron + React 技术栈。主要约束：支持 Windows 和 macOS，不涉及云端同步，本地存储优先，V1.0 目标支持 20 个并发会话，不包含终端分屏功能。

用户画像：需要日常管理多个 SSH 连接的用户，依赖命令笔记本和自定义快捷键提升工作效率。

## 目标 / 非目标

**目标：**
- 提供快速、可靠的 SSH 客户端，具备书签管理和多标签终端
- 集成命令笔记本，支持向远程服务器发送预置命令
- 支持自定义键盘快捷键绑定常用命令
- 在 Windows 和 macOS 上提供一致的使用体验

**非目标：**
- 终端分屏（V1.0）
- 云端同步 / 远程协作
- Linux 桌面支持（V1.0）
- 批量命令执行（跨多服务器）

## 技术决策

### 1. 技术栈：Electron + TypeScript + React

**决策：** 使用 Electron 作为桌面框架，TypeScript + React 构建 UI。

**理由：**
- `ssh2` 是 Node.js 生态中最成熟的 SSH 实现，支持完整的 SSH 协议
- `xterm.js` 与 Electron 集成的文档最为完善
- Ant Design 提供开箱即用的暗色主题组件
- electron-builder 提供稳定的跨平台打包方案

**备选方案：**
- **Tauri**：包体积更小，但 Rust SSH 库和终端模拟支持尚不成熟
- **Flutter**：终端模拟库生态薄弱，SSH 支持弱

### 2. 进程架构：Main + Preload + Renderer

```
┌─────────────────────────────────────────────────────┐
│                    Main Process                      │
│  - ssh2 连接管理                                     │
│  - electron-store（配置持久化）                       │
│  - globalShortcut（快捷键注册）                       │
│  - App 生命周期管理                                   │
└────────────────────────┬────────────────────────────┘
                         │ IPC（contextBridge）
┌────────────────────────┴────────────────────────────┐
│                   Preload Script                     │
│  - 通过 contextBridge 暴露安全 API                   │
│  - window.electronAPI.connect/disconnect/execute...  │
└────────────────────────┬────────────────────────────┘
                         │
┌────────────────────────┴────────────────────────────┐
│                  Renderer Process                    │
│  - React 18 + Ant Design 5                          │
│  - xterm.js 终端渲染                                 │
│  - UI 状态管理                                       │
└─────────────────────────────────────────────────────┘
```

**理由：** Electron 的安全模型要求 Main 和 Renderer 之间严格隔离，Preload 提供了受控的桥接通道。

### 3. SSH 连接模型：每个 Tab 对应一个 Session + 自动重连

**决策：** 每个终端标签页对应一个独立的 SSH 连接，不使用连接池或 Channel 复用。连接断开后自动尝试重连。

```
Tab1 ──▶ SSH Session 1 (sessionId: "s1", 断开 → 自动重连)
Tab2 ──▶ SSH Session 2 (sessionId: "s2", 断开 → 自动重连)
Tab3 ──▶ SSH Session 3 (sessionId: "s3", 断开 → 自动重连)
...
Tab20 ──▶ SSH Session 20 (sessionId: "s20", 断开 → 自动重连)
```

**会话命名：** Tab 标题支持用户自定义名称。用户未指定时，默认使用目标主机 IP:Port 作为标题。

**自动重连策略：**
- 首次重连：1 秒后
- 后续重连：指数退避（2s, 4s, 8s, 16s, 32s），最大延迟 60 秒
- 最大重连次数：无限制，直到用户主动关闭
- 重连成功：恢复终端滚动缓冲区内容

**理由：** 模型简单、易于调试，20 并发上限轻松满足。自动重连提升用户体验，避免网络波动导致会话中断。连接池会增加复杂度但没有明显收益。

**备选方案：**
- **连接池**：可以跨 Tab 共享 TCP 连接，规模化时更高效，但会话状态管理更复杂。

### 4. IPC 协议设计

**决策：** 使用 Electron 的 `ipcMain.handle` 处理请求/响应模式，`ipcRenderer.send` 处理单向推送。

**Invoke（请求/响应）：**
| Channel | 方向 | Payload | Response |
|---------|------|---------|----------|
| `ssh:connect` | R→M | `{ host, port, username, auth }` | `{ success, sessionId?, error? }` |
| `ssh:disconnect` | R→M | `{ sessionId }` | `{ success }` |
| `ssh:send` | R→M | `{ sessionId, data }` | `{ success }` |
| `config:get` | R→M | `{ key }` | `{ value }` |
| `config:set` | R→M | `{ key, value }` | `{ success }` |

**Send（单向推送）：**
| Channel | 方向 | Payload |
|---------|------|---------|
| `ssh:output` | M→R | `{ sessionId, data }` |
| `ssh:status` | M→R | `{ sessionId, status }` |
| `ssh:closed` | M→R | `{ sessionId, reason }` |

**理由：** 标准 Electron IPC 模式，invoke 和 send 分离使协议易于理解和调试。

### 5. 终端集成：xterm.js + FitAddon

**决策：** 使用 `@xterm/xterm` 配合 `@xterm/addon-fit` 进行终端渲染。

**数据流：**
```
SSH Server → ssh2 (Main) → IPC send('ssh:output') → xterm.write()
xterm.onData() → IPC invoke('ssh:send') → ssh2 → SSH Server
```

**理由：** xterm.js 处理所有终端模拟工作（ANSI 解析、光标、滚动缓冲区），我们只需接入数据流。

### 6. 配置存储：electron-store

**决策：** 使用 `electron-store` 存储所有持久化数据（书签、分组、快捷键、应用设置）。

**存储结构：**
```json
{
  "bookmarks": [
    {
      "id": "bm1",
      "name": "生产环境 Web",
      "host": "prod.example.com",
      "port": 22,
      "username": "webadmin",
      "authType": "password",
      "credentialRef": "encrypted:xxx",
      "notes": "",
      "groupId": "g1"
    }
  ],
  "groups": [
    { "id": "g1", "name": "生产环境", "parentId": null }
  ],
  "shortcuts": [
    {
      "id": "sh1",
      "keys": ["Ctrl", "K"],
      "command": "kubectl get pods",
      "scope": "global"
    }
  ],
  "settings": {
    "fontSize": 14,
    "theme": "dark"
  }
}
```

**理由：** electron-store 提供简单的 JSON 持久化，支持凭据加密。此规模无需数据库。

### 7. 凭据安全

**决策：** 使用 electron-store 内置加密存储凭据，首次启动时用户设置加密密码。

**平台集成（未来）：**
- Windows：DPAPI（通过 electron-store）
- macOS：Keychain（计划未来版本集成）

**理由：** V1.0 使用用户设置的密码加密。完整的平台 Keychain 集成计划在未来版本，但超出 V1.0 范围。

### 8. UI 框架：Ant Design 5 暗色主题

**决策：** 使用 Ant Design 5 配合 `theme.darkAlgorithm` 和自定义暗色配色。

**理由：** Ant Design 提供所有需要的组件（侧边栏、标签、按钮、输入框、右键菜单），内置暗色主题支持，减少自定义 CSS 工作量。

### 9. 项目结构

```
leeson-ssh/
├── package.json
├── electron-builder.yml
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main/                    # Electron 主进程
│   │   ├── index.ts             # 入口，App 生命周期
│   │   ├── ssh-manager.ts       # ssh2 连接管理
│   │   ├── config-store.ts     # electron-store 封装
│   │   ├── shortcut-manager.ts  # globalShortcut 处理
│   │   └── ipc-handlers.ts      # IPC 通道处理
│   ├── preload/                 # 预加载脚本
│   │   └── index.ts             # contextBridge API 暴露
│   └── renderer/                # React 应用
│       ├── index.html
│       ├── main.tsx             # React 入口
│       ├── App.tsx              # 根组件
│       ├── components/
│       │   ├── Sidebar/         # 书签面板
│       │   ├── TabBar/          # 终端标签栏
│       │   ├── Terminal/        # xterm.js 封装
│       │   └── CommandBook/     # 命令笔记本
│       ├── hooks/               # 自定义 React hooks
│       ├── store/               # 状态管理
│       └── styles/
│           └── theme.ts         # Ant Design 主题配置
└── resources/                   # 应用图标等资源
```

## 风险与权衡

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| ssh2 连接意外断开 | 用户丢失终端会话 | 实现指数退避自动重连 |
| 大滚动缓冲区影响 xterm.js 性能 | 长时间会话内存膨胀 | 用户可配置缓冲区大小，默认 1000 行 |
| 20 并发 SSH 连接内存占用 | 高于轻量级客户端 | 监控内存，按需优化 |
| 全局快捷键与系统冲突 | 用户体验摩擦 | 软件内优先，冲突时提示用户确认 |
| 用户配置目录误选 | 配置丢失或无法启动 | 首次配置引导，提示选择合适目录 |

## 待决问题

### ✅ 已确认决策

#### SSH 连接
- ✅ **私钥 passphrase**：V1.0 支持加密私钥（需要输入 passphrase）
- ✅ **SSH Agent**：支持 Pageant (Windows) / ssh-agent (macOS/Linux)
- ✅ **Keepalive**：默认开启，使用 SSH 协议默认间隔
- ✅ **连接超时**：固定 30 秒，不开放配置

#### 终端体验
- ✅ **滚动缓冲区**：用户可配置，默认 1000 行
- ✅ **Ctrl+C 行为**：无选中时发送 SIGINT 信号
- ✅ **Tab 补全**：支持（透传远程服务器的 Tab 补全响应）

#### 书签管理
- ✅ **批量导入/导出**：V1.0 不需要
- ✅ **书签图标**：全部使用默认图标，不开放配置
- ✅ **分组管理**：用户自行分组，默认有一个"未分组"分组

#### 命令笔记本
- ✅ **文件模式**：单一文件模式
- ✅ **自动保存**：开启后自动保存
- ✅ **发送后换行**：不自动换行
- ✅ **多行发送**：支持选中多行发送，每行间隔可调节（用户配置）
- ✅ **命令历史**：不记录

#### 快捷键
- ✅ **预设快捷键**：不提供
- ✅ **冲突行为**：软件内优先，检测到冲突时允许用户选择覆盖
- ✅ **宏命令**：不支持

#### 跨平台
- ✅ **macOS Ctrl+C**：发送中断信号（SIGINT），不等同于 Cmd+C 复制
- ✅ **Windows 文件路径**：由系统自动适配
- ✅ **UI 一致性**：跨平台保持一致的 UI 和交互

#### 数据与存储
- ✅ **配置目录**：初始化时由用户指定
- ✅ **操作日志**：不需要
- ✅ **崩溃报告**：不需要，连接失败时及时反馈给用户

#### 扩展性
- ✅ **插件机制**：未来考虑，预留插件接口（如 AI 命令学习）

### ❓ 仍需确认

- **键盘交互式认证**：是否支持 RSA token 等交互式验证？（按需，可延后）
- **终端字体选择**：是否允许用户选择等宽字体？（可延后至 V1.1）
- **HTTP/SOCKS 代理**：是否支持通过代理连接 SSH？（按需）
- **自动更新**：是否内置 auto-updater？（V1.0 后考虑）
- **Windows 安装目录**：是否允许用户选择安装路径？（V1.0 后考虑）
- **便携模式**：是否提供免安装版本？（V1.0 后考虑）
