import {
  DefaultCrudRepository,
  EntityNotFoundError,
} from '@loopback/repository';
import { Message } from 'amqplib';
import { pick } from 'lodash';
import { ValidatorService } from './validator.service';

export interface SyncOptions {
  repository: DefaultCrudRepository<any, any>;
  data: any;
  message: Message;
}

export interface SyncRelationOptions {
  id: string;
  relationName: string;
  relationIds: string[];
  relationRepository: DefaultCrudRepository<any, any>;
  repository: DefaultCrudRepository<any, any>;
  message: Message;
}

export abstract class BaseModelSyncService {
  protected constructor(public validatorService: ValidatorService) {}

  async sync({ repository, data, message }: SyncOptions) {
    const { id } = data || {};
    const action = this.getAction(message);
    const entity = this.createEntity(data, repository); // get fields from entity

    switch (action) {
      case 'created':
        await this.validatorService.validate({
          data: entity,
          entityClass: repository.entityClass,
        });
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

    await this.validatorService.validate({
      data: entity,
      entityClass: repository.entityClass,
      ...(exists && { options: { partial: true } }),
    });

    return exists
      ? repository.updateById(id, entity)
      : repository.create(entity);
  }

  async syncRelation({
    id,
    relationName,
    relationIds,
    relationRepository,
    repository,
  }: SyncRelationOptions) {
    const relationFields = this.getRelationFields(repository, relationName);

    const collection = await relationRepository.find({
      where: {
        or: relationIds.map((relationId) => ({ id: relationId })),
      },
      fields: relationFields,
    });

    if (!collection.length) {
      const error = new EntityNotFoundError(
        relationRepository.entityClass,
        relationIds,
      );
      error.name = 'EntityNotFound';
      throw error;
    }

    // await repository.updateById(id, { [relationName]: collection });
    await (repository as any).attachCategories(id, collection);

    console.dir({ relationFields, collection }, { depth: 8 });
  }

  protected getRelationFields(
    repository: DefaultCrudRepository<any, any>,
    relationName: string,
  ) {
    return Object.keys(
      repository.modelClass.definition.properties[relationName].jsonSchema.items
        .properties,
    ).reduce((obj: any, field: string) => {
      obj[field] = true;
      return obj;
    }, {});
  }
}
