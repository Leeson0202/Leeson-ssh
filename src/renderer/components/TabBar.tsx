import React, { useState, useRef } from 'react';
import { Tabs, TabPaneProps } from 'antd';
import { Dropdown, Input, MenuProps } from 'antd';
import { CloseOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ConnectionStatus } from '../../shared/types';

interface Tab {
  id: string;
  sessionId: string | null;
  title: string;
  status: ConnectionStatus;
}

interface TabBarProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tabId: string) => void;
  onTabClose: (tabId: string) => void;
  onRefresh: () => void;
  onTabReorder: (fromIndex: number, toIndex: number) => void;
  onTabRename: (tabId: string, newTitle: string) => void;
  onTabEdit?: (tabId: string) => void;  // 编辑并重连失败连接
}

const getStatusColor = (status: ConnectionStatus): string => {
  switch (status) {
    case 'connected':
      return '#52c41a';
    case 'connecting':
    case 'reconnecting':
      return '#faad14';
    case 'disconnected':
      return '#8c8c8c';
    default:
      return '#ff4d4f';
  }
};

const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeTabId,
  onTabSelect,
  onTabClose,
  onRefresh,
  onTabReorder,
  onTabRename,
  onTabEdit,
}) => {
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const dragRef = useRef<{ fromIndex: number } | null>(null);

  const handleDoubleClick = (tab: Tab) => {
    setEditingTabId(tab.id);
    setEditingValue(tab.title);
  };

  const handleRenameConfirm = () => {
    if (editingTabId && editingValue.trim()) {
      onTabRename(editingTabId, editingValue.trim());
    }
    setEditingTabId(null);
    setEditingValue('');
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    dragRef.current = { fromIndex: index };
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, toIndex: number) => {
    e.preventDefault();
    if (dragRef.current && dragRef.current.fromIndex !== toIndex) {
      onTabReorder(dragRef.current.fromIndex, toIndex);
    }
    dragRef.current = null;
  };

  const getContextMenu = (tabId: string): MenuProps => {
    const tab = tabs.find(t => t.id === tabId);
    const isFailed = tab?.status === 'connection_failed';

    return {
      items: [
        ...(isFailed && onTabEdit ? [{
          key: 'edit',
          label: '编辑并重连',
          icon: <EditOutlined />,
          onClick: () => onTabEdit(tabId),
        }] : []),
        {
          key: 'close',
          label: '关闭',
          icon: <CloseOutlined />,
          onClick: () => onTabClose(tabId),
        },
        {
          key: 'closeOthers',
          label: '关闭其他',
          onClick: () => {
            tabs.forEach(t => {
              if (t.id !== tabId) onTabClose(t.id);
            });
          },
        },
        {
          key: 'closeAll',
          label: '关闭全部',
          onClick: () => {
            tabs.forEach(t => onTabClose(t.id));
          },
        },
        {
          key: 'rename',
          label: '重命名',
          icon: <EditOutlined />,
          onClick: () => {
            const tab = tabs.find(t => t.id === tabId);
            if (tab) {
              setEditingTabId(tab.id);
              setEditingValue(tab.title);
            }
          },
        },
      ],
    };
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
      <div
        style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          flexWrap: 'nowrap',
        }}
      >
        {tabs.map((tab, index) => (
          <Dropdown
            key={tab.id}
            menu={getContextMenu(tab.id)}
            trigger={['contextMenu']}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              onClick={() => onTabSelect(tab.id)}
              onDoubleClick={() => handleDoubleClick(tab)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '0 12px',
                height: 36,
                marginRight: 2,
                background: activeTabId === tab.id ? '#2a2a2a' : 'transparent',
                borderRadius: '4px 4px 0 0',
                cursor: 'pointer',
                minWidth: 120,
                maxWidth: 200,
                userSelect: 'none',
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: getStatusColor(tab.status),
                  flexShrink: 0,
                }}
              />

              {editingTabId === tab.id ? (
                <Input
                  size="small"
                  value={editingValue}
                  onChange={(e) => setEditingValue(e.target.value)}
                  onPressEnter={handleRenameConfirm}
                  onBlur={handleRenameConfirm}
                  autoFocus
                  style={{ flex: 1, height: 24 }}
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontSize: 13,
                    color: activeTabId === tab.id ? '#e0e0e0' : '#a0a0a0',
                  }}
                >
                  {tab.title}
                </span>
              )}

              <CloseOutlined
                onClick={(e) => {
                  e.stopPropagation();
                  onTabClose(tab.id);
                }}
                style={{ fontSize: 12, color: '#666', flexShrink: 0 }}
              />
            </div>
          </Dropdown>
        ))}
      </div>

      <div
        onClick={onRefresh}
        style={{
          padding: '0 12px',
          height: 36,
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          color: '#666',
        }}
        title="刷新连接"
      >
        <ReloadOutlined />
      </div>
    </div>
  );
};

export default TabBar;
