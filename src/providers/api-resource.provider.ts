import { Provider, ValueOrPromise } from '@loopback/context';
import {
  OperationRetval,
  RequestContext,
  Response,
  Send,
} from '@loopback/rest';
import { inject } from '@loopback/core';
import { PaginatorSerializer } from '../utils/paginator-serializer';

export class ApiResourceProvider implements Provider<Send> {
  constructor(@inject.context() public request: RequestContext) {}

  value(): ValueOrPromise<Send> {
    return (response: Response, result: OperationRetval) => {
      if (result) {
        response.json(
          result instanceof PaginatorSerializer
            ? result.toJson(this.request)
            : result,
        );
      }
      response.end();
    };
  }
}
