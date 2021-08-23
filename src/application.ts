import { BootMixin } from '@loopback/boot';
import { Application, ApplicationConfig } from '@loopback/core';
import { RepositoryMixin } from '@loopback/repository';
import { RestBindings, RestComponent, RestServer } from '@loopback/rest';
import { ServiceMixin } from '@loopback/service-proxy';
import { RestExplorerBindings } from '@loopback/rest-explorer';
import { AuthenticationComponent } from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  TokenServiceBindings,
} from '@loopback/authentication-jwt';
import {
  AuthorizationComponent,
  AuthorizationDecision,
  AuthorizationTags,
} from '@loopback/authorization';
import path from 'path';
import { MySequence } from './sequence';
import { RabbitmqServer } from './servers';
import {
  EntityComponent,
  RestExplorerComponent,
  ValidatorsComponent,
} from './components';
import { ApiResourceProvider } from './providers/api-resource.provider';
import { SubscriberAuthorizationProvider } from './providers/subscriber-authorization.provider';
import { JWTService } from './services/jwt.service';

export { ApplicationConfig };

export class CodeflixMicroserviceCatalogApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(Application)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    options.rest.sequence = MySequence;

    this.component(RestComponent);

    const restServer = this.getSync<RestServer>('servers.RestServer');

    // Set up default home page
    restServer.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration here
    this.bind(RestExplorerBindings.CONFIG).to({
      path: '/explorer',
    });
    this.bind(RestBindings.SequenceActions.SEND).toProvider(
      ApiResourceProvider,
    );
    this.component(RestExplorerComponent);
    this.component(ValidatorsComponent);
    this.component(EntityComponent);
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);
    this.bind(TokenServiceBindings.TOKEN_SERVICE).toClass(JWTService);

    const bindings = this.component(AuthorizationComponent);

    this.configure(bindings.key).to({
      precedence: AuthorizationDecision.DENY,
      defaultDecision: AuthorizationDecision.DENY,
    });

    this.bind('authorizationProviders.subscriber-provider')
      .toProvider(SubscriberAuthorizationProvider)
      .tag(AuthorizationTags.AUTHORIZER);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions here
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions here
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    if (options?.rabbitmq) {
      this.server(RabbitmqServer);
    }
  }

  async boot() {
    await super.boot();

    // const genreRepository = this.getSync<GenreRepository>(
    //   'repositories.GenreRepository',
    // );

    // await genreRepository.updateCategories({
    //   id: '1-cat',
    //   name: 'Documentary UPDATE',
    //   is_active: true,
    // });

    // const validator = this.getSync<ValidatorService>(
    //   'services.ValidatorService',
    // );

    // try {
    //   await validator.validate({
    //     data: {
    //       id: ['12', '13'],
    //       // id: ['1-cat', '2-cat'],
    //     },
    //     entityClass: Category,
    //   });
    // } catch (e) {
    //   console.dir(e, { depth: 8 });
    // }

    // try {
    //   await validator.validate({
    //     data: {},
    //     entityClass: Genre,
    //   });
    // } catch (e) {
    //   console.dir(e, { depth: 8 });
    // }
  }
}
