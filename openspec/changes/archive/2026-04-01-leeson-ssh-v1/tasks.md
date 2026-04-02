## 1. 项目初始化

- [x] 1.1 初始化 package.json，name 为 "leeson-ssh"，version 为 "1.0.0"
- [x] 1.2 安装依赖：electron, typescript, react, react-dom, antd, @ant-design/icons, @xterm/xterm, @xterm/addon-fit, ssh2, electron-store, electron-log, vite, @vitejs/plugin-react
- [x] 1.3 创建 tsconfig.json，开启严格模式
- [x] 1.4 创建 vite.config.ts 配置渲染进程打包
- [x] 1.5 创建 electron-builder.yml 配置跨平台打包
- [x] 1.6 创建 main/preload/renderer 目录结构
- [x] 1.7 验证空壳项目能正常构建和启动

## 1.5 首次启动配置引导

- [x] 1.8 实现首次启动检测（检查配置目录是否存在）
- [x] 1.9 实现配置目录选择对话框，引导用户选择配置存储路径
- [x] 1.10 在用户指定目录初始化默认配置文件
- [x] 1.11 创建默认分组"未分组"（不可删除）

## 2. 主进程核心

- [x] 2.1 实现 src/main/index.ts，包含 App 生命周期（ready, window-all-closed, activate）
- [x] 2.2 实现 BrowserWindow 创建，配置 preload 脚本路径
- [x] 2.3 配置 CSP headers 保证渲染进程安全
- [x] 2.4 使用 electron-log 配置日志系统
- [x] 2.5 添加全局异常处理器，记录堆栈跟踪

## 3. SSH 管理器（主进程）

- [x] 3.1 实现 SSHManager 类，包含 connect/disconnect/send 方法
- [x] 3.2 实现密码认证流程
- [x] 3.3 实现私钥认证流程（支持加密私钥，需输入 passphrase）
- [x] 3.4 实现 SSH Agent 认证（Pageant / ssh-agent）
- [x] 3.5 实现连接状态机（disconnected → connecting → connected）
- [x] 3.6 添加连接超时处理（固定 30 秒）
- [x] 3.7 添加认证失败错误处理
- [x] 3.8 实现会话跟踪（Map<sessionId, SSHConnection>）
- [x] 3.9 实现 SSH 数据流到 IPC 的数据转发
- [x] 3.10 实现断开连接时会话清理
- [x] 3.11 实现自动重连功能（指数退避：1s → 2s → 4s → 8s → 16s → 32s，最大 60s）
- [x] 3.12 实现重连状态推送（ssh:status 发送 reconnect_attempt）
- [x] 3.13 实现重连成功后恢复终端内容
- [x] 3.14 实现 SSH Keepalive 保活机制（默认间隔）

## 4. IPC 处理器（主进程）

- [x] 4.1 注册 ssh:connect 处理器并添加参数验证
- [x] 4.2 注册 ssh:disconnect 处理器
- [x] 4.3 注册 ssh:send 处理器
- [x] 4.4 注册 config:get 处理器
- [x] 4.5 注册 config:set 处理器
- [x] 4.6 实现 sessionId 生成（uuid 或自增）
- [x] 4.7 关联 SSHManager 事件到 IPC 发送（ssh:output, ssh:status, ssh:closed）

## 5. 配置存储（主进程）

- [x] 5.1 初始化 electron-store 并配置 schema 校验
- [x] 5.2 定义 bookmarks schema（id, name, host, port, username, authType, credentialRef, notes, groupId）
- [x] 5.3 定义 groups schema（id, name, parentId），包含默认"未分组"
- [x] 5.4 定义 shortcuts schema（id, keys[], command, scope）
- [x] 5.5 定义 settings schema（fontSize, scrollbackLines, configDir）
- [x] 5.6 实现书签 CRUD 操作（创建、读取、更新、删除）
- [x] 5.7 实现分组 CRUD 操作（默认"未分组"不可删除）
- [x] 5.8 实现快捷键 CRUD 操作
- [x] 5.9 实现配置目录指定功能（首次启动引导用户选择）
- [x] 5.10 实现多行发送间隔配置（ms）

## 6. Preload 脚本

