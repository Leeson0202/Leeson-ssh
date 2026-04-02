import React, { useState, useEffect, useMemo } from 'react';
import { Input, Tree, Button, Modal, Form, Select, Input as AntInput, message, Dropdown, MenuProps } from 'antd';
import { SearchOutlined, SettingOutlined, ThunderboltOutlined, EditOutlined, DeleteOutlined, FolderOutlined, FileOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import type { Bookmark, BookmarkGroup } from '../../shared/types';

interface SidebarProps {
  onConnect: (bookmark: Bookmark) => void;
  onQuickConnect: () => void;
  onOpenSettings: () => void;
}

interface TreeDataNode extends DataNode {
  data?: Bookmark;
}

const Sidebar: React.FC<SidebarProps> = ({ onConnect, onQuickConnect, onOpenSettings }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [groups, setGroups] = useState<BookmarkGroup[]>([]);
  const [searchText, setSearchText] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editGroupModalOpen, setEditGroupModalOpen] = useState(false);
  const [editingBookmark, setEditingBookmark] = useState<Bookmark | null>(null);
  const [editingGroup, setEditingGroup] = useState<BookmarkGroup | null>(null);
  const [form] = Form.useForm();
  const [groupForm] = Form.useForm();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [bookmarksData, groupsData] = await Promise.all([
      window.electronAPI.bookmarks.getAll(),
      window.electronAPI.groups.getAll(),
    ]);
    setBookmarks(bookmarksData || []);
    setGroups(groupsData || []);
  };

  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(
      b =>
        b.name.toLowerCase().includes(searchText.toLowerCase()) ||
        b.host.toLowerCase().includes(searchText.toLowerCase())
    );
  }, [bookmarks, searchText]);

  const getBookmarkMenu = (bookmark: Bookmark): MenuProps => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setEditingBookmark(bookmark);
          form.setFieldsValue(bookmark);
          setEditModalOpen(true);
        },
      },
      {
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除',
        danger: true,
        onClick: async (e) => {
          e.domEvent.stopPropagation();
          await window.electronAPI.bookmarks.delete(bookmark.id);
          message.success('删除成功');
          loadData();
        },
      },
    ],
  });

  const getGroupMenu = (group: BookmarkGroup): MenuProps => ({
    items: [
      {
        key: 'edit',
        icon: <EditOutlined />,
        label: '编辑分组',
        onClick: (e) => {
          e.domEvent.stopPropagation();
          setEditingGroup(group);
          groupForm.setFieldsValue({ name: group.name });
          setEditGroupModalOpen(true);
        },
      },
      ...(group.id !== 'default' ? [{
        key: 'delete',
        icon: <DeleteOutlined />,
        label: '删除分组',
        danger: true,
        onClick: async (e) => {
          e.domEvent.stopPropagation();
          await window.electronAPI.groups.delete(group.id);
          message.success('删除成功');
          loadData();
        },
      }] : []),
    ],
  });

  const buildTreeData = (): TreeDataNode[] => {
    const result: TreeDataNode[] = [];

    // 按分组组织
    groups.forEach(group => {
      const groupBookmarks = filteredBookmarks.filter(b => b.groupId === group.id);
      result.push({
        title: (
          <Dropdown menu={getGroupMenu(group)} trigger={['contextMenu']}>
            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              cursor: 'pointer',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
            }}>
              <FolderOutlined style={{ color: '#faad14', flexShrink: 0 }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{group.name}</span>
            </span>
          </Dropdown>
        ),
        key: `group-${group.id}`,
        isLeaf: false,
        children: groupBookmarks.map(bookmark => ({
          title: (
            <Dropdown menu={getBookmarkMenu(bookmark)} trigger={['contextMenu']}>
              <span style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                <FileOutlined style={{ color: '#52c41a', flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{bookmark.name}</span>
              </span>
            </Dropdown>
          ),
          key: `bookmark-${bookmark.id}`,
          isLeaf: true,
          data: bookmark,
        })),
      });
    });

    return result;
  };

  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) return;
    const key = selectedKeys[0] as string;
    if (key.startsWith('bookmark-')) {
      const bookmarkId = key.replace('bookmark-', '');
      const bookmark = bookmarks.find(b => b.id === bookmarkId);
      if (bookmark) {
        onConnect(bookmark);
      }
    }
  };

  const handleSave = async (values: any) => {
    if (editingBookmark) {
      await window.electronAPI.bookmarks.update(editingBookmark.id, values);
      message.success('更新成功');
    } else {
      await window.electronAPI.bookmarks.create(values);
      message.success('创建成功');
    }
    setEditModalOpen(false);
    setEditingBookmark(null);
    form.resetFields();
    loadData();
  };

  const handleGroupSave = async (values: { name: string }) => {
    if (editingGroup) {
      await window.electronAPI.groups.update(editingGroup.id, values);
      message.success('更新成功');
    } else {
      await window.electronAPI.groups.create(values);
      message.success('创建成功');
    }
    setEditGroupModalOpen(false);
    setEditingGroup(null);
    groupForm.resetFields();
    loadData();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 8 }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input
          placeholder="搜索书签..."
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          style={{ flex: 1 }}
        />
        <Button icon={<SettingOutlined />} onClick={onOpenSettings} />
      </div>

      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={onQuickConnect}
        style={{ marginBottom: 8 }}
        block
      >
        快速连接
      </Button>

      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tree
          treeData={buildTreeData()}
          selectedKeys={[]}
          onSelect={handleSelect}
          blockNode
          showIcon
        />
      </div>

      {/* 书签编辑弹窗 */}
      <Modal
        title={editingBookmark ? '编辑书签' : '添加书签'}
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingBookmark(null);
          form.resetFields();
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSave}
          initialValues={{
            port: 22,
            authType: 'password',
            groupId: 'default',
          }}
        >
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <AntInput placeholder="书签名称" />
          </Form.Item>

          <Form.Item name="host" label="主机" rules={[{ required: true }]}>
            <AntInput placeholder="IP 或域名" />
          </Form.Item>

          <Form.Item name="port" label="端口" rules={[{ required: true }]}>
            <AntInput type="number" placeholder="22" />
          </Form.Item>

          <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
            <AntInput placeholder="用户名" />
          </Form.Item>

          <Form.Item name="authType" label="认证方式">
            <Select>
              <Select.Option value="password">密码</Select.Option>
              <Select.Option value="private_key">私钥</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item name="credentialRef" label="密码/私钥">
            <AntInput.Password placeholder="密码或私钥内容" />
          </Form.Item>

          <Form.Item name="groupId" label="分组">
            <Select>
              {groups.map(g => (
                <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="备注">
            <AntInput.TextArea rows={2} placeholder="备注信息" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 分组编辑弹窗 */}
      <Modal
        title={editingGroup ? '编辑分组' : '添加分组'}
        open={editGroupModalOpen}
        onCancel={() => {
          setEditGroupModalOpen(false);
          setEditingGroup(null);
          groupForm.resetFields();
        }}
        onOk={() => groupForm.submit()}
      >
        <Form
          form={groupForm}
          layout="vertical"
          onFinish={handleGroupSave}
        >
          <Form.Item name="name" label="分组名称" rules={[{ required: true }]}>
            <AntInput placeholder="分组名称" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Sidebar;
