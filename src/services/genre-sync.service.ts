import { bind, BindingScope, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { CategoryRepository, GenreRepository } from '../repositories';
import { rabbitmqSubscribe } from '../decorators';
import { ResultMetadata } from '../servers';
import { BaseModelSyncService } from './base-model-sync.service';
import { ValidatorService } from './validator.service';

@bind({ scope: BindingScope.SINGLETON })
export class GenreSyncService extends BaseModelSyncService {
  constructor(
    @repository(GenreRepository)
    private genreRepository: GenreRepository,
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @service(ValidatorService)
    private validator: ValidatorService,
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-genre',
    routingKey: 'model.genre.*',
  })
  async handle({ data, message }: ResultMetadata) {
    await this.sync({
      repository: this.genreRepository,
      data,
      message,
    });
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-genre',
    routingKey: 'model.genre_categories.*',
  })
  async handleCategories({ data, message }: ResultMetadata) {
    await this.syncRelation({
      id: data.id,
      relationName: 'categories',
      relationIds: data.relation_ids,
      relationRepository: this.categoryRepository,
      repository: this.genreRepository,
      message,
    });
  }
}
