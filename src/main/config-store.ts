import Store from 'electron-store';
import log from 'electron-log';
import {
  AppConfig,
  Bookmark,
  BookmarkGroup,
  Shortcut,
  Settings,
  DEFAULT_SETTINGS,
  DEFAULT_GROUP,
} from '../shared/types';
import * as fs from 'fs';
import * as path from 'path';

interface StoreSchema {
  config: AppConfig;
}

export class ConfigStore {
  private store: Store<StoreSchema> | null = null;
  private configDir: string = '';

  async init(): Promise<void> {
    log.info('Initializing config store...');
    // 默认配置目录
    this.configDir = '';
    // 使用 electronStore 默认路径初始化
    this.store = new Store<StoreSchema>({
      name: 'config',
      defaults: {
        config: {
          bookmarks: [],
          groups: [DEFAULT_GROUP],
          shortcuts: [],
          settings: {
            ...DEFAULT_SETTINGS,
            configDir: '',
          },
        },
      },
    });
  }

  async initWithDir(configDir: string): Promise<void> {
    this.configDir = configDir;

    // 确保目录存在
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    const configPath = path.join(configDir, 'config.json');

    this.store = new Store<StoreSchema>({
      cwd: configDir,
      name: 'config',
      defaults: {
        config: {
          bookmarks: [],
          groups: [DEFAULT_GROUP],
          shortcuts: [],
          settings: {
            ...DEFAULT_SETTINGS,
            configDir,
          },
        },
      },
    });

    log.info(`Config store initialized at: ${configPath}`);
  }

  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    if (!this.store) {
      throw new Error('Config store not initialized');
    }
    const config = this.store.get('config') as AppConfig;
    return config[key];
  }

  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    if (!this.store) {
      throw new Error('Config store not initialized');
    }
    const config = this.store.get('config') as AppConfig;
    config[key] = value;
    this.store.set('config', config);
  }

  // 书签操作
  getBookmarks(): Bookmark[] {
    return this.get('bookmarks');
  }

  addBookmark(bookmark: Bookmark): void {
    const bookmarks = this.getBookmarks();
    bookmarks.push(bookmark);
    this.set('bookmarks', bookmarks);
  }

  updateBookmark(id: string, updates: Partial<Bookmark>): void {
    const bookmarks = this.getBookmarks();
    const index = bookmarks.findIndex(b => b.id === id);
    if (index !== -1) {
      bookmarks[index] = { ...bookmarks[index], ...updates };
      this.set('bookmarks', bookmarks);
    }
  }

  deleteBookmark(id: string): void {
    const bookmarks = this.getBookmarks().filter(b => b.id !== id);
    this.set('bookmarks', bookmarks);
  }

  // 分组操作
  getGroups(): BookmarkGroup[] {
    return this.get('groups');
  }

  addGroup(group: BookmarkGroup): void {
    const groups = this.getGroups();
    groups.push(group);
    this.set('groups', groups);
  }

  updateGroup(id: string, updates: Partial<BookmarkGroup>): void {
    const groups = this.getGroups();
    const index = groups.findIndex(g => g.id === id);
    if (index !== -1) {
      groups[index] = { ...groups[index], ...updates };
      this.set('groups', groups);
    }
  }

  deleteGroup(id: string): void {
    // 不能删除默认分组
    if (id === 'default') return;

    const groups = this.getGroups().filter(g => g.id !== id);
    this.set('groups', groups);

    // 将该分组的书签移到默认分组
    const bookmarks = this.getBookmarks();
    const updatedBookmarks = bookmarks.map(b =>
      b.groupId === id ? { ...b, groupId: 'default' } : b
    );
    this.set('bookmarks', updatedBookmarks);
  }

  // 快捷键操作
  getShortcuts(): Shortcut[] {
    return this.get('shortcuts');
  }

  addShortcut(shortcut: Shortcut): void {
    const shortcuts = this.getShortcuts();
    shortcuts.push(shortcut);
    this.set('shortcuts', shortcuts);
  }

  updateShortcut(id: string, updates: Partial<Shortcut>): void {
    const shortcuts = this.getShortcuts();
    const index = shortcuts.findIndex(s => s.id === id);
    if (index !== -1) {
      shortcuts[index] = { ...shortcuts[index], ...updates };
      this.set('shortcuts', shortcuts);
    }
  }

  deleteShortcut(id: string): void {
    const shortcuts = this.getShortcuts().filter(s => s.id !== id);
    this.set('shortcuts', shortcuts);
  }

  // 设置操作
  getSettings(): Settings {
    return this.get('settings');
  }

  updateSettings(updates: Partial<Settings>): void {
    const settings = { ...this.getSettings(), ...updates };
    this.set('settings', settings);
  }

  isInitialized(): boolean {
    return this.store !== null;
  }

  getConfigDir(): string {
    return this.configDir;
  }
}
