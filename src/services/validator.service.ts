import { bind, BindingScope } from '@loopback/core';
import { model, repository } from '@loopback/repository';
import { CategoryRepository } from '../repositories';
import { getModelSchemaRef } from '@loopback/openapi-v3';
import { AjvFactory, RestBindings, validateRequestBody } from '@loopback/rest';
import { inject } from '@loopback/context';

interface ValidatorOptions<T> {
  data: object;
  entityClass: Function & { prototype: T };
}

@bind({ scope: BindingScope.SINGLETON })
export class ValidatorService {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @inject(RestBindings.AJV_FACTORY)
    private ajvFactory: AjvFactory,
  ) {}

  async validate<T extends object>({
    data,
    entityClass,
  }: ValidatorOptions<T>): Promise<boolean> {
    const modelSchema = getModelSchemaRef(entityClass);
    const schemaRef = { $ref: modelSchema.$ref }; // WeakMap key value

    await validateRequestBody(
      { value: data, schema: schemaRef },
      { required: true, content: {} },
      modelSchema.definitions,
      { ajvFactory: this.ajvFactory },
    );

    return true;
  }
}