- [x] 6.1 创建 preload/index.ts，配置 contextBridge
- [x] 6.2 暴露 electronAPI.connect({ host, port, username, auth })
- [x] 6.3 暴露 electronAPI.disconnect({ sessionId })
- [x] 6.4 暴露 electronAPI.send({ sessionId, data })
- [x] 6.5 暴露 electronAPI.onOutput(callback) 处理 ssh:output 事件
- [x] 6.6 暴露 electronAPI.onStatus(callback) 处理 ssh:status 事件
- [x] 6.7 暴露 electronAPI.onClosed(callback) 处理 ssh:closed 事件
- [x] 6.8 暴露 electronAPI.config.get(key) / config.set(key, value)
- [x] 6.9 在共享类型文件中为暴露的 API 添加类型定义

## 7. 渲染进程 - 项目初始化

- [x] 7.1 创建 index.html 入口文件
- [x] 7.2 创建 main.tsx，使用 React 18 createRoot
- [x] 7.3 创建 App.tsx，包含基本布局（Sidebar, TabBar, Terminal, CommandBook）
- [x] 7.4 配置 Ant Design 5 暗色主题算法
- [x] 7.5 配置基础 CSS reset 和字体
- [x] 7.6 创建 IPC API 的类型定义（镜像 preload 类型）

## 8. 侧边栏 - 书签面板

- [x] 8.1 创建 Sidebar 组件，可折叠面板
- [x] 8.2 实现书签列表渲染，支持分组层级结构
- [x] 8.3 实现搜索输入框，支持按名称/主机模糊过滤
- [x] 8.4 实现左键点击打开新标签并连接
- [x] 8.5 实现右键菜单（编辑、删除、复制、移动分组）
- [x] 8.6 实现书签表单弹窗（创建/编辑）
- [x] 8.7 实现文件夹/分组树形结构
- [x] 8.8 添加"添加书签"按钮
- [x] 8.9 连接配置存储实现书签持久化

## 9. 标签栏 - 终端标签

- [x] 9.1 创建 TabBar 组件，水平标签列表
- [x] 9.2 实现标签渲染，包含标题和状态指示点（彩色圆点）
- [x] 9.3 实现活动标签状态管理
- [x] 9.4 实现"+"按钮新建空白标签
- [x] 9.5 实现每个标签上的"x"按钮关闭
- [x] 9.6 实现双击标签标题重命名
- [x] 9.7 实现标签右键菜单（关闭、关闭其他、关闭全部）
- [x] 9.8 添加键盘快捷键：Ctrl+T（新建）、Ctrl+W（关闭）
- [x] 9.9 实现标签拖拽排序（鼠标拖拽标签到新位置）
- [x] 9.10 实现会话标题默认值：用户未自定义时使用 host:port

## 10. 终端组件（xterm.js）

- [x] 10.1 创建 Terminal 组件，集成 xterm.js
- [x] 10.2 使用暗色主题初始化 Terminal（theme: { background: '#1e1e1e' }）
- [x] 10.3 加载并应用 FitAddon 实现自适应大小
- [x] 10.4 实现 onData 处理器通过 IPC 发送输入
- [x] 10.5 实现 resize 处理器通知 SSH PTY 新尺寸
- [x] 10.6 实现终端容器 ref，窗口大小变化时调用 fit()
- [x] 10.7 设置滚动缓冲区上限（从 settings 读取，默认 1000 行）
- [x] 10.8 配置等宽字体和默认字号（14px）
- [x] 10.9 标签关闭时处理终端清理
- [x] 10.10 实现 Tab 补全响应处理（透传远程服务器的补全响应）

## 11. 命令笔记本面板

- [x] 11.1 创建 CommandBook 组件，可折叠面板（单一文件模式）
- [x] 11.2 实现"打开文件"按钮，通过文件对话框打开 .txt
- [x] 11.3 实现文件内容显示（textarea 或代码编辑器）
- [x] 11.4 实现当前行高亮（跟踪光标位置）
- [x] 11.5 实现失焦自动保存和 Ctrl+S / Cmd+S 保存
- [x] 11.6 实现 Ctrl+I / Cmd+I 发送当前行到活动终端
- [x] 11.7 实现发送前去除首尾空格并追加换行
- [x] 11.8 实现面板折叠/展开切换
- [x] 11.9 实现浮动/脱离为独立窗口
- [x] 11.10 实现选中多行发送功能（每行间隔可配置）
- [x] 11.11 发送后保持光标位置不变（不自动下移）

## 12. 快速连接弹窗

