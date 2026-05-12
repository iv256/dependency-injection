import { createContainer } from '../src/index.js';
import {
  AppConfig,
  Logger,
  ApiClient,
} from './shared/index.js';

console.log('Example: dependency list');

const di = createContainer();

di.define('app.config', () => {
  console.log('Factory executed: app.config');

  return AppConfig;
});

di.define('logger', () => {
  console.log('Factory executed: logger');

  return new Logger();
});

// ApiClient depends on a list of dependencies: app.config and logger.
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

const apiClient = await di.get('api.client');

console.log('Resolved api client:');
console.log(apiClient);
