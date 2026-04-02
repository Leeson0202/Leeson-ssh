import { globalShortcut } from 'electron';
import log from 'electron-log';

interface ShortcutConfig {
  id: string;
  keys: string[];
  command: string;
  scope: 'global' | string;
}

export class ShortcutManager {
  private registeredShortcuts: Map<string, string> = new Map(); // accelerator -> id

  register(shortcut: ShortcutConfig, callback: (command: string) => void): boolean {
    const accelerator = this.buildAccelerator(shortcut.keys);

    if (this.isConflicting(accelerator)) {
      log.warn(`Shortcut conflict: ${accelerator}`);
      return false;
    }

    try {
      const success = globalShortcut.register(accelerator, () => {
        callback(shortcut.command);
      });

      if (success) {
        this.registeredShortcuts.set(accelerator, shortcut.id);
        log.info(`Registered shortcut: ${accelerator} -> ${shortcut.command}`);
      }

      return success;
    } catch (error) {
      log.error(`Failed to register shortcut: ${accelerator}`, error);
      return false;
    }
  }

  unregister(id: string): void {
    for (const [accelerator, shortcutId] of this.registeredShortcuts) {
      if (shortcutId === id) {
        globalShortcut.unregister(accelerator);
        this.registeredShortcuts.delete(accelerator);
        log.info(`Unregistered shortcut: ${accelerator}`);
        break;
      }
    }
  }

  unregisterAll(): void {
    globalShortcut.unregisterAll();
    this.registeredShortcuts.clear();
  }

  isConflicting(accelerator: string): boolean {
    return globalShortcut.isRegistered(accelerator);
  }

  checkConflicts(shortcuts: ShortcutConfig[]): string[] {
    const conflicts: string[] = [];
    for (const shortcut of shortcuts) {
      const accelerator = this.buildAccelerator(shortcut.keys);
      if (this.isConflicting(accelerator)) {
        conflicts.push(accelerator);
      }
    }
    return conflicts;
  }

  private buildAccelerator(keys: string[]): string {
    // Normalize keys for Electron accelerator format
    // Electron uses CommandOrControl to mean Ctrl on Windows/Linux, Cmd on macOS
    const modifierMap: Record<string, string> = {
      'ctrl': 'CommandOrControl',
      'control': 'CommandOrControl',
      'alt': 'Alt',
      'shift': 'Shift',
      'meta': 'Meta',
      'cmd': 'CommandOrControl',
      'command': 'CommandOrControl',
    };

    const parts: string[] = [];
    for (const key of keys) {
      const lower = key.toLowerCase();
      if (modifierMap[lower]) {
        parts.push(modifierMap[lower]);
      } else {
        // Regular key - capitalize
        parts.push(key.toUpperCase());
      }
    }
    return parts.join('+');
  }
}
