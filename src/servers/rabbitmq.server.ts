import { Binding, Context, inject } from '@loopback/context';
import { Application, CoreBindings, Server } from '@loopback/core';
import { MetadataInspector } from '@loopback/metadata';
import { ConfirmChannel, ConsumeMessage, Options } from 'amqplib';
import { repository } from '@loopback/repository';
import { CategoryRepository } from '../repositories';
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

export interface RabbitmqConfig {
  uri: string;
  connOptions?: AmqpConnectionManagerOptions;
  exchanges?: {
    name: string;
    type: string;
    options?: Options.AssertExchange;
  }[];
}

export type SubscribersMetadata = {
  method: Function;
  metadata: RabbitmqSubscribeMetadata;
}[];

export type ConsumeMetadata = {
  channel: ConfirmChannel;
  queue: string;
  method: Function;
};

export type ResultMetadata = {
  data: { id: string };
  message: ConsumeMessage;
  channel: ConfirmChannel;
};

export class RabbitmqServer extends Context implements Server {
  private _listening: boolean;
  private _conn: AmqpConnectionManager;
  private _channelManager: ChannelWrapper;

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
    await this.bindSubscribers();
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

  private async bindSubscribers() {
    return this.getSubscribers().map(async (item) => {
      await this.channelManager.addSetup(async (channel: ConfirmChannel) => {
        const { exchange, queue, routingKey, queueOptions } = item.metadata;

        const assertQueue = await channel.assertQueue(
          queue ?? '',
          queueOptions ?? undefined,
        );

        const routingKeys = Array.isArray(routingKey)
          ? routingKey
          : [routingKey];

        await Promise.all(
          routingKeys.map((key) =>
            channel.bindQueue(assertQueue.queue, exchange, key),
          ),
        );

        await this.consume({
          channel,
          queue: assertQueue.queue,
          method: item.method,
        });
      });
    });
  }

  private getSubscribers(): SubscribersMetadata {
    const bindings: Array<Readonly<Binding>> = this.find('services.*');

    return bindings
      .map((binding) => {
        const metadata = MetadataInspector.getAllMethodMetadata<
          RabbitmqSubscribeMetadata
        >(RABBITMQ_SUBSCRIBE_DECORATOR, binding.valueConstructor?.prototype);

        if (!metadata) return [];

        const methods = [];

        for (const methodName in metadata) {
          if (!Object.prototype.hasOwnProperty.call(metadata, methodName))
            return;

          const service = this.getSync(binding.key) as any;

          methods.push({
            method: service[methodName].bind(service),
            metadata: metadata[methodName],
          });
        }

        return methods;
      })
      .reduce((acc: any, cur: any) => {
        acc.push(...cur);
        return acc;
      }, []);
  }

  private async consume({ channel, queue, method }: ConsumeMetadata) {
    await channel.consume(queue, async (message) => {
      try {
        if (!message) throw new Error('Received null message');

        const content = message.content;

        if (content) {
          let data;

          try {
            data = JSON.parse(content.toString());
          } catch (e) {
            data = null;
          }

          await method({ data, message, channel });
          channel.ack(message);
        }
      } catch (e) {
        console.error(e);
      }
    });
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
