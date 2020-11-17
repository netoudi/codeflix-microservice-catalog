import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { rabbitmqSubscribe } from '../decorators';
import { CategoryRepository } from '../repositories';
import { ResultMetadata } from '../servers';

@bind({ scope: BindingScope.TRANSIENT })
export class CategorySyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-category',
    routingKey: 'model.category.*',
  })
  async handle({ data, message }: ResultMetadata) {
    const [event] = message.fields.routingKey.split('.').slice(2);

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
