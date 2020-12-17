import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { rabbitmqSubscribe } from '../decorators';
import { CategoryRepository } from '../repositories';
import { ResultMetadata } from '../servers';
import { BaseModelSyncService } from './base-model-sync.service';

@bind({ scope: BindingScope.SINGLETON })
export class CategorySyncService extends BaseModelSyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
  ) {
    super();
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-category',
    routingKey: 'model.category.*',
  })
  async handle({ data, message }: ResultMetadata) {
    await this.sync({
      repository: this.categoryRepository,
      data,
      message,
    });
  }
}
