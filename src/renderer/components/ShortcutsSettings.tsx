import React, { useState, useEffect, useCallback } from 'react';
import { Table, Button, Modal, Form, Input, Select, Space, message, Popconfirm, Upload } from 'antd';
import type { Shortcut } from '../../shared/types';
import { UploadOutlined } from '@ant-design/icons';

interface ShortcutsSettingsProps {}

const ShortcutsSettings: React.FC<ShortcutsSettingsProps> = () => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShortcut, setEditingShortcut] = useState<Shortcut | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    loadShortcuts();
  }, []);

  const loadShortcuts = async () => {
    try {
      const data = await window.electronAPI.shortcuts.getAll();
      setShortcuts(data || []);
    } catch (error) {
      console.error('Load shortcuts error:', error);
    }
  };

  const handleExport = () => {
    const json = JSON.stringify(shortcuts, null, 2);
    window.electronAPI.dialog.saveFile(json, 'shortcuts.json');
  };

  const handleImport = async (file: File) => {
    try {
      const content = await file.text();
      const imported = JSON.parse(content) as Shortcut[];
      if (!Array.isArray(imported)) {
        message.error('文件格式错误');
        return false;
      }
      // Import each shortcut
      for (const shortcut of imported) {
        if (shortcut.keys && shortcut.command && shortcut.scope) {
          await window.electronAPI.shortcuts.create(shortcut);
        }
      }
      await window.electronAPI.shortcuts.register();
      message.success(`成功导入 ${imported.length} 个快捷键`);
      loadShortcuts();
    } catch (error) {
      message.error('导入失败');
    }
    return false; // Prevent default upload behavior
  };

  const handleAdd = () => {
    setEditingShortcut(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (shortcut: Shortcut) => {
    setEditingShortcut(shortcut);
    form.setFieldsValue(shortcut);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      await window.electronAPI.shortcuts.delete(id);
      // Re-register shortcuts in main process
      await window.electronAPI.shortcuts.register();
      message.success('删除成功');
      loadShortcuts();
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleSubmit = async (values: any) => {
    try {
      // Check for conflicts with existing shortcuts
      const keysStr = Array.isArray(values.keys) ? values.keys.join('+') : values.keys;
      const conflict = shortcuts.find(s => {
        const existingKeys = Array.isArray(s.keys) ? s.keys.join('+') : s.keys;
        return existingKeys === keysStr && s.id !== editingShortcut?.id;
      });

      if (conflict) {
        Modal.confirm({
          title: '快捷键冲突',
          content: `快捷键 "${keysStr}" 已被 "${conflict.command}" 使用，是否覆盖？`,
          okText: '覆盖',
          cancelText: '取消',
          onOk: async () => {
            await window.electronAPI.shortcuts.update(conflict.id, values);
            await window.electronAPI.shortcuts.register();
            message.success('更新成功');
            setModalOpen(false);
            loadShortcuts();
          },
        });
        return;
      }

      if (editingShortcut) {
        await window.electronAPI.shortcuts.update(editingShortcut.id, values);
      } else {
        await window.electronAPI.shortcuts.create(values);
      }
      // Re-register shortcuts in main process
      await window.electronAPI.shortcuts.register();
      message.success(editingShortcut ? '更新成功' : '创建成功');
      setModalOpen(false);
      loadShortcuts();
    } catch (error) {
      message.error('保存失败');
    }
  };

  const columns = [
    {
      title: '快捷键',
      dataIndex: 'keys',
      key: 'keys',
      render: (keys: string[]) => keys.join(' + '),
    },
    {
      title: '命令',
      dataIndex: 'command',
      key: 'command',
    },
    {
      title: '作用域',
      dataIndex: 'scope',
      key: 'scope',
      render: (scope: string) => scope === 'global' ? '全局' : scope,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: Shortcut) => (
        <Space>
          <Button type="link" size="small" onClick={() => handleEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确定删除此快捷键？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        <Button type="primary" onClick={handleAdd}>
          添加快捷键
        </Button>
        <Button onClick={handleExport}>
          导出
        </Button>
        <Upload
          showUploadList={false}
          beforeUpload={handleImport}
          accept=".json"
        >
          <Button icon={<UploadOutlined />}>导入</Button>
        </Upload>
      </div>

      <Table
        columns={columns}
        dataSource={shortcuts}
        rowKey="id"
        size="small"
        pagination={false}
      />

      <Modal
        title={editingShortcut ? '编辑快捷键' : '添加快捷键'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="保存"
      >
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item
            name="keys"
            label="快捷键"
            rules={[{ required: true, message: '请输入快捷键' }]}
          >
            <Input placeholder="例如: Ctrl+Shift+1" />
          </Form.Item>

          <Form.Item
            name="command"
            label="命令"
            rules={[{ required: true, message: '请输入命令' }]}
          >
            <Input.TextArea rows={3} placeholder="要发送的命令内容" />
          </Form.Item>

          <Form.Item name="scope" label="作用域" initialValue="global">
            <Select>
              <Select.Option value="global">全局（在任意标签页生效）</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ShortcutsSettings;
