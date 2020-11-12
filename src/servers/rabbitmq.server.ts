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
  channel: Channel;

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
    this.channel = await this.conn.createChannel();
    const queue: AssertQueue = await this.channel.assertQueue(
      'microservice-catalog/sync-videos',
    );
    const exchange: AssertExchange = await this.channel.assertExchange(
      'amq.topic',
      'topic',
    );

    await this.channel.bindQueue(queue.queue, exchange.exchange, 'model.*.*');

    this.channel.consume(queue.queue, (message) => {
      if (!message) {
        return;
      }

      const data = JSON.parse(message.content.toString());
      const [model, event] = message.fields.routingKey.split('.').slice(1);

      this.sync({ model, event, data })
        .then(() => this.channel.ack(message))
        .catch(() => this.channel.reject(message, false));
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
