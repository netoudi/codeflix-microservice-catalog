import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { GenreRepository } from '../repositories';
import { rabbitmqSubscribe } from '../decorators';
import { ResultMetadata } from '../servers';

@bind({ scope: BindingScope.TRANSIENT })
export class GenreService {
  constructor(
    @repository(GenreRepository)
    private genreRepository: GenreRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-genre',
    routingKey: 'model.genre.*',
  })
  async handle({ data, message }: ResultMetadata) {
    const [event] = message.fields.routingKey.split('.').slice(2);

    switch (event) {
      case 'created':
        await this.genreRepository.create(data);
        break;
      case 'updated':
        await this.genreRepository.updateById(data.id, data);
        break;
      case 'deleted':
        await this.genreRepository.deleteById(data.id);
        break;
    }
  }
}
