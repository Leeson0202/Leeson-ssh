import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Tooltip, App } from 'antd';
import { FolderOpenOutlined, UpOutlined, BorderOutlined } from '@ant-design/icons';

interface CommandBookProps {
  activeSessionId: string | null;
  onCollapse: () => void;
  onDetach?: () => void;
}

const CommandBook: React.FC<CommandBookProps> = ({ activeSessionId, onCollapse, onDetach }) => {
  const [content, setContent] = useState('');
  const [filePath, setFilePath] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { message } = App.useApp();
  const lastSavedContentRef = useRef<string>('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 加载上次打开的文件
  useEffect(() => {
    const loadLastFile = async () => {
      setLoading(true);
      try {
        const settings = await window.electronAPI.settings.get();
        if (settings?.lastCommandBookPath) {
          const result = await window.electronAPI.file.read(settings.lastCommandBookPath);
          if (result.success) {
            setContent(result.content);
            lastSavedContentRef.current = result.content;
            setFilePath(settings.lastCommandBookPath);
          }
        }
      } catch (error) {
        console.error('Load last file error:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLastFile();
  }, []);

  // renderKey 用于控制 textarea 的 key，确保重新加载文件时能正确渲染
  const [renderKey, setRenderKey] = useState(0);

  // 当文件路径变化时（打开新文件），更新 renderKey 以重新渲染 textarea
  useEffect(() => {
    setRenderKey(k => k + 1);
  }, [filePath]);

  // 定时自动保存（每5秒）
  useEffect(() => {
    if (filePath) {
      autoSaveTimerRef.current = setInterval(() => {
        if (content !== lastSavedContentRef.current) {
          window.electronAPI.file.write(filePath, content).then((result: any) => {
            if (result.success) {
              lastSavedContentRef.current = content;
            }
          });
        }
      }, 5000);
    }

    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [filePath, content]);

  // 手动保存（失焦时）
  useEffect(() => {
    const handleBlur = () => {
      if (filePath && content !== lastSavedContentRef.current) {
        window.electronAPI.file.write(filePath, content).then((result: any) => {
          if (result.success) {
            lastSavedContentRef.current = content;
          }
        });
      }
    };

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('blur', handleBlur);
      return () => textarea.removeEventListener('blur', handleBlur);
    }
  }, [filePath, content]);

  // 打开文件
  const handleOpenFile = async () => {
    const result = await window.electronAPI.dialog.openFile();
    if (result.success && result.filePath) {
      setLoading(false);
      setContent(result.content);
      lastSavedContentRef.current = result.content;
      setFilePath(result.filePath);
      await window.electronAPI.settings.update({ lastCommandBookPath: result.filePath });
    }
  };

  // 另存为（新文件）
  const handleSaveAs = useCallback(async () => {
    const result = await window.electronAPI.dialog.saveFile(content);
    if (result.success && result.filePath) {
      setFilePath(result.filePath);
      lastSavedContentRef.current = content;
      await window.electronAPI.settings.update({ lastCommandBookPath: result.filePath });
      message.success('保存成功');
    } else if (!result.canceled) {
      message.error('保存失败');
    }
  }, [content]);

  // 获取当前光标位置的行号
  const getCurrentLineNumber = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return 0;

    const text = textarea.value.substring(0, textarea.selectionStart);
    return text.split('\n').length - 1;
  }, []);

  // 获取当前行的内容
  const getCurrentLineContent = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return '';

    const lines = textarea.value.split('\n');
    const lineNumber = getCurrentLineNumber();
    return lines[lineNumber] || '';
  }, [getCurrentLineNumber]);

  // 发送（支持发送选中内容或当前行）
  const handleSend = useCallback(async () => {
    if (!activeSessionId) {
      message.warning('请先连接 SSH');
      return;
    }

    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value } = textarea;

    let textToSend: string;

    // 如果有选中文本，发送选中的内容；否则发送当前行
    if (selectionStart !== selectionEnd) {
      textToSend = value.substring(selectionStart, selectionEnd).trim();
      if (!textToSend) {
        message.warning('选中文本为空');
        return;
      }
    } else {
      textToSend = getCurrentLineContent().trim();
      if (!textToSend) {
        message.warning('当前行为空');
        return;
      }
    }

    // 按行分割并发送
    const linesToSend = textToSend.split('\n').filter(line => line.trim());
    if (linesToSend.length === 0) {
      return;
    }

    // 保存光标位置（行号和列号）
    const lines = value.split('\n');
    const cursorLineIndex = value.substring(0, selectionEnd).split('\n').length - 1;
    const cursorColumnIndex = selectionEnd - (cursorLineIndex > 0 ? value.indexOf('\n', value.lastIndexOf('\n', selectionEnd - 1) + 1) + 1 : 0);

    const settings = await window.electronAPI.settings.get();
    const interval = settings?.multiLineSendInterval || 100;

    for (const line of linesToSend) {
      const trimmedLine = line.trim();
      if (trimmedLine) {
        await window.electronAPI.ssh.send(activeSessionId, trimmedLine + '\n');
        await new Promise(resolve => setTimeout(resolve, interval));
      }
    }

    // 发送后保持光标位置不变
    setTimeout(() => {
      if (textareaRef.current) {
        // 计算新的光标位置
        const newLines = textareaRef.current.value.split('\n');
        if (cursorLineIndex < newLines.length) {
          let newCursorPos = 0;
          for (let i = 0; i < cursorLineIndex; i++) {
            newCursorPos += newLines[i].length + 1;
          }
          newCursorPos += Math.min(cursorColumnIndex, newLines[cursorLineIndex].length);
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          textareaRef.current.focus();
        }
      }
    }, 0);
  }, [activeSessionId, getCurrentLineContent]);

  // 键盘事件处理
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key === 'i') {
        e.preventDefault();
        handleSend();
      } else if (modifier && e.key === 's') {
        e.preventDefault();
        // 如果没有打开文件，则另存为新文件
        if (!filePath) {
          handleSaveAs();
        }
        // 如果已打开文件，内容变化会自动保存，Ctrl+S无需操作
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSend, handleSaveAs, filePath]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  };

  // 获取文件名
  const getFileName = (path: string) => {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || path;
  };

  // 脱离为独立窗口
  const handleDetach = () => {
    if (onDetach) {
      onDetach();
    }
    window.electronAPI.window.detachCommandBook();
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 8, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexShrink: 0 }}>
        {filePath && (
          <span style={{ fontSize: 12, color: '#999', flex: 1 }}>
            {getFileName(filePath)}
          </span>
        )}
        <Tooltip title="打开文件">
          <Button size="small" icon={<FolderOpenOutlined />} onClick={handleOpenFile} />
        </Tooltip>
        <Tooltip title="脱离窗口">
          <Button size="small" icon={<BorderOutlined />} onClick={handleDetach} />
        </Tooltip>
        <Tooltip title="折叠">
          <Button size="small" icon={<UpOutlined />} onClick={onCollapse} />
        </Tooltip>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <textarea
          key={renderKey}
          ref={textareaRef}
          value={content}
          onChange={handleTextChange}
          style={{
            width: '100%',
            height: '100%',
            background: '#1e1e1e',
            color: '#e0e0e0',
            border: '1px solid #3a3a3a',
            borderRadius: 4,
            padding: 8,
            fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
            fontSize: 13,
            lineHeight: 1.5,
            resize: 'none',
            outline: 'none',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
        <Button
          size="small"
          type="primary"
          onClick={handleSend}
          disabled={!activeSessionId}
        >
          发送 {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+I
        </Button>
      </div>
    </div>
  );
};

export default CommandBook;
