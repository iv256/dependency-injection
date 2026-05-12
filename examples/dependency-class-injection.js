import { createContainer } from '../src/index.js';
import {
  AppConfig,
  Logger,
  ApiClient,
  UserService,
  UserView,
} from './shared/index.js';

console.log('Example: class injection');

const di = createContainer();

// UserView declares its own dependency metadata
// through the static diKeyMap property.

di.define('app.config', () => {
  return AppConfig;
});

di.define('logger', () => {
  return new Logger();
});

di.define('api.client', [
  'app.config',
  'logger',
], (config, logger) => {
  return new ApiClient({
    config,
    logger,
  });
});

di.define('user.service', [
  'api.client',
], (apiClient) => {
  return new UserService({
    apiClient,
  });
});

di.define('user', [
  'user.service',
], async (userService) => {
  return userService.getUser(1);
});

// The injector reads UserView.diKeyMap,
// resolves required dependencies from the container,
// injects them into constructor params,
// and creates the class instance.
const userView = await di.createClassInstance(UserView);

console.log(userView.render());
