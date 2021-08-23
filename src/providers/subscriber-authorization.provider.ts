import { Provider, ValueOrPromise } from '@loopback/context';
import {
  AuthorizationContext,
  AuthorizationDecision,
  AuthorizationMetadata,
  Authorizer,
} from '@loopback/authorization';

export class SubscriberAuthorizationProvider implements Provider<Authorizer> {
  constructor() {}

  value(): ValueOrPromise<Authorizer> {
    return this.authorize.bind(this);
  }

  async authorize(
    authorizationCtx: AuthorizationContext,
    metadata: AuthorizationMetadata,
  ) {
    // TODO: expiração da assinatura - role catalog-admin não tem que verificar a expiração somente a role subscriber
    const allowedRoles = metadata.allowedRoles; // roles definidas no controller subscriber
    const userRoles = authorizationCtx.principals[0].roles; // roles do usuário

    return allowedRoles?.find((r) => userRoles.includes(r))
      ? AuthorizationDecision.ALLOW
      : AuthorizationDecision.DENY;
  }
}
