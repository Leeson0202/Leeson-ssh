import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  tabId: string;
  sessionId: string | null;
  sessionName: string;
  isActive: boolean;
  onTitleChange?: (title: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ tabId, sessionId, sessionName, isActive, onTitleChange }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const terminalRef = useRef<XTerm | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);
  const [settings, setSettings] = useState<any>(null);
  const [initialized, setInitialized] = useState(false);

  // 加载设置（只加载一次）
  useEffect(() => {
    const loadSettings = async () => {
      const s = await window.electronAPI.settings.get();
      setSettings(s);
    };
    loadSettings();
  }, []);

  // 初始化终端
  useEffect(() => {
    if (!containerRef.current || !settings) return;
    if (terminalRef.current) return; // 防止重复初始化

    const terminal = new XTerm({
      fontSize: settings?.fontSize || 14,
      fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
      theme: {
        background: '#1e1e1e',
        foreground: '#e0e0e0',
        cursor: '#e0e0e0',
        cursorAccent: '#1e1e1e',
        selectionBackground: '#3a3a3a',
        black: '#1e1e1e',
        red: '#ff4d4f',
        green: '#52c41a',
        yellow: '#faad14',
        blue: '#1890ff',
        magenta: '#722ed1',
        cyan: '#13c2c2',
        white: '#e0e0e0',
        brightBlack: '#666666',
        brightRed: '#ff7875',
        brightGreen: '#73d13d',
        brightYellow: '#ffd666',
        brightBlue: '#40a9ff',
        brightMagenta: '#b37feb',
        brightCyan: '#36cfc9',
        brightWhite: '#ffffff',
      },
      scrollback: settings?.scrollbackLines || 1000,
      cursorBlink: true,
      cursorStyle: 'block',
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);

    terminal.open(containerRef.current);

    setTimeout(() => {
      try {
        fitAddon.fit();
      } catch (e) {
        // ignore
      }
      setInitialized(true);
    }, 50);

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;
    sessionIdRef.current = sessionId;

    // 终端输入 -> 发送到 SSH
    terminal.onData((data) => {
      const currentSessionId = sessionIdRef.current;
      if (currentSessionId) {
        window.electronAPI.ssh.send(currentSessionId, data);
      }
    });

    // 窗口大小变化时重新适应并通知 SSH PTY
    const handleResize = () => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims && sessionIdRef.current) {
          window.electronAPI.ssh.resize(sessionIdRef.current, dims.cols, dims.rows);
        }
      } catch (e) {
        // ignore
      }
    };

    window.addEventListener('resize', handleResize);

    // 监听容器尺寸变化
    const resizeObserver = new ResizeObserver(() => {
      try {
        fitAddon.fit();
        const dims = fitAddon.proposeDimensions();
        if (dims && sessionIdRef.current) {
          window.electronAPI.ssh.resize(sessionIdRef.current, dims.cols, dims.rows);
        }
      } catch (e) {
        // ignore
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      try {
        terminal.dispose();
      } catch (e) {
        // ignore
      }
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [settings]);

  // 处理 sessionId 变化
  useEffect(() => {
    if (!terminalRef.current || !initialized) return;

    sessionIdRef.current = sessionId;

    if (sessionId) {
      // 新会话，订阅输出
      const unsubOutput = window.electronAPI.ssh.onOutput((data) => {
        if (data.sessionId === sessionId && terminalRef.current) {
          terminalRef.current.write(data.data);
        }
      });

      return () => {
        unsubOutput();
      };
    }
  }, [sessionId, initialized]);

  // 更新终端设置
  useEffect(() => {
    if (terminalRef.current && settings && initialized) {
      terminalRef.current.options.fontSize = settings.fontSize;
      terminalRef.current.options.scrollback = settings.scrollbackLines;
      try {
        fitAddonRef.current?.fit();
      } catch (e) {
        // ignore
      }
    }
  }, [settings, initialized]);

  // 处理 isActive 变化 - 切换标签页时重新适应尺寸并通知 PTY
  useEffect(() => {
    if (isActive && terminalRef.current && fitAddonRef.current && initialized) {
      // 延迟一点等待 DOM 渲染完成
      setTimeout(() => {
        try {
          fitAddonRef.current?.fit();
          const dims = fitAddonRef.current?.proposeDimensions();
          if (dims && sessionIdRef.current) {
            window.electronAPI.ssh.resize(sessionIdRef.current, dims.cols, dims.rows);
          }
        } catch (e) {
          // ignore
        }
      }, 50);
    }
  }, [isActive, initialized]);

  return (
    <>
      <style>{`
        .xterm-viewport::-webkit-scrollbar {
          width: 8px;
        }
        .xterm-viewport::-webkit-scrollbar-track {
          background: #1e1e1e;
        }
        .xterm-viewport::-webkit-scrollbar-thumb {
          background: #3a3a3a;
          border-radius: 4px;
        }
        .xterm-viewport::-webkit-scrollbar-thumb:hover {
          background: #4a4a4a;
        }
      `}</style>
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          padding: '8px 8px 24px 8px',
          background: '#1e1e1e',
          overflow: 'hidden',
          zIndex: isActive ? 1 : 0,
        }}
      />
    </>
  );
};

export default Terminal;
