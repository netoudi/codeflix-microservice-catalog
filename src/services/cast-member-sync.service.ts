import { bind, BindingScope } from '@loopback/core';
import { repository } from '@loopback/repository';
import { CastMemberRepository } from '../repositories';
import { rabbitmqSubscribe } from '../decorators';
import { ResultMetadata } from '../servers';

@bind({ scope: BindingScope.TRANSIENT })
export class CastMemberSyncService {
  constructor(
    @repository(CastMemberRepository)
    private castMemberRepository: CastMemberRepository,
  ) {}

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-cast-member',
    routingKey: 'model.cast_member.*',
  })
  async handle({ data, message }: ResultMetadata) {
    const [event] = message.fields.routingKey.split('.').slice(2);

    switch (event) {
      case 'created':
        await this.castMemberRepository.create(data);
        break;
      case 'updated':
        await this.castMemberRepository.updateById(data.id, data);
        break;
      case 'deleted':
        await this.castMemberRepository.deleteById(data.id);
        break;
    }
  }
}
