import { WebSocket, WebSocketServer } from 'ws';
import z from 'zod';
import { randomUUID } from 'node:crypto';

import { RedisClientType } from './modules/redis';
import { verifyToken } from '../lib/token';
import { logger } from '../lib/logger';

const incomingMessageSchema = z.object({
  type: z.union([
    z.literal('RESPONSE'),
    z.literal('LISTEN'),
    z.literal('MESSAGE'),
    z.literal('PING'),
    z.literal('PONG'),
    z.literal('AUTH'),
  ]),
  data: z.object({
    token: z.string(),
  }),
});

declare module 'ws' {
  interface WebSocket {
    id: string;
    isAlive: boolean;
    interval: NodeJS.Timeout;
  }
}

const HEARTBEAT_INTERVAL = 60000 * 5;

export class RealtimeRepository {
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;
  private readonly clients: Map<string, WebSocket>;

  constructor(
    readonly wss: WebSocketServer,
    readonly redisClient: RedisClientType,
  ) {
    this.publisher = redisClient.duplicate();
    this.subscriber = redisClient.duplicate();
    this.clients = new Map();

    wss.on('connection', this.onConnection);
  }

  async publishMessage(message: object) {
    await this.publisher.publish('realtime', JSON.stringify(message));
  }

  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();

    await this.subscriber.subscribe('realtime', this.onReceivedMessage);
  }

  private onConnection = (ws: WebSocket) => {
    const socketId = randomUUID();
    const interval = setInterval(this.heartbeat(socketId), HEARTBEAT_INTERVAL);

    ws.id = socketId;
    ws.isAlive = true;
    ws.interval = interval;

    this.clients.set(socketId, ws);

    ws.on('message', this.validateIncomingMessages(this.onMessage, socketId));
    ws.on('close', this.onClose(socketId));
    ws.on('error', this.onError(socketId));
    ws.on('ping', this.onPing(socketId));
    ws.on('pong', this.onPong(socketId));
    ws.on('unexpected-response', this.onUnexpectedResponse);
  };

  private heartbeat = (socketId: string) => () => {
    const ws = this.clients.get(socketId);

    if (ws) {
      if (!ws.isAlive) {
        clearInterval(ws.interval);
        return ws.terminate();
      }

      ws.isAlive = false;
      this.sendMessage(socketId, { type: 'PING' });
    }
  };

  private onClose = (socketId: string) => () => {
    const ws = this.clients.get(socketId);
    if (ws) {
      clearInterval(ws.interval);
    }
    this.removeClient(socketId);
  };

  private onPing = (socketId: string) => () => {
    const ws = this.clients.get(socketId);
    if (ws) {
      ws.pong();
    }
  };

  private onPong = (socketId: string) => () => {
    const ws = this.clients.get(socketId);
    if (ws) {
      ws.isAlive = true;
    }
  };

  private onUnexpectedResponse = (socketId: string) => () => {
    const ws = this.clients.get(socketId);
    if (ws) {
      this.onClose(socketId)();
    }
    this.removeClient(socketId);
  };

  private removeClient = (socketId: string) => () => {
    this.clients.delete(socketId);
  };

  private onError = (socketId: string) => (error: Error) => {
    logger.error(`Socket ${socketId} error: ${error.message}`);
  };

  private validateIncomingMessages = (
    onMessage: typeof this.onMessage,
    socketId: string,
  ) => {
    return async (data: Buffer) => {
      try {
        const message = await incomingMessageSchema.parseAsync(
          JSON.parse(data.toString()),
        );
        return onMessage(message, socketId);
      } catch {
        this.sendMessage(socketId, {
          type: 'RESPONSE',
          error: 'Invalid message',
        });
        this.onClose(socketId)();
      }
    };
  };

  private onMessage = async (
    message: z.infer<typeof incomingMessageSchema>,
    socketId: string,
  ) => {
    const ws = this.clients.get(socketId);
    if (!ws) {
      return;
    }
    switch (message.type) {
      case 'PONG':
        this.onPong(socketId)();
        break;
      case 'MESSAGE':
        await this.publisher.publish('realtime', JSON.stringify(message));
        break;
      case 'AUTH':
        try {
          verifyToken(message.data.token);
          this.sendMessage(socketId, {
            type: 'RESPONSE',
            data: {
              status: 'authenticated',
            },
          });
        } catch {
          this.sendMessage(socketId, {
            type: 'RESPONSE',
            error: 'Invalid token',
          });
          this.onClose(socketId)();
        }
        break;
      default:
        return;
    }
  };

  private sendMessage = (socketId: string, message: object) => {
    const ws = this.clients.get(socketId);
    if (ws) {
      ws.send(JSON.stringify(message));
    }
  };

  private onReceivedMessage = (message: string) => {
    this.clients.forEach((client) => {
      client.send(message);
    });
  };
}
