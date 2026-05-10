import { describe, it, expect } from 'vitest';

import {
  createContainer,
  createCoreContainer,
  useInjector,
} from '../src/index.js';

describe('di.injector extension', () => {
  it('does not add createInstance to core container by default', () => {
    const di = createCoreContainer();

    expect(di.createInstance).toBeUndefined();
  });

  it('adds createInstance method when injector extension is applied', () => {
    const di = createCoreContainer();

    useInjector(di);

    expect(typeof di.createInstance).toBe('function');
  });

  it('adds createInstance method to public container by default', () => {
    const di = createContainer();

    expect(typeof di.createInstance).toBe('function');
  });

  it('creates instance of a simple class', async () => {
    const di = createContainer();

    class Service {
      constructor(params = {}) {
        this.name = params.name;
      }
    }

    const instance = await di.createInstance(Service, {
      name: 'test-service',
    });

    expect(instance).toBeInstanceOf(Service);
    expect(instance.name).toBe('test-service');
  });

  it('creates instance with dependency resolved from DI container', async () => {
    const di = createContainer();

    di.define('config', () => {
      return {
        apiUrl: '/api',
      };
    });

    class Service {
      static diKeyMap = {
        config: 'config',
      };

      constructor(params = {}) {
        this.config = params.config;
      }
    }

    const instance = await di.createInstance(Service);

    expect(instance).toBeInstanceOf(Service);
    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('injects dependency using different param name and DI key', async () => {
    const di = createContainer();

    di.define('app.config', () => {
      return {
        apiUrl: '/api',
      };
    });

    class Service {
      static diKeyMap = {
        'app.config': 'config',
      };

      constructor(params = {}) {
        this.config = params.config;
      }
    }

    const instance = await di.createInstance(Service);

    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

});