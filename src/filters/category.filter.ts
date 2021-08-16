import { Filter, FilterBuilder } from '@loopback/repository';
import { clone } from 'lodash';
import { Category } from '../models';

export class CategoryFilterBuilder extends FilterBuilder<Category> {
  private dFilter: Filter<Category>;

  constructor(f?: Filter<Category>) {
    super(f);
    this.dFilter = clone(this.defaultFilter().filter);
  }

  build(): Filter<Category> {
    return this.impose(this.dFilter).filter;
  }

  private defaultFilter() {
    return this.where({
      is_active: true,
    });
  }
}
