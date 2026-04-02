import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Select, InputNumber, Checkbox, message } from 'antd';
import type { SSHConnectionParams, AuthType, BookmarkGroup } from '../../shared/types';

interface QuickConnectModalProps {
  open: boolean;
  onClose: () => void;
  onConnect: (params: SSHConnectionParams, sessionName?: string) => void;
  onSaveBookmark?: (bookmark: any, groupName?: string) => Promise<BookmarkGroup | null>;
  groups?: BookmarkGroup[];
  onGroupsChange?: (groups: BookmarkGroup[]) => void;
}

const QuickConnectModal: React.FC<QuickConnectModalProps> = ({
  open,
  onClose,
  onConnect,
  onSaveBookmark,
  groups = [],
  onGroupsChange,
}) => {
  const [form] = Form.useForm();
  const [authType, setAuthType] = useState<AuthType>('password');
  const [loading, setLoading] = useState(false);
  const [saveToBookmark, setSaveToBookmark] = useState(false);
  const [localGroups, setLocalGroups] = useState<BookmarkGroup[]>(groups);

  // 当 groups prop 变化时更新本地状态
  useEffect(() => {
    setLocalGroups(groups);
  }, [groups]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const sessionName = values.sessionName || `${values.host}:${values.port || 22}`;
      const params: SSHConnectionParams = {
        host: values.host,
        port: values.port || 22,
        username: values.username,
        sessionName,
        auth: {
          type: authType,
          ...(authType === 'password'
            ? { password: values.password }
            : { privateKey: values.privateKey, passphrase: values.passphrase }),
        },
      };

      // 保存到书签
      if (saveToBookmark && onSaveBookmark) {
        let groupId = values.groupId;

        // 如果选择了新建分组
        if (values.groupId === 'new' && values.newGroupName) {
          // 创建新分组
          const newGroup = await onSaveBookmark(
            {
              name: sessionName,
              host: values.host,
              port: values.port || 22,
              username: values.username,
              authType,
              credentialRef: authType === 'password' ? values.password : values.privateKey,
            },
            values.newGroupName
          );

          // 如果创建成功，更新分组列表
          if (newGroup) {
            groupId = newGroup.id;
            // 更新本地分组状态
            setLocalGroups(prev => [...prev, newGroup]);
            // 通知父组件更新
            if (onGroupsChange) {
              onGroupsChange([...localGroups, newGroup]);
            }
          }
        } else {
          // 保存到现有分组
          await onSaveBookmark(
            {
              name: sessionName,
              host: values.host,
              port: values.port || 22,
              username: values.username,
              authType,
              credentialRef: authType === 'password' ? values.password : values.privateKey,
            },
            groupId
          );
        }
      }

      onConnect(params, sessionName);
      setLoading(false);
      form.resetFields();
      setSaveToBookmark(false);
      onClose();
    } catch (error) {
      setLoading(false);
      message.error('请填写完整信息');
    }
  };

  // 监听 groupId 变化以控制 newGroupName 输入框的显示
  const groupIdValue = Form.useWatch('groupId', form);

  return (
    <Modal
      title="添加连接"
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      okText="连接"
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item name="sessionName" label="会话名称（选填）">
          <Input placeholder="不填则默认使用 host:port" />
        </Form.Item>

        <Form.Item name="host" label="主机" rules={[{ required: true }]}>
          <Input placeholder="IP 或域名" />
        </Form.Item>

        <Form.Item name="port" label="端口" initialValue={22}>
          <InputNumber min={1} max={65535} style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
          <Input placeholder="用户名" />
        </Form.Item>

        <Form.Item name="authType" label="认证方式">
          <Select value={authType} onChange={setAuthType}>
            <Select.Option value="password">密码</Select.Option>
            <Select.Option value="private_key">私钥</Select.Option>
            <Select.Option value="agent">SSH Agent</Select.Option>
          </Select>
        </Form.Item>

        {authType === 'password' && (
          <Form.Item name="password" label="密码" rules={[{ required: true }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
        )}

        {authType === 'private_key' && (
          <>
            <Form.Item name="privateKey" label="私钥内容" rules={[{ required: true }]}>
              <Input.TextArea
                rows={4}
                placeholder="粘贴私钥内容（-----BEGIN RSA PRIVATE KEY----- ...）"
              />
            </Form.Item>
            <Form.Item name="passphrase" label="私钥密码（选填）">
              <Input.Password placeholder="如果私钥加密的话" />
            </Form.Item>
          </>
        )}

        {onSaveBookmark && (
          <>
            <div style={{ marginBottom: 16 }}>
              <Checkbox checked={saveToBookmark} onChange={(e) => setSaveToBookmark(e.target.checked)}>
                保存到书签
              </Checkbox>
            </div>

            {saveToBookmark && (
              <>
                <Form.Item name="groupId" label="分组">
                  <Select placeholder="选择分组">
                    {localGroups.map(g => (
                      <Select.Option key={g.id} value={g.id}>{g.name}</Select.Option>
                    ))}
                    <Select.Option value="new">+ 新建分组</Select.Option>
                  </Select>
                </Form.Item>

                {groupIdValue === 'new' && (
                  <Form.Item name="newGroupName" label="新建分组名称" rules={[{ required: true }]}>
                    <Input placeholder="输入新分组名称" />
                  </Form.Item>
                )}
              </>
            )}
          </>
        )}
      </Form>
    </Modal>
  );
};

export default QuickConnectModal;
