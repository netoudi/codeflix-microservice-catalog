import { Client, expect } from '@loopback/testlab';
import { CodeflixMicroserviceCatalogApplication } from '../..';
import { clearDb, setupApplication } from './test-helper';

describe('Categories', () => {
  let app: CodeflixMicroserviceCatalogApplication;
  let client: Client;

  before('setupApplication', async () => {
    ({ app, client } = await setupApplication());
  });

  beforeEach(clearDb);

  after(async () => {
    await app.stop();
  });

  it('invokes GET /categories', async () => {
    const response = await client.get('/categories').expect(200);

    expect(response.body).to.containDeep({
      results: [],
      count: 0,
    });
  });
});
