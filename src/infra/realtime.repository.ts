import { WebSocket, WebSocketServer } from 'ws';
import z from 'zod';
import { randomUUID } from 'crypto';

import { RedisClientType } from './modules/redis';

const messageSchema = z.object({
  type: z.union([
    z.literal('RESPONSE'),
    z.literal('LISTEN'),
    z.literal('MESSAGE'),
    z.literal('PING'),
    z.literal('PONG'),
  ]),
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

  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();

    await this.subscriber.subscribe('realtime', (message) => {
      this.clients.forEach((client) => {
        client.send(message);
      });
    });
  }

  private onConnection = (ws: WebSocket) => {
    const socketId = randomUUID();

    ws.id = socketId;
    ws.isAlive = true;
    this.clients.set(socketId, ws);

    const interval = setInterval(this.heartbeat(socketId), HEARTBEAT_INTERVAL);
    ws.interval = interval;

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
      ws.send(JSON.stringify({ type: 'PING' }));
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
    console.error(`Socket ${socketId} error: ${error.message}`);
  };

  private validateIncomingMessages = (
    onMessage: typeof this.onMessage,
    socketId: string,
  ) => {
    const ws = this.clients.get(socketId);
    return async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const msg = await messageSchema.parseAsync(message);
        return onMessage(msg, socketId);
      } catch {
        if (ws) {
          ws.send(
            JSON.stringify({
              type: 'RESPONSE',
              error: 'Invalid message',
            }),
          );
          this.onClose(socketId)();
        }
      }
    };
  };

  private onMessage = async (
    message: z.infer<typeof messageSchema>,
    socketId: string,
  ) => {
    // all the logic of the messages goes here
    if (message.type === 'MESSAGE') {
      await this.publisher.publish('realtime', JSON.stringify(message));
    } else if (message.type === 'PONG') {
      this.onPong(socketId)();
    }
  };
}
