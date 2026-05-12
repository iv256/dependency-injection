import { createContainer } from '../src/index.js';
import { AppConfig } from './shared/index.js';

console.log('Example: simple dependency');

const di = createContainer();

// Register one named dependency.
di.define('app.config', () => {
  console.log('Factory executed: app.config');

  return AppConfig;
});

// Requesting a dependency returns a lazy resolution handle.
const configHandle = di.get('app.config');

console.log('Dependency requested. Factory is not executed before await.');

// Awaiting the handle activates dependency resolution.
const config = await configHandle;

console.log('Resolved config:');
console.log(config);
