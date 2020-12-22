import { Binding, Component } from '@loopback/core';

export class ValidatorsComponent implements Component {
  bindings: Array<Binding> = [];

  constructor() {
    this.bindings = this.validators();
  }

  validators() {
    return [Binding.bind('ajv.keywords.exists')];
  }
}
