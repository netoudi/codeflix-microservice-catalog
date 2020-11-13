import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { rabbitmqSubscribe } from '../decorators';
import { CategoryRepository } from '../repositories';

@bind({ scope: BindingScope.TRANSIENT })
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x1',
    routingKey: 'model.category.*',
  })
  handle(data: any) {
    console.log(data);
    console.log(this.categoryRepository.entityClass, 'handle');
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'x2',
    routingKey: 'model.category1.*',
  })
  handle1(data: any) {
    console.log(data);
    console.log(this.categoryRepository.entityClass, 'handle1');
  }
}
