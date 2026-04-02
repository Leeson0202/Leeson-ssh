import { Client, ClientChannel, ConnectConfig } from 'ssh2';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import log from 'electron-log';
import {
  SSHConnectionParams,
  ConnectionStatus,
  SessionInfo,
  PasswordAuth,
  PrivateKeyAuth,
  AgentAuth,
} from '../shared/types';

interface ActiveSession {
  client: Client;
  channel: ClientChannel | null;
  info: SessionInfo;
  reconnectAttempts: number;
  reconnectTimer: NodeJS.Timeout | null;
}

export class SSHManager extends EventEmitter {
  private sessions: Map<string, ActiveSession> = new Map();
  private readonly MAX_RECONNECT_DELAY = 60000; // 60秒
  private readonly KEEPALIVE_INTERVAL = 30000; // 30秒

  constructor() {
    super();
  }

  async connect(params: SSHConnectionParams): Promise<{ success: boolean; sessionId?: string; error?: string }> {
    const sessionId = uuidv4();
    log.info(`SSH connect request: ${params.host}:${params.port} (sessionId: ${sessionId})`);

    try {
      const session = await this.createSession(sessionId, params);
      this.sessions.set(sessionId, session);
      this.updateStatus(sessionId, 'connecting');

      await this.establishConnection(session, params);

      this.updateStatus(sessionId, 'connected');
      log.info(`SSH connected: ${sessionId}`);

      return { success: true, sessionId };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      log.error(`SSH connection failed: ${sessionId}`, errorMsg);
      this.updateStatus(sessionId, 'connection_failed');
      this.cleanupSession(sessionId);
      return { success: false, error: errorMsg };
    }
  }

  private async createSession(sessionId: string, params: SSHConnectionParams): Promise<ActiveSession> {
    const client = new Client();

    const sessionName = params.sessionName || `${params.host}:${params.port}`;
    const sessionInfo: SessionInfo = {
      sessionId,
      sessionName,
      host: params.host,
      port: params.port,
      username: params.username,
      status: 'disconnected',
    };

    return {
      client,
      channel: null,
      info: sessionInfo,
      reconnectAttempts: 0,
      reconnectTimer: null,
    };
  }

