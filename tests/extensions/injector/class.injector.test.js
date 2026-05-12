import { describe, it, expect } from 'vitest';

import {
  createContainer,
  createCoreContainer,
  useInjector,
} from '../../../src/index.js';

function createContainerWithInjector() {
  const di = createCoreContainer();
  useInjector(di);
  return di;
}

describe('di.injector extension', () => {
  it('does not add class injector methods to core container by default', () => {
    const di = createCoreContainer();

    expect(di.createClassInstance).toBeUndefined();
    expect(di.createInstance).toBeUndefined();
  });

  it('adds createClassInstance method when injector extension is applied', () => {
    const di = createContainerWithInjector();

    useInjector(di);

    expect(typeof di.createClassInstance).toBe('function');
  });

  it('adds deprecated createInstance alias when injector extension is applied', () => {
    const di = createContainerWithInjector();

    useInjector(di);

    expect(typeof di.createInstance).toBe('function');
  });

  it('adds class injector methods to public container by default', () => {
    const di = createContainerWithInjector();

    expect(typeof di.createClassInstance).toBe('function');
    expect(typeof di.createInstance).toBe('function');
  });

  it('creates instance of a simple class', async () => {
    const di = createContainerWithInjector();

    class Service {
      constructor(params = {}) {
        this.name = params.name;
      }
    }

    const instance = await di.createClassInstance(Service, {
      name: 'test-service',
    });

    expect(instance).toBeInstanceOf(Service);
    expect(instance.name).toBe('test-service');
  });

  it('creates instance with dependency resolved from DI container', async () => {
    const di = createContainerWithInjector();

    di.define('config', [], () => {
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

    const instance = await di.createClassInstance(Service);

    expect(instance).toBeInstanceOf(Service);
    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('injects dependency using different param name and DI key', async () => {
    const di = createContainerWithInjector();

    di.define('app.config', [], () => {
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

    const instance = await di.createClassInstance(Service);

    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('injects dependency into nested params path using dot notation', async () => {
    const di = createContainerWithInjector();

    di.define('app.config', [], () => {
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

    const instance = await di.createClassInstance(Service);

    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('injects one dependency into multiple params paths', async () => {
    const di = createContainerWithInjector();

    di.define('logger', [], () => {
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

    const instance = await di.createClassInstance(Service);

    expect(instance.logger).toEqual({
      name: 'app-logger',
    });

    expect(instance.serviceLogger).toEqual({
      name: 'app-logger',
    });

    expect(instance.logger).toBe(instance.serviceLogger);
  });

  it('preserves existing params and injects dependency into nested path', async () => {
    const di = createContainerWithInjector();

    di.define('app.config', [], () => {
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

    const instance = await di.createClassInstance(Service, {
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

  it('supports deprecated createInstance alias', async () => {
    const di = createContainerWithInjector();

    class Service {
      constructor(params = {}) {
        this.name = params.name;
      }
    }

    const instance = await di.createInstance(Service, {
      name: 'legacy-service',
    });

    expect(instance).toBeInstanceOf(Service);
    expect(instance.name).toBe('legacy-service');
  });

  it('throws when diKeyMap contains invalid target path', async () => {
    const di = createContainerWithInjector();

    class Service {
      static diKeyMap = {
        'config': 123,
      };
    }

    await expect(
      di.createClassInstance(Service)
    ).rejects.toThrow(
      'DependencyInjection: Invalid diKeyMap entry for "config".'
    );
  });
});