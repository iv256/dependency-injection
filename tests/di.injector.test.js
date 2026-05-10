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
        'config': 'config',
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


  it('injects dependency into nested params path using dot notation', async () => {
    const di = createContainer();

    di.define('app.config', () => {
      return {
        apiUrl: '/api',
      };
    });

    class Service {
      static diKeyMap = {
        'app.config': 'services.config',
      };

      constructor(params = {}) {
        this.config = params.services.config;
      }
    }

    const instance = await di.createInstance(Service);

    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('injects one dependency into multiple params paths', async () => {
    const di = createContainer();

    di.define('logger', () => {
      return {
        name: 'app-logger',
      };
    });

    class Service {
      static diKeyMap = {
        'logger': [
          'logger',
          'services.logger',
        ],
      };

      constructor(params = {}) {
        this.logger = params.logger;
        this.serviceLogger = params.services.logger;
      }
    }

    const instance = await di.createInstance(Service);

    expect(instance.logger).toEqual({
      name: 'app-logger',
    });

    expect(instance.serviceLogger).toEqual({
      name: 'app-logger',
    });

    expect(instance.logger).toBe(instance.serviceLogger);
  });


  it('preserves existing params and injects dependency into nested path', async () => {
    const di = createContainer();

    di.define('app.config', () => {
      return {
        apiUrl: '/api',
      };
    });

    class Service {
      static diKeyMap = {
        'app.config': 'services.config',
      };

      constructor(params = {}) {
        this.params = params;
      }
    }

    const instance = await di.createInstance(Service, {
      name: 'test-service',
      services: {
        existing: true,
      },
    });

    expect(instance.params.name).toBe('test-service');
    expect(instance.params.services.existing).toBe(true);
    expect(instance.params.services.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('throws when diKeyMap contains invalid target path', async () => {
    const di = createContainer();

    class Service {
      static diKeyMap = {
        'config': 123,
      };
    }

    await expect(
      di.createInstance(Service)
    ).rejects.toThrow(
      'DependencyInjection: Invalid diKeyMap entry for "config".'
    );
  });

});