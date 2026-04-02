# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Leeson-ssh is a cross-platform SSH client built with Electron, TypeScript, React, and xterm.js. It provides multi-tab terminal management, bookmark organization, a command notebook, and custom shortcuts.

## Commands

```bash
# Development
npm run dev          # Run main + renderer concurrently (main: tsc + electron, renderer: vite)
npm run dev:main     # Compile main process and run electron
npm run dev:renderer  # Run Vite dev server at localhost:5173

# Build
npm run build        # Build both main and renderer
npm run build:main   # Compile main process (tsc -p tsconfig.main.json)
npm run build:renderer # Build renderer with Vite

# Packaging
npm run pack         # Build + electron-builder --dir (unpacked)
npm run dist         # Build + electron-builder (full installer)
npm run dist:win     # Windows NSIS installer
npm run dist:mac     # macOS DMG (universal)
```

## Architecture

### Electron 3-Process Model

```
┌─────────────────────────────────────────────────────────────┐
│                      Main Process                            │
│  (src/main/)                                                │
│  - SSHManager: ssh2 connections, auth, keepalive, reconnect  │
│  - ConfigStore: electron-store persistence                   │
│  - ShortcutManager: global shortcut registration            │
│  - IPC Handlers: message routing to SSH/Config/Window       │
└─────────────────────────────────────────────────────────────┘
                              │ IPC
┌─────────────────────────────────────────────────────────────┐
│                      Preload Script                         │
│  (src/preload/index.ts)                                    │
│  - contextBridge.exposeInMainWorld('electronAPI', ...)     │
│  - Typed IPC invocations (ssh.connect, settings.get, etc)  │
└─────────────────────────────────────────────────────────────┘
                              │ contextBridge
┌─────────────────────────────────────────────────────────────┐
│                    Renderer Process                          │
│  (src/renderer/)                                           │
│  - React 18 with Ant Design 5 (dark theme)                │
│  - xterm.js Terminal with FitAddon                         │
│  - App.tsx: main layout (Sidebar, TabBar, Terminal, etc)  │
└─────────────────────────────────────────────────────────────┘
```

### Key Source Files

| File | Purpose |
|------|---------|
| `src/main/index.ts` | App entry, BrowserWindow creation, lifecycle |
| `src/main/ssh-manager.ts` | SSH connections via ssh2, reconnect logic |
| `src/main/config-store.ts` | electron-store wrapper for bookmarks/shortcuts/settings |
| `src/main/ipc-handlers.ts` | IPC handler registration |
| `src/preload/index.ts` | API exposed to renderer via contextBridge |
| `src/shared/types.ts` | Shared TypeScript interfaces, IPC_CHANNELS constants |
| `src/renderer/App.tsx` | Root React component with layout |
| `src/renderer/components/Terminal.tsx` | xterm.js integration with FitAddon |
| `src/renderer/components/CommandBook.tsx` | Command notebook with auto-save |
| `src/renderer/components/Sidebar.tsx` | Bookmark tree with groups |
| `src/renderer/components/TabBar.tsx` | Multi-tab management |

### IPC Channels (IPC_CHANNELS)

Located in `src/shared/types.ts`. Channels include:
- `SSH_*`: connect, disconnect, send, resize, output, status, closed
- `CONFIG_*`: get, set
- `DIALOG_*`: openFile, saveFile, selectDir
- `SHORTCUTS_*`: register, unregister, execute
- `WINDOW_*`: detachCommandBook, attachCommandBook

### Type Sharing

Types are shared via `src/shared/types.ts` (runtime values) and `src/shared/types.d.ts` (declarations). The preload exports `ElectronAPI` type which is mirrored in renderer for type safety.

### Build Configuration

- `tsconfig.main.json`: Compiles main/preload/shared to CommonJS → `dist/`
- `vite.config.ts`: Bundles renderer with React plugin → `dist/renderer/`
- Main process uses `__dirname` for paths (compiled), renderer uses `/dist/renderer/`

## Development Notes

### Adding New IPC Handlers

1. Add channel constant to `IPC_CHANNELS` in `src/shared/types.ts`
2. Add handler in `src/main/ipc-handlers.ts`
3. Expose via `electronAPI` object in `src/preload/index.ts`
4. Import `IPC_CHANNELS` in preload (not directly accessing main process modules)

### Terminal Resize Flow

Terminal uses ResizeObserver → FitAddon.fit() → proposeDimensions() → IPC to main → SSHManager.resize() → channel.setWindow()

### Shortcut Registration

User-defined shortcuts are stored in config, loaded at startup via ShortcutManager.register(). The renderer calls `shortcuts.register()` IPC after CRUD operations to re-register.

### CommandBook Auto-save

- 5-second interval timer using `file:write` IPC (silent, no dialog)
- Also saves on textarea blur
- Uses `lastSavedContentRef` to track dirty state without triggering re-renders

### Window Detach

CommandBook can detach to a separate BrowserWindow. The main process creates `commandBookWindow`, and IPC channels coordinate attach/detach state with the renderer.
