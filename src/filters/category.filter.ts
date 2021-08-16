import { Category } from '../models';
import { DefaultFilter } from './default-filter';

export class CategoryFilterBuilder extends DefaultFilter<Category> {
  protected defaultFilter(): DefaultFilter<Category> | void {
    return this.isActive(Category);
  }
}
