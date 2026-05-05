import di from '../../src/index.js';

console.log('Example of basic usage:');

// simple dependency
di.define('config', [], () => {
  return { apiUrl: '/api' };
});

// nested dependency
di.define('client', [
  di.get('config'),
], (config) => {
  return {
    getUrl() {
      return config.apiUrl;
    }
  };
});


const config = await di.get('config');
console.log('Simple dependency: Config:', config);

const client = await di.get('client');
console.log('Nested dependency: Client URL:', client.getUrl());
