import { Genre, GenreRelations } from '../models';
import { Esv7DataSource } from '../datasources';
import { inject } from '@loopback/core';
import { Client, RequestParams } from 'es6';
import { pick } from 'lodash';
import { BaseRepository } from './base.repository';

export class GenreRepository extends BaseRepository<
  Genre,
  typeof Genre.prototype.id,
  GenreRelations
> {
  constructor(@inject('datasources.esv7') dataSource: Esv7DataSource) {
    super(Genre, dataSource);
  }

  async updateCategories(data: object) {
    const fields = Object.keys(
      this.modelClass.definition.properties['categories'].jsonSchema.items
        .properties,
    );

    const category = pick(data, fields);

    const document: RequestParams.UpdateByQuery = {
      index: this.dataSource.settings.index,
      refresh: true,
      body: {
        query: {
          bool: {
            must: [
              {
                nested: {
                  path: 'categories',
                  query: {
                    exists: {
                      field: 'categories',
                    },
                  },
                },
              },
              {
                nested: {
                  path: 'categories',
                  query: {
                    term: {
                      'categories.id': '1-cat',
                    },
                  },
                },
              },
            ],
          },
        },
        script: {
          source: `
            ctx._source['categories'].removeIf(i -> i.id == params['category']['id']);
            ctx._source['categories'].add(params['category']);
          `,
          params: {
            category: category,
          },
        },
      },
    };

    const db: Client = this.dataSource.connector?.db;

    await db.update_by_query(document);
  }
}
