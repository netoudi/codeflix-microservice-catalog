import { Entity } from '@loopback/repository/src/model';
import { DefaultCrudRepository } from '@loopback/repository';
import { Client, RequestParams } from 'es6';

export class BaseRepository<
  T extends Entity,
  ID,
  Relations extends object = {}
> extends DefaultCrudRepository<T, ID, Relations> {
  async attachRelation(id: ID, relationName: string, data: object[]) {
    const document: RequestParams.UpdateByQuery = {
      index: this.dataSource.settings.index,
      refresh: true,
      body: {
        query: {
          term: {
            _id: id,
          },
        },
        script: {
          source: `
            if ( !ctx._source.containsKey('${relationName}') ) {
              ctx._source['${relationName}'] = [];
            }
  
            for ( item in params['${relationName}'] ) {
              if ( ctx._source['${relationName}'].find(i -> i.id == item.id) == null ) {
                ctx._source['${relationName}'].add(item);
              }
            }
          `,
          params: {
            [relationName]: data,
          },
        },
      },
    };

    const db: Client = this.dataSource.connector?.db;

    await db.update_by_query(document);
  }
}
