import { CodeflixMicroserviceCatalogApplication } from '../..';
import {
  createRestAppClient,
  givenHttpServerConfig,
  Client,
} from '@loopback/testlab';

export async function setupApplication(): Promise<AppWithClient> {
  const restConfig = givenHttpServerConfig({
    // Customize the server configuration here.
    // Empty values (undefined, '') will be ignored by the helper.
    //
    // host: process.env.HOST,
    // port: +process.env.PORT,
  });

  const app = new CodeflixMicroserviceCatalogApplication({
    rest: restConfig,
  });

  await app.boot();
  await app.start();

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const client = createRestAppClient(app);

  return { app, client };
}

export interface AppWithClient {
  app: CodeflixMicroserviceCatalogApplication;
  client: Client;
}
