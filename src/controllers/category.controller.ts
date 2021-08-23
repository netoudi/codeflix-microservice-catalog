import {
  Count,
  CountSchema,
  EntityNotFoundError,
  Filter,
  repository,
  Where,
} from '@loopback/repository';
import { get, getModelSchemaRef, param, response } from '@loopback/rest';
import { authenticate } from '@loopback/authentication';
import { Category } from '../models';
import { CategoryRepository } from '../repositories';
import { PaginatorSerializer } from '../utils/paginator-serializer';
import { CategoryFilterBuilder } from '../filters/category.filter';

@authenticate('jwt')
export class CategoryController {
  constructor(
    @repository(CategoryRepository)
    public categoryRepository: CategoryRepository,
  ) {}

  @get('/categories/count')
  @response(200, {
    description: 'Category model count',
    content: { 'application/json': { schema: CountSchema } },
  })
  async count(@param.where(Category) where?: Where<Category>): Promise<Count> {
    return this.categoryRepository.count(where);
  }

  @get('/categories')
  @response(200, {
    description: 'Array of Category model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Category, { includeRelations: true }),
        },
      },
    },
  })
  async find(
    @param.filter(Category) filter?: Filter<Category>,
  ): Promise<PaginatorSerializer<Category>> {
    const newFilter = new CategoryFilterBuilder({
      ...filter,
      order: ['_score DESC'],
      where: {
        ['fuzzy']: {
          query: 'DeepSkiBlue',
          fields: ['name', 'description'],
        },
      },
    }).build();

    return this.categoryRepository.paginate(newFilter);
  }

  @get('/categories/{id}')
  @response(200, {
    description: 'Category model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Category, { includeRelations: true }),
      },
    },
  })
  async findById(
    @param.path.string('id') id: string,
    @param.filter(Category, { exclude: 'where' })
    filter?: Filter<Category>,
  ): Promise<Category> {
    const newFilter = new CategoryFilterBuilder(filter).where({ id }).build();
    const obj = await this.categoryRepository.findOne(newFilter);

    console.dir(
      new CategoryFilterBuilder({
        where: {
          'categories.name': 'x',
        },
      }).build(),
      {
        depth: 8,
      },
    );

    console.dir(newFilter, { depth: 8 });

    if (!obj) {
      throw new EntityNotFoundError(Category, id);
    }
    return obj;
  }
}
