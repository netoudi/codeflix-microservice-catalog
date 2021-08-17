import { Entity, model, property } from '@loopback/repository';
import { Exclude } from 'class-transformer';

export interface SmallCategory {
  id: string;
  name: string;
  is_active: boolean;
}

@model({ settings: { strict: true } })
export class Category extends Entity {
  @property({
    type: 'string',
    id: true,
    generated: false,
    required: true,
  })
  id: string;

  @property({
    type: 'string',
    required: true,
    jsonSchema: {
      minLength: 1,
      maxLength: 255,
    },
  })
  name: string;

  @property({
    type: 'string',
    required: false,
    jsonSchema: {
      nullable: true,
    },
    default: null,
  })
  description?: string;

  @property({
    type: 'boolean',
    required: false,
    default: true,
  })
  is_active?: boolean;

  @Exclude()
  @property({
    type: 'date',
    required: true,
  })
  created_at: string;

  @Exclude()
  @property({
    type: 'date',
    required: true,
  })
  updated_at: string;

  // Define well-known properties here

  // Indexer property to allow additional data
  [prop: string]: any;

  constructor(data?: Partial<Category>) {
    super(data);
  }
}

export interface CategoryRelations {
  // describe navigational properties here
}

export type CategoryWithRelations = Category & CategoryRelations;
