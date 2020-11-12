import { Context } from '@loopback/context';
import { Server } from '@loopback/core';
import { Channel, connect, Connection, Replies } from 'amqplib';
import AssertQueue = Replies.AssertQueue;
import AssertExchange = Replies.AssertExchange;

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;

  async start(): Promise<void> {
    this.conn = await connect({
      hostname: 'rabbitmq',
      username: 'admin',
      password: 'admin',
    });

    this._listening = true;
    this.boot();
  }

  async boot(): Promise<void> {
    const channel: Channel = await this.conn.createChannel();
    const queue: AssertQueue = await channel.assertQueue(
      'microservice-catalog/sync-videos',
    );
    const exchange: AssertExchange = await channel.assertExchange(
      'amq.topic',
      'topic',
    );

    await channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    channel.consume(queue.queue, (message) => {
      if (!message) {
        return;
      }

      const [model, event] = message.fields.routingKey.split('.').slice(1);

      console.log(JSON.parse(message.content.toString()));
      console.log(model, event);
    });
  }

  async stop(): Promise<void> {
    await this.conn.close();

    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }
}
