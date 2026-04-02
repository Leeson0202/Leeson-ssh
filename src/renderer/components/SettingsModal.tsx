import React, { useState, useEffect } from 'react';
import { Modal, Tabs, Slider, InputNumber, message } from 'antd';
import type { Settings } from '../../shared/types';
import ShortcutsSettings from './ShortcutsSettings';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ open, onClose }) => {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [fontSize, setFontSize] = useState(14);
  const [scrollbackLines, setScrollbackLines] = useState(1000);
  const [multiLineSendInterval, setMultiLineSendInterval] = useState(100);

  useEffect(() => {
    if (open) {
      loadSettings();
    }
  }, [open]);

  const loadSettings = async () => {
    const s = await window.electronAPI.settings.get();
    setSettings(s);
    setFontSize(s.fontSize);
    setScrollbackLines(s.scrollbackLines);
    setMultiLineSendInterval(s.multiLineSendInterval);
  };

  const handleSave = async () => {
    try {
      await window.electronAPI.settings.update({
        fontSize,
        scrollbackLines,
        multiLineSendInterval,
      });
      message.success('设置已保存');
      onClose();
    } catch (error) {
      message.error('保存失败');
    }
  };

  return (
    <Modal
      title="设置"
      open={open}
      onCancel={onClose}
      onOk={handleSave}
      okText="保存"
      width={500}
    >
      <Tabs
        defaultActiveKey="terminal"
        items={[
          {
            key: 'terminal',
            label: '终端',
            children: (
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 8 }}>字体大小: {fontSize}px</div>
                  <Slider
                    min={10}
                    max={24}
                    value={fontSize}
                    onChange={setFontSize}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 8 }}>滚动缓冲区行数: {scrollbackLines}</div>
                  <Slider
                    min={100}
                    max={10000}
                    step={100}
                    value={scrollbackLines}
                    onChange={setScrollbackLines}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'commandbook',
            label: '命令笔记本',
            children: (
              <div style={{ padding: '16px 0' }}>
                <div style={{ marginBottom: 24 }}>
                  <div style={{ marginBottom: 8 }}>
                    多行发送间隔: {multiLineSendInterval}ms
                  </div>
                  <Slider
                    min={10}
                    max={1000}
                    step={10}
                    value={multiLineSendInterval}
                    onChange={setMultiLineSendInterval}
                  />
                  <div style={{ color: '#666', fontSize: 12, marginTop: 4 }}>
                    发送多行命令时，每行之间的延迟间隔
                  </div>
                </div>
              </div>
            ),
          },
          {
            key: 'shortcuts',
            label: '快捷键',
            children: <ShortcutsSettings />,
          },
        ]}
      />
    </Modal>
  );
};

export default SettingsModal;
