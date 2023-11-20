import { WebSocket, WebSocketServer } from 'ws';
import z from 'zod';

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
    // id: string;
  }
}

export class RealtimeRepository {
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;

  constructor(
    private readonly wss: WebSocketServer,
    redisClient: RedisClientType,
  ) {
    this.publisher = redisClient.duplicate();
    this.subscriber = redisClient.duplicate();

    wss.on('connection', this.onConnection);
  }

  onConnection = (ws: WebSocket) => {
    ws.on('message', this.validateMessage(this.onMessage, ws));
  };

  validateMessage =
    (onMessage: typeof this.onMessage, ws: WebSocket) =>
    async (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        const msg = await messageSchema.parseAsync(message);
        return onMessage(msg);
      } catch {
        ws.send(
          JSON.stringify({
            type: 'RESPONSE',
            data: {
              message: 'Invalid message',
            },
          }),
        );
        ws.close();
      }
    };

  onMessage = async (message: z.infer<typeof messageSchema>) => {
    // all the logic of the messages goes here
    await this.publisher.publish('realtime', JSON.stringify(message));
  };

  async init() {
    await this.publisher.connect();
    await this.subscriber.connect();

    this.subscriber.subscribe('realtime', (message) => {
      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  }
}
