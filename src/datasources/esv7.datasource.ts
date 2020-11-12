import { inject, lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { juggler } from '@loopback/repository';

const config = {
  name: 'esv7',
  connector: 'esv6',
  index: 'catalog',
  version: 7,
  // defaultSize: '',
  debug: process.env.APP_ENV === 'DEV',
  configuration: {
    node: process.env.ELASTIC_SEARCH_HOST,
    requestTimeout: Number(process.env.ELASTIC_SEARCH_REQUEST_TIMEOUT),
    pingTimeout: Number(process.env.ELASTIC_SEARCH_PING_TIMEOUT),
  },
  mappingProperties: {
    docType: {
      type: 'keyword',
    },
    id: {
      type: 'keyword',
    },
    name: {
      type: 'text', // analyzed
      fields: {
        keyword: {
          type: 'keyword',
          ignore_above: 256,
        },
      },
    },
    description: {
      type: 'text', // analyzed
    },
    is_active: {
      type: 'boolean',
    },
    created_at: {
      type: 'date',
    },
    updated_at: {
      type: 'date',
    },
  },
};

// Observe application's life cycle to disconnect the datasource when
// application is stopped. This allows the application to be shut down
// gracefully. The `stop()` method is inherited from `juggler.DataSource`.
// Learn more at https://loopback.io/doc/en/lb4/Life-cycle.html
@lifeCycleObserver('datasource')
export class Esv7DataSource extends juggler.DataSource
  implements LifeCycleObserver {
  static dataSourceName = 'esv7';
  static readonly defaultConfig = config;

  constructor(
    @inject('datasources.config.esv7', { optional: true })
    dsConfig: object = config,
  ) {
    super(dsConfig);
  }
}
