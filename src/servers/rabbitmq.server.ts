import { Context, inject } from '@loopback/context';
import { Application, CoreBindings, Server } from '@loopback/core';
import { MetadataInspector } from '@loopback/metadata';
import { Channel, ConfirmChannel, Options, Replies } from 'amqplib';
import { repository } from '@loopback/repository';
import { CategoryRepository } from '../repositories';
import { Category } from '../models';
import { RabbitmqBindings } from '../keys';
import {
  AmqpConnectionManager,
  AmqpConnectionManagerOptions,
  ChannelWrapper,
  connect,
} from 'amqp-connection-manager';
import {
  RABBITMQ_SUBSCRIBE_DECORATOR,
  RabbitmqSubscribeMetadata,
} from '../decorators';
import { CategorySyncService } from '../services';
import AssertQueue = Replies.AssertQueue;
import AssertExchange = Replies.AssertExchange;

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: {
    name: string;
    type: string;
    options?: Options.AssertExchange;
  }[];
}

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;
  channel: Channel;

  constructor(
    @inject(CoreBindings.APPLICATION_INSTANCE)
    public app: Application,
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @inject(RabbitmqBindings.CONFIG)
    private config: RabbitmqConfig,
  ) {
    super(app);
    console.log(CoreBindings.APPLICATION_CONFIG);
    console.log(config);
  }

  async start(): Promise<void> {
    this._conn = connect([this.config.uri], this.config.connOptions);
    this._channelManager = this.conn.createChannel();

    this.channelManager.on('connect', () => {
      this._listening = true;
      console.log('Successfully connected a RabbitMQ channel');
    });

    this.channelManager.on('error', (err, { name }) => {
      this._listening = false;
      console.log(
        `Failed to setup a RabbitMQ channel - name: ${name} | error: ${err.message}`,
      );
    });

    await this.setupExchanges();
    this._listening = true;
    // this.boot();

    const service = this.getSync<CategorySyncService>(
      'services.CategorySyncService',
    );

    const metadata = MetadataInspector.getAllMethodMetadata<
      RabbitmqSubscribeMetadata
    >(RABBITMQ_SUBSCRIBE_DECORATOR, service);

    console.log(metadata);
  }

  private async setupExchanges() {
    return this.channelManager.addSetup(async (channel: ConfirmChannel) => {
      if (!this.config.exchanges) {
        return;
      }

      await Promise.all(
        this.config.exchanges.map((exchange) => {
          return channel.assertExchange(
            exchange.name,
            exchange.type,
            exchange.options,
          );
        }),
      );
    });
  }

  async boot(): Promise<void> {
    // @ts-ignore
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
        case 'updated':
          await this.categoryRepository.updateById(data.id, data);
          break;
        case 'deleted':
          await this.categoryRepository.deleteById(data.id);
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

  get conn(): AmqpConnectionManager {
    return this._conn;
  }

  get channelManager(): ChannelWrapper {
    return this._channelManager;
  }
}
