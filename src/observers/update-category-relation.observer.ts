import { lifeCycleObserver, LifeCycleObserver } from '@loopback/core';
import { repository } from '@loopback/repository';
import { CategoryRepository, GenreRepository } from '../repositories';

/**
 * This class will be bound to the application as a `LifeCycleObserver` during
 * `boot`
 */
@lifeCycleObserver('')
export class UpdateCategoryRelationObserver implements LifeCycleObserver {
  constructor(
    @repository(CategoryRepository)
    private categoryRepository: CategoryRepository,
    @repository(GenreRepository)
    private genreRepository: GenreRepository,
  ) {}

  /**
   * This method will be invoked when the application initializes. It will be
   * called at most once for a given application instance.
   */
  async init(): Promise<void> {
    // Add your logic for init
  }

  /**
   * This method will be invoked when the application starts.
   */
  async start(): Promise<void> {
    this.categoryRepository.modelClass.observe(
      'after save',
      async ({ where, data, isNewInstance, ...other }) => {
        if (isNewInstance) return;

        await this.genreRepository.updateCategories(data);
      },
    );
  }

  /**
   * This method will be invoked when the application stops.
   */
  async stop(): Promise<void> {
    // Add your logic for stop
  }
}
