import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Layout, message } from 'antd';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import Sidebar from './components/Sidebar';
import TabBar from './components/TabBar';
import Terminal from './components/Terminal';
import CommandBook from './components/CommandBook';
import QuickConnectModal from './components/QuickConnectModal';
import SettingsModal from './components/SettingsModal';
import FirstLaunchSetup from './components/FirstLaunchSetup';
import type { SessionInfo, ConnectionStatus, SSHConnectionParams, BookmarkGroup } from '../shared/types';

const { Sider, Content, Header } = Layout;

interface Tab {
  id: string;
  sessionId: string | null;
  title: string;
  status: ConnectionStatus;
  connectionParams?: SSHConnectionParams;  // 用于失败后重连
}

declare global {
  interface Window {
    electronAPI: typeof import('../preload/index').electronAPI;
  }
}

const App: React.FC = () => {
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [commandBookCollapsed, setCommandBookCollapsed] = useState(false);
  const [commandBookHeight, setCommandBookHeight] = useState(200);
  const [isResizing, setIsResizing] = useState(false);
  const [quickConnectOpen, setQuickConnectOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<BookmarkGroup[]>([]);
  const commandBookRef = useRef<HTMLDivElement>(null);

  // 初始化检查
  useEffect(() => {
    const init = async () => {
      try {
        const firstLaunch = await window.electronAPI.app.isFirstLaunch();
        setIsFirstLaunch(firstLaunch);
        const groupsData = await window.electronAPI.groups.getAll();
        setGroups(groupsData || []);
        setLoading(false);
      } catch (error) {
        console.error('Init error:', error);
        setLoading(false);
      }
    };
    init();
  }, []);

  // 监听 SSH 状态变化
  useEffect(() => {
    const unsubStatus = window.electronAPI.ssh.onStatus((data: any) => {
      setTabs(prev =>
        prev.map(tab =>
          tab.sessionId === data.sessionId
            ? { ...tab, status: data.status as ConnectionStatus }
            : tab
        )
      );
    });

    const unsubClosed = window.electronAPI.ssh.onClosed((data) => {
      setTabs(prev =>
        prev.map(tab =>
          tab.sessionId === data.sessionId
            ? { ...tab, status: 'disconnected', sessionId: null }
            : tab
        )
      );
      message.warning('连接已断开');
    });

    return () => {
      unsubStatus();
      unsubClosed();
    };
  }, []);

  // 监听快捷键
  useEffect(() => {
    const unsub = window.electronAPI.onShortcut((action) => {
      if (action === 'toggle-sidebar') {
        setSidebarCollapsed(prev => !prev);
      }
    });
    return unsub;
  }, []);

  // 命令笔记本高度调节
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const windowHeight = window.innerHeight;
      const newHeight = windowHeight - e.clientY;
      setCommandBookHeight(Math.max(100, Math.min(newHeight, windowHeight - 200)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // 监听命令笔记本窗口重新附加事件
  useEffect(() => {
    const unsubscribe = window.electronAPI.window.onAttachCommandBook(() => {
      setCommandBookCollapsed(false);
    });
    return unsubscribe;
  }, []);

  const handleNewTab = useCallback((sessionId?: string, title?: string) => {
    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      sessionId: sessionId || null,
      title: title || '新标签页',
      status: sessionId ? 'connecting' : 'disconnected',
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
    return newTab.id;
  }, []);

  const handleCloseTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.sessionId) {
      window.electronAPI.ssh.disconnect(tab.sessionId);
    }
    setTabs(prev => {
      const newTabs = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId && newTabs.length > 0) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      } else if (newTabs.length === 0) {
        setActiveTabId(null);
      }
      return newTabs;
    });
  }, [tabs, activeTabId]);

  const handleTabReorder = useCallback((fromIndex: number, toIndex: number) => {
    setTabs(prev => {
      const newTabs = [...prev];
      const [removed] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, removed);
      return newTabs;
    });
  }, []);

  const handleSessionUpdate = useCallback((tabId: string, sessionId: string, title: string) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === tabId
          ? { ...tab, sessionId, title, status: 'connected' as ConnectionStatus, connectionParams: undefined }
          : tab
      )
    );
  }, []);

  const handleTabRename = useCallback((tabId: string, newTitle: string) => {
    setTabs(prev =>
      prev.map(tab =>
        tab.id === tabId ? { ...tab, title: newTitle } : tab
      )
    );
  }, []);

  // 刷新/重新连接当前活动标签页
  const handleRefresh = useCallback(async () => {
    const tab = tabs.find(t => t.id === activeTabId);
    if (!tab) return;

    // 如果有保存的连接参数，重新连接
    if (tab.connectionParams) {
      // 如果已连接，先断开
      if (tab.sessionId) {
        window.electronAPI.ssh.disconnect(tab.sessionId);
      }

      setTabs(prev =>
        prev.map(t =>
          t.id === tab.id ? { ...t, status: 'connecting' as ConnectionStatus, sessionId: null } : t
        )
      );

      const result = await window.electronAPI.ssh.connect(tab.connectionParams);

      if (result.success && result.sessionId) {
        handleSessionUpdate(tab.id, result.sessionId, tab.title);
      } else {
        message.error(`连接失败: ${result.error}`);
        setTabs(prev =>
          prev.map(t =>
            t.id === tab.id ? { ...t, status: 'connection_failed' as ConnectionStatus } : t
          )
        );
      }
    } else if (tab.status === 'connection_failed' || tab.status === 'disconnected') {
      // 尝试重新连接 - 使用当前标签页的信息打开快速连接对话框
      setQuickConnectOpen(true);
    }
  }, [activeTabId, tabs, handleSessionUpdate]);

  // 保存书签（从快速连接对话框）
  const handleSaveBookmark = useCallback(async (bookmark: any, groupIdentifier?: string) => {
    try {
      let groupId = 'default';
      let newGroup: BookmarkGroup | null = null;

      if (groupIdentifier) {
        // 如果指定了分组，先查找是否存在
        const existingGroup = groups.find(g => g.id === groupIdentifier || g.name === groupIdentifier);
        if (existingGroup) {
          groupId = existingGroup.id;
        } else if (typeof groupIdentifier === 'string' && groupIdentifier.trim()) {
          // 需要创建新分组
          newGroup = await window.electronAPI.groups.create({ name: groupIdentifier.trim() });
          groupId = newGroup.id;
        }
      }

      await window.electronAPI.bookmarks.create({
        ...bookmark,
        groupId,
      });

      // 如果创建了新分组，返回它
      return newGroup;
    } catch (error) {
      console.error('Save bookmark error:', error);
      return null;
    }
  }, [groups]);

  // 编辑并重连失败的标签页
  const handleTabEdit = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.connectionParams) {
      // 如果没有保存的连接参数，打开快速连接对话框
      setQuickConnectOpen(true);
      return;
    }

    // 使用保存的连接参数重新连接
    setTabs(prev =>
      prev.map(t =>
        t.id === tabId ? { ...t, status: 'connecting' as ConnectionStatus, sessionId: null } : t
      )
    );

    const result = await window.electronAPI.ssh.connect(tab.connectionParams);

    if (result.success && result.sessionId) {
      handleSessionUpdate(tabId, result.sessionId, tab.title);
    } else {
      message.error(`连接失败: ${result.error}`);
      setTabs(prev =>
        prev.map(t =>
          t.id === tabId ? { ...t, status: 'connection_failed' as ConnectionStatus } : t
        )
      );
    }
  }, [tabs, handleSessionUpdate]);

  const handleBookmarkConnect = useCallback(async (bookmark: any) => {
    const connectionParams: SSHConnectionParams = {
      host: bookmark.host,
      port: bookmark.port,
      username: bookmark.username,
      auth: {
        type: bookmark.authType as 'password' | 'private_key' | 'agent',
        password: bookmark.authType === 'password' ? bookmark.credentialRef : undefined,
        privateKey: bookmark.authType === 'private_key' ? bookmark.credentialRef : undefined,
      },
      sessionName: bookmark.name,
    };

    const tabId = handleNewTab(undefined, bookmark.name);

    try {
      const result = await window.electronAPI.ssh.connect(connectionParams);

      if (result.success && result.sessionId) {
        handleSessionUpdate(tabId, result.sessionId, bookmark.name);
      } else {
        message.error(`连接失败: ${result.error}`);
        // 不关闭标签页，而是标记为连接失败状态，保留连接参数供重连
        setTabs(prev =>
          prev.map(tab =>
            tab.id === tabId
              ? { ...tab, status: 'connection_failed' as ConnectionStatus, connectionParams }
              : tab
          )
        );
      }
    } catch (error) {
      message.error(`连接错误: ${error}`);
      setTabs(prev =>
        prev.map(tab =>
          tab.id === tabId
            ? { ...tab, status: 'connection_failed' as ConnectionStatus, connectionParams }
            : tab
        )
      );
    }
  }, [handleNewTab, handleSessionUpdate]);

  const activeTab = tabs.find(t => t.id === activeTabId);

  if (loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1e1e1e' }}>
        <span style={{ color: '#e0e0e0' }}>加载中...</span>
      </div>
    );
  }

  if (isFirstLaunch) {
    return <FirstLaunchSetup onComplete={() => setIsFirstLaunch(false)} />;
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {!sidebarCollapsed && (
        <Sider width={250} style={{ background: '#1e1e1e', borderRight: '1px solid #3a3a3a' }}>
          <Sidebar
            onConnect={handleBookmarkConnect}
            onQuickConnect={() => setQuickConnectOpen(true)}
            onOpenSettings={() => setSettingsOpen(true)}
          />
        </Sider>
      )}

      <Layout>
        <Header style={{ background: '#1e1e1e', padding: '0 8px', height: 40, lineHeight: '40px', borderBottom: '1px solid #3a3a3a', display: 'flex', alignItems: 'center' }}>
          <div onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ cursor: 'pointer', padding: '0 8px', color: '#e0e0e0', fontSize: 18 }}>
            {sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </div>
          <div style={{ flex: 1 }}>
            <TabBar
              tabs={tabs}
              activeTabId={activeTabId}
              onTabSelect={setActiveTabId}
              onTabClose={handleCloseTab}
              onRefresh={handleRefresh}
              onTabReorder={handleTabReorder}
              onTabRename={handleTabRename}
              onTabEdit={handleTabEdit}
            />
          </div>
        </Header>

        <Content style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
            {tabs.length > 0 ? (
              tabs.map(tab => (
                <Terminal
                  key={tab.id}
                  tabId={tab.id}
                  sessionId={tab.sessionId}
                  sessionName={tab.title}
                  isActive={tab.id === activeTabId}
                  onTitleChange={(title) => handleTabRename(tab.id, title)}
                />
              ))
            ) : (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#666' }}>
                暂无活动终端
              </div>
            )}
          </div>

          {!commandBookCollapsed && (
            <div
              ref={commandBookRef}
              style={{ height: commandBookHeight, borderTop: '1px solid #3a3a3a', position: 'relative' }}
            >
              <div
                onMouseDown={handleMouseDown}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 6,
                  cursor: 'ns-resize',
                  zIndex: 1,
                }}
              />
              <CommandBook
                activeSessionId={activeTab?.sessionId || null}
                onCollapse={() => setCommandBookCollapsed(true)}
                onDetach={() => setCommandBookCollapsed(true)}
              />
            </div>
          )}

          {commandBookCollapsed && (
            <button
              onClick={() => setCommandBookCollapsed(false)}
              style={{
                position: 'absolute',
                right: 8,
                bottom: 8,
                padding: '8px 16px',
                background: '#2a2a2a',
                border: '1px solid #3a3a3a',
                borderRadius: 4,
                color: '#e0e0e0',
                cursor: 'pointer',
                zIndex: 10,
              }}
            >
              命令笔记本
            </button>
          )}
        </Content>
      </Layout>

      <QuickConnectModal
        open={quickConnectOpen}
        onClose={() => setQuickConnectOpen(false)}
        onConnect={async (params, sessionName) => {
          const tabId = handleNewTab(undefined, sessionName || `${params.host}:${params.port}`);
          setQuickConnectOpen(false);

          const result = await window.electronAPI.ssh.connect(params);
          if (result.success && result.sessionId) {
            handleSessionUpdate(tabId, result.sessionId, sessionName || `${params.host}:${params.port}`);
          } else {
            message.error(`连接失败: ${result.error}`);
            // 不关闭标签页，而是标记为连接失败状态
            setTabs(prev =>
              prev.map(tab =>
                tab.id === tabId
                  ? { ...tab, status: 'connection_failed' as ConnectionStatus, connectionParams: params }
                  : tab
              )
            );
          }
        }}
        onSaveBookmark={handleSaveBookmark}
        groups={groups}
        onGroupsChange={setGroups}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </Layout>
  );
};

export default App;
