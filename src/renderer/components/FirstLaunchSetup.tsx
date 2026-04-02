import React, { useState } from 'react';
import { message, Steps, Button, Card } from 'antd';
import { FolderOutlined, CheckOutlined } from '@ant-design/icons';

interface FirstLaunchSetupProps {
  onComplete: () => void;
}

const FirstLaunchSetup: React.FC<FirstLaunchSetupProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [configDir, setConfigDir] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectDirectory = async () => {
    const dir = await window.electronAPI.app.selectDirectory();
    if (dir) {
      setConfigDir(dir);
      setStep(1);
    }
  };

  const handleFinish = async () => {
    if (!configDir) return;

    setLoading(true);
    try {
      // 初始化配置目录
      await window.electronAPI.config.set('settings', {
        configDir,
        fontSize: 14,
        scrollbackLines: 1000,
        multiLineSendInterval: 100,
      });
      onComplete();
    } catch (error) {
      message.error('初始化失败');
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#1e1e1e',
      }}
    >
      <Card
        style={{
          width: 500,
          background: '#2a2a2a',
          border: '1px solid #3a3a3a',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 style={{ color: '#e0e0e0', marginBottom: 8 }}>欢迎使用 Leeson-ssh</h1>
          <p style={{ color: '#a0a0a0' }}>首次启动配置向导</p>
        </div>

        <Steps
          current={step}
          items={[
            { title: '选择配置目录', description: '选择配置文件存储位置' },
            { title: '完成', description: '开始使用' },
          ]}
          style={{ marginBottom: 32 }}
        />

        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0a0a0', marginBottom: 24 }}>
              请选择一个目录用于存储配置文件、书签等数据
            </p>
            <Button
              type="primary"
              size="large"
              icon={<FolderOutlined />}
              onClick={handleSelectDirectory}
            >
              选择目录
            </Button>
          </div>
        )}

        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginBottom: 24,
              }}
            >
              <CheckOutlined style={{ color: '#52c41a', fontSize: 20 }} />
              <span style={{ color: '#e0e0e0' }}>配置目录已选择</span>
            </div>
            <p style={{ color: '#a0a0a0', marginBottom: 8, fontSize: 13 }}>
              {configDir}
            </p>
            <p style={{ color: '#666', marginBottom: 24, fontSize: 12 }}>
              配置文件将保存在此目录中
            </p>
            <Button type="primary" size="large" onClick={handleFinish} loading={loading}>
              开始使用
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default FirstLaunchSetup;
