import { Context } from '@loopback/context';
import { Server } from '@loopback/core';
import { Channel, connect, Connection, Replies } from 'amqplib';
import AssertQueue = Replies.AssertQueue;
import AssertExchange = Replies.AssertExchange;
import { repository } from '@loopback/repository';
import { CategoryRepository } from '../repositories';
import { Category } from '../models';

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  conn: Connection;

  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {
    super();
  }

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

      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);

      this.sync({ model, event, data });
    });
  }

  async sync({
    model,
    event,
    data,
  }: {
    model: string;
    event: string;
    data: Category;
  }) {
    if (model === 'category') {
      switch (event) {
        case 'created':
          await this.categoryRepository.create(data);
          break;
      }
    }
  }

  async stop(): Promise<void> {
    await this.conn.close();

    this._listening = false;
  }

  get listening(): boolean {
    return this._listening;
  }
}
