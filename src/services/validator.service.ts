import { bind, BindingScope } from '@loopback/core';
import { getModelSchemaRef } from '@loopback/openapi-v3';
import { AjvFactory, RestBindings, validateRequestBody } from '@loopback/rest';
import { inject } from '@loopback/context';

interface ValidatorOptions<T> {
  data: object;
  entityClass: Function & { prototype: T };
}

@bind({ scope: BindingScope.SINGLETON })
export class ValidatorService {
  private cache = new Map();

  constructor(
    @inject(RestBindings.AJV_FACTORY)
    private ajvFactory: AjvFactory,
  ) {}

  async validate<T extends object>({ data, entityClass }: ValidatorOptions<T>) {
    const modelSchema = getModelSchemaRef(entityClass);

    if (!modelSchema) {
      const error = new Error('The parameter entityClass is not a entity');
      error.name = 'NotEntityClass';
      throw error;
    }

    const schemaRef = { $ref: modelSchema.$ref }; // WeakMap key value
    const schemaName = Object.keys(modelSchema.definitions)[0];

    if (!this.cache.has(schemaName)) {
      this.cache.set(schemaName, modelSchema.definitions[schemaName]);
    }

    const globalSchemas = Array.from(this.cache).reduce<any>(
      (obj, [key, value]) => {
        obj[key] = value;
        return obj;
      },
      {},
    );

    console.dir(globalSchemas, { depth: 8 });

    await validateRequestBody(
      { value: data, schema: schemaRef },
      { required: true, content: {} },
      globalSchemas,
      { ajvFactory: this.ajvFactory },
    );
  }
}