import { CodeflixMicroserviceCatalogApplication } from '../..';
import { Client, givenHttpServerConfig } from '@loopback/testlab';
import supertest from 'supertest';
import config from '../../config';
import { config as dbConfig, Esv7DataSource } from '../../datasources';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
    port: 9000,
  });

  const app = new CodeflixMicroserviceCatalogApplication({
    ...config,
    rest: restConfig,
    rabbitmq: null,
  });

  await app.boot();
  app.bind('datasources.esv7').to(testDb);
  await app.start();

  const client = supertest('http://127.0.0.1:9000');

  return { app, client };
}

export const testDb = new Esv7DataSource({
  ...dbConfig,
  index: 'catalog-test',
});

export async function clearDb() {
  await testDb.deleteAllDocuments();
}

export interface AppWithClient {
  app: CodeflixMicroserviceCatalogApplication;
  client: Client;
}