- [x] 12.1 创建 QuickConnectModal 组件
- [x] 12.2 实现表单字段：主机、端口（默认 22）、用户名
- [x] 12.3 实现会话名称字段（选填，用户不填则默认用 host:port）
- [x] 12.4 实现认证方式选择器（密码 / 私钥）
- [x] 12.5 实现密码输入框（加密显示）
- [x] 12.6 实现私钥文件选择器
- [x] 12.7 实现"连接"按钮处理器
- [x] 12.8 提交时创建新标签（使用用户输入的名称或默认 host:port）并发起连接

## 13. 自定义快捷键管理

- [x] 13.1 创建 ShortcutsSettings 组件（可通过菜单或设置访问）
- [x] 13.2 实现快捷键列表展示
- [x] 13.3 实现"添加快捷键"表单（组合键输入 + 命令字段）
- [x] 13.4 实现组合键捕获（Ctrl/Cmd + 按键）
- [x] 13.5 实现作用域选择器（全局 / 按标签）
- [x] 13.6 实现与系统保留键和已有快捷键的冲突检测
- [x] 13.7 实现冲突警告对话框，支持覆盖确认
- [x] 13.8 实现快捷键删除
- [x] 13.9 在主进程实现 globalShortcut 注册
- [x] 13.10 实现快捷键执行（发送命令到活动终端）
- [x] 13.11 实现快捷键 JSON 导出
- [x] 13.12 实现快捷键 JSON 导入

## 14. 设置面板

- [x] 14.1 创建 Settings 组件，带标签页/分区
- [x] 14.2 实现字号调节滑块
- [x] 14.3 实现滚动缓冲区行数配置（默认 1000 行）
- [x] 14.4 实现多行发送间隔配置（默认 100ms）
- [x] 14.5 实现主题切换（V1.0 仅暗色，但预留未来亮色主题结构）
- [x] 14.6 将设置持久化到配置存储

## 15. 跨平台集成

- [x] 15.1 实现平台检测（Windows vs macOS）
- [x] 15.2 调整键盘快捷键标签（macOS 上 Ctrl → Cmd）
- [x] 15.3 处理窗口控制按钮位置（Windows 右上角，macOS 左上角）
- [x] 15.4 按平台正确处理文件路径
- [x] 15.5 macOS Ctrl+C 发送中断信号（SIGINT），不等同于复制
- [x] 15.6 Windows 文件路径由系统自动适配

## 16. 插件系统基础（扩展性预留）

- [x] 16.1 设计插件接口规范（未来支持 AI 命令学习等扩展）
- [x] 16.2 预留插件加载机制（V1.0 暂不实现具体插件）
- [x] 16.3 定义插件 API 暴露范围

## 17. 打包与分发

- [ ] 17.1 创建应用图标（1024x1024 PNG）
- [x] 17.2 配置 electron-builder Windows 打包（NSIS 安装程序）
- [x] 17.3 配置 electron-builder macOS 打包（DMG，通用二进制）
- [ ] 17.4 在 Windows 机器或虚拟机上测试 Windows 构建
- [ ] 17.5 在 Mac 机器上测试 macOS 构建
- [ ] 17.6 验证 .exe 能运行并连接测试 SSH 服务器
- [ ] 17.7 验证 .app 能运行并连接测试 SSH 服务器

## 18. 最终验收

- [ ] 18.1 验证 SSH 密码连接正常
- [ ] 18.2 验证 SSH 私钥连接正常（含加密私钥 passphrase）
- [ ] 18.3 验证 SSH Agent 认证（Pageant / ssh-agent）
- [ ] 18.4 验证书签 CRUD 和持久化（含默认分组）
- [ ] 18.5 验证多标签切换和关闭
- [ ] 18.6 验证命令笔记本打开/发送/自动保存
- [ ] 18.7 验证选中多行发送（间隔可配置）
- [ ] 18.8 验证自定义快捷键触发并发送命令
- [ ] 18.9 验证暗色主题渲染正确
- [ ] 18.10 验证应用启动时间在 4 秒以内
- [ ] 18.11 验证无控制台错误或未处理异常
- [ ] 18.12 验证断开连接后自动重连功能（触发断开后检查是否自动重连）
- [ ] 18.13 验证标签拖拽排序功能（拖动标签到新位置）
- [ ] 18.14 验证会话命名功能（自定义名称和默认 host:port 标题）
- [ ] 18.15 验证滚动缓冲区配置生效（可配置，默认 1000 行）
- [ ] 18.16 验证 Tab 补全响应显示
- [ ] 18.17 验证配置目录首次选择引导
- [ ] 18.18 验证 macOS Ctrl+C 发送中断信号
