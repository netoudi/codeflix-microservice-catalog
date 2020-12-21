import { CodeflixMicroserviceCatalogApplication } from '../application';
import chalk from 'chalk';
import { Client } from 'es7';
import { Esv7DataSource } from '../datasources';
import config from '../config';

export class FixturesCommand {
  static command = 'fixtures';
  static description = 'Fixtures data in ElasticSearch';

  private app: CodeflixMicroserviceCatalogApplication;

  async run() {
    console.log(chalk.green('Fixture data'));
    await this.bootApp();
    console.log(chalk.green('Delete all documents'));
    await this.deleteAllDocuments();
  }

  private async bootApp() {
    this.app = new CodeflixMicroserviceCatalogApplication(config);
    await this.app.boot();
  }

  private async deleteAllDocuments() {
    const datasource: Esv7DataSource = this.app.getSync<Esv7DataSource>(
      'datasources.esv7',
    );
    // @ts-ignore
    const index = datasource.adapter.settings.index;
    // @ts-ignore
    const client: Client = datasource.adapter.db;

    await client.delete_by_query({
      index,
      body: {
        query: { match_all: {} },
      },
    });
  }
}
