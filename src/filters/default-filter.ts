import { AnyObject } from '@loopback/filter/src/types';
import {
  Filter,
  FilterBuilder,
  Where,
  WhereBuilder,
} from '@loopback/repository';
import { clone } from 'lodash';

export abstract class DefaultFilter<
  MT extends object = AnyObject,
> extends FilterBuilder<MT> {
  protected dFilter: Filter<MT>;

  constructor(f?: Filter<MT>) {
    super(f);
    const dFilter = this.defaultFilter();
    this.dFilter = dFilter
      ? clone(dFilter.filter)
      : new FilterBuilder(f).filter;
  }

  protected defaultFilter(): DefaultFilter<MT> | void {}

  isActive() {
    this.filter.where = new WhereBuilder<{ is_active: boolean }>(
      this.filter.where,
    )
      .and({ is_active: true })
      .build() as Where<MT>;

    return this;
  }

  build(): Filter<MT> {
    return this.dFilter ? this.impose(this.dFilter).filter : this.dFilter;
  }
}
