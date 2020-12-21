import { DefaultCrudRepository } from '@loopback/repository';
import { Message } from 'amqplib';
import { pick } from 'lodash';

export interface SyncOptions {
  repository: DefaultCrudRepository<any, any>;
  data: any;
  message: Message;
}

export abstract class BaseModelSyncService {
  async sync({ repository, data, message }: SyncOptions) {
    const { id } = data || {};
    const action = this.getAction(message);
    const entity = this.createEntity(data, repository); // get fields from entity

    switch (action) {
      case 'created':
        await repository.create(entity);
        break;
      case 'updated':
        await this.updateOrCreate({ repository, id, entity });
        break;
      case 'deleted':
        await repository.deleteById(id);
        break;
    }
  }

  protected getAction(message: Message) {
    return message.fields.routingKey.split('.')[2];
  }

  protected createEntity(
    data: any,
    repository: DefaultCrudRepository<any, any>,
  ) {
    return pick(
      data,
      Object.keys(repository.entityClass.definition.properties),
    );
  }

  protected async updateOrCreate({
    repository,
    id,
    entity,
  }: {
    repository: DefaultCrudRepository<any, any>;
    id: string;
    entity: any;
  }) {
    const exists = await repository.exists(id);

    return exists
      ? repository.updateById(id, entity)
      : repository.create(entity);
  }
}