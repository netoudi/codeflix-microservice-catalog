import { CodeflixMicroserviceCatalogApplication } from '../..';
import { Client, givenHttpServerConfig } from '@loopback/testlab';
import supertest from 'supertest';
import config from '../../config';

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
  });

  await app.boot();
  await app.start();

  const client = supertest('http://127.0.0.1:9000');

  return { app, client };
}

export interface AppWithClient {
  app: CodeflixMicroserviceCatalogApplication;
  client: Client;
}
