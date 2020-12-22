import { bind, BindingScope, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { rabbitmqSubscribe } from '../decorators';
import { CategoryRepository } from '../repositories';
import { ResultMetadata } from '../servers';
import { BaseModelSyncService } from './base-model-sync.service';
import { ValidatorService } from './validator.service';

@bind({ scope: BindingScope.SINGLETON })
export class CategorySyncService extends BaseModelSyncService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @service(ValidatorService)
    private validator: ValidatorService,
  ) {
    super(validator);
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