  private async establishConnection(session: ActiveSession, params: SSHConnectionParams): Promise<void> {
    return new Promise((resolve, reject) => {
      const { client } = session;
      const config = this.buildConnectConfig(params);

      // 连接超时
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout (30s)'));
      }, 30000);

      client.on('ready', () => {
        clearTimeout(timeout);
        log.info(`SSH ready: ${session.info.sessionId}`);

        // 打开 shell
        client.shell((err, channel) => {
          if (err) {
            reject(err);
            return;
          }

          session.channel = channel;

          channel.on('data', (data: Buffer) => {
            this.emit('output', {
              sessionId: session.info.sessionId,
              data: data.toString(),
            });
          });

          channel.on('close', () => {
            log.info(`SSH channel closed: ${session.info.sessionId}`);
            this.handleDisconnect(session.info.sessionId);
          });

          channel.on('error', (err: Error) => {
            log.error(`SSH channel error: ${session.info.sessionId}`, err);
            this.emit('error', { sessionId: session.info.sessionId, error: err.message });
          });

          resolve();
        });
      });

      client.on('error', (err) => {
        clearTimeout(timeout);
        log.error(`SSH client error: ${session.info.sessionId}`, err);
        reject(err);
      });

      client.on('close', () => {
        log.info(`SSH client closed: ${session.info.sessionId}`);
      });

      client.connect(config);
    });
  }

  private buildConnectConfig(params: SSHConnectionParams): ConnectConfig {
    const config: ConnectConfig = {
      host: params.host,
      port: params.port,
      username: params.username,
      readyTimeout: 30000,
      keepaliveInterval: this.KEEPALIVE_INTERVAL,
    };

    const { auth } = params;

    if (auth.type === 'password') {
      config.password = (auth as PasswordAuth).password;
    } else if (auth.type === 'private_key') {
      const pkAuth = auth as PrivateKeyAuth;
      config.privateKey = pkAuth.privateKey;
      if (pkAuth.passphrase) {
        config.passphrase = pkAuth.passphrase;
      }
    } else if (auth.type === 'agent') {
      config.agent = process.env.SSH_AUTH_SOCK;
    }

    return config;
  }

  send(sessionId: string, data: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.channel) {
      log.warn(`SSH send failed: session not found or channel closed: ${sessionId}`);
      return false;
    }

    try {
      session.channel.write(data);
      return true;
    } catch (error) {
      log.error(`SSH send error: ${sessionId}`, error);
      return false;
    }
  }

  resize(sessionId: string, cols: number, rows: number): boolean {
    const session = this.sessions.get(sessionId);
    if (!session || !session.channel) {
      log.warn(`SSH resize failed: session not found or channel closed: ${sessionId}`);
      return false;
    }

    try {
      session.channel.setWindow(rows, cols, 0, 0);
      log.info(`SSH PTY resized: ${sessionId} to ${cols}x${rows}`);
      return true;
    } catch (error) {
      log.error(`SSH resize error: ${sessionId}`, error);
      return false;
    }
  }

  disconnect(sessionId: string): void {
    log.info(`SSH disconnect request: ${sessionId}`);
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 停止重连
    if (session.reconnectTimer) {
      clearTimeout(session.reconnectTimer);
      session.reconnectTimer = null;
    }

    session.client.end();
    this.updateStatus(sessionId, 'disconnected');
    this.cleanupSession(sessionId);
  }

  disconnectAll(): void {
    log.info('SSH disconnect all');
    for (const [sessionId] of this.sessions) {
      this.disconnect(sessionId);
    }
  }

  private handleDisconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    // 如果是主动断开，不重连
    if (session.info.status === 'disconnected') return;

    log.info(`SSH disconnected, attempting reconnect: ${sessionId}`);
    this.updateStatus(sessionId, 'reconnecting');
    this.scheduleReconnect(session);
  }

  private scheduleReconnect(session: ActiveSession): void {
    const delay = Math.min(
      Math.pow(2, session.reconnectAttempts) * 1000,
      this.MAX_RECONNECT_DELAY
    );

    session.reconnectAttempts++;
    log.info(`SSH reconnect scheduled in ${delay}ms (attempt ${session.reconnectAttempts}): ${session.info.sessionId}`);

    this.emit('status', {
      sessionId: session.info.sessionId,
      status: 'reconnecting',
      attempt: session.reconnectAttempts,
      nextRetry: delay,
    });

    session.reconnectTimer = setTimeout(async () => {
      try {
        await this.establishConnection(session, {
          host: session.info.host,
          port: session.info.port,
          username: session.info.username,
          auth: { type: 'agent' }, // TODO: 需要保存认证信息
          sessionName: session.info.sessionName,
        });
        session.reconnectAttempts = 0;
        this.updateStatus(session.info.sessionId, 'connected');
        log.info(`SSH reconnected: ${session.info.sessionId}`);
      } catch (error) {
        log.error(`SSH reconnect failed: ${session.info.sessionId}`, error);
        this.scheduleReconnect(session);
      }
    }, delay);
  }

  private updateStatus(sessionId: string, status: ConnectionStatus): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.info.status = status;
      this.emit('status', { sessionId, status });
    }
  }

  private cleanupSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      if (session.reconnectTimer) {
        clearTimeout(session.reconnectTimer);
      }
      session.client.end();
      this.sessions.delete(sessionId);
      this.emit('closed', { sessionId, reason: 'cleanup' });
    }
  }

  getSession(sessionId: string): SessionInfo | undefined {
    return this.sessions.get(sessionId)?.info;
  }

  getAllSessions(): SessionInfo[] {
    return Array.from(this.sessions.values()).map(s => s.info);
  }
}
