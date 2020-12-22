import { bind, BindingScope, service } from '@loopback/core';
import { repository } from '@loopback/repository';
import { CastMemberRepository } from '../repositories';
import { rabbitmqSubscribe } from '../decorators';
import { ResultMetadata } from '../servers';
import { BaseModelSyncService } from './base-model-sync.service';
import { ValidatorService } from './validator.service';

@bind({ scope: BindingScope.SINGLETON })
export class CastMemberSyncService extends BaseModelSyncService {
  constructor(
    @repository(CastMemberRepository)
    private castMemberRepository: CastMemberRepository,
    @service(ValidatorService)
    private validator: ValidatorService,
  ) {
    super(validator);
  }

  @rabbitmqSubscribe({
    exchange: 'amq.topic',
    queue: 'microservice-catalog/sync-cast-member',
    routingKey: 'model.cast_member.*',
  })
  async handle({ data, message }: ResultMetadata) {
    await this.sync({
      repository: this.castMemberRepository,
      data,
      message,
    });
  }
}
