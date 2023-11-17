import { WebSocket, WebSocketServer } from 'ws';
import z from 'zod';
import { IncomingMessage } from 'http';

import { RedisClientType } from '..';

const messageSchema = z.object({
  type: z.union([
    z.literal('RESPONSE'),
    z.literal('LISTEN'),
    z.literal('MESSAGE'),
    z.literal('PING'),
    z.literal('PONG'),
  ]),
});

export class RealtimeRepository {
  private readonly publisher: RedisClientType;
  private readonly subscriber: RedisClientType;
  constructor(
    private readonly wss: WebSocketServer,
    private readonly redisClient: RedisClientType,
  ) {
    this.publisher = redisClient.duplicate();
    this.subscriber = redisClient.duplicate();

    wss.on('connection', this.onConnection);
  }

  onConnection = (ws: WebSocket, req: IncomingMessage) => {
    ws.on('message', this.onMessage(ws));
  };

  onMessage = (ws: WebSocket) => async (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      const { type } = await messageSchema.parseAsync(message);
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
}
