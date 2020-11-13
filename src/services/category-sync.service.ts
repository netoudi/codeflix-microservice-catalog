import { bind, BindingScope } from '@loopback/core';
import { rabbitmqSubscribe } from '../decorators';

@bind({ scope: BindingScope.TRANSIENT })
export class CategorySyncService {
  constructor(/* Add @inject to inject parameters */) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x1',
    routingKey: 'model.category.*',
  })
  handle(data: any) {
    console.log(data);
  }
}
