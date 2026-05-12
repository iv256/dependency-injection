import { createContainer } from '../src/index.js';
import {
  AppConfig,
  Logger,
  ApiClient,
  UserService,
  UserView,
} from './shared/index.js';

console.log('Example: dependency chain');

const di = createContainer();

di.define('app.config', () => {
  console.log('Factory executed: app.config');

  return AppConfig;
});

di.define('logger', () => {
  console.log('Factory executed: logger');

  return new Logger();
});

di.define('api.client', [
  'app.config',
  'logger',
], (config, logger) => {
  console.log('Factory executed: api.client');

  return new ApiClient({
    config,
    logger,
  });
});

di.define('user.service', [
  'api.client',
], (apiClient) => {
  console.log('Factory executed: user.service');

  return new UserService({
    apiClient,
  });
});

di.define('user', [
  'user.service',
], async (userService) => {
  console.log('Factory executed: user');

  return userService.getUser(1);
});

di.define('user.view', [
  'user',
], (user) => {
  console.log('Factory executed: user.view');

  return new UserView({
    user,
  });
});

const userView = await di.get('user.view');

console.log(userView.render());
