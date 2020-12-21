import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { GenreRepository } from '../repositories';
import { rabbitmqSubscribe } from '../decorators';
import { ResultMetadata } from '../servers';
import { BaseModelSyncService } from './base-model-sync.service';

@bind({ scope: BindingScope.SINGLETON })
export class GenreSyncService extends BaseModelSyncService {
  constructor(
    @repository(GenreRepository)
    private genreRepository: GenreRepository,
  ) {
    super();
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
}