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
      static diInject = {
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
      static diInject = {
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
      static diInject = {
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
      static diInject = {
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

  it('supports multi-argument constructor injection', async () => {
    const di = createContainerWithInjector();

    di.define('config', [], () => {
      return {
        apiUrl: '/api',
      };
    });

    di.define('logger', [], () => {
      return {
        name: 'app-logger',
      };
    });

    class Service {
      static diInject = {
        0: {
          'config': 'config',
        },
        2: {
          'logger': 'logger',
        },
      };

      constructor(params = {}, options, services = {}) {
        this.params = params;
        this.options = options;
        this.services = services;
      }
    }

    const instance = await di.createClassInstance(Service, {
      serviceId: 'main-service',
    });

    expect(instance.params.serviceId).toBe('main-service');

    expect(instance.params.config).toEqual({
      apiUrl: '/api',
    });

    expect(instance.services.logger).toEqual({
      name: 'app-logger',
    });
  });

  it('preserves existing params and injects dependency into nested path', async () => {
    const di = createContainerWithInjector();

    di.define('app.config', [], () => {
      return {
        apiUrl: '/api',
      };
    });

    class Service {
      static diInject = {
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

  it('supports deprecated diKeyMap compatibility', async () => {
    const di = createContainerWithInjector();

    di.define('config', [], () => {
      return {
        apiUrl: '/api',
      };
    });

    class LegacyService {
      static diKeyMap = {
        'config': 'config',
      };

      constructor(params = {}) {
        this.config = params.config;
      }
    }

    const instance = await di.createClassInstance(LegacyService);

    expect(instance.config).toEqual({
      apiUrl: '/api',
    });
  });

  it('throws when both diInject and deprecated diKeyMap are defined', async () => {
    const di = createContainerWithInjector();

    class Service {
      static diInject = {
        'config': 'config',
      };

      static diKeyMap = {
        'logger': 'logger',
      };
    }

    await expect(
      di.createClassInstance(Service)
    ).rejects.toThrow(
      'DependencyInjection: Class "Service" cannot define both diInject and deprecated diKeyMap.'
    );
  });

  it('throws when diInject uses mixed metadata formats', async () => {
    const di = createContainerWithInjector();

    class Service {
      static diInject = {
        'config': 'config',
        1: {
          'logger': 'logger',
        },
      };
    }

    await expect(
      di.createClassInstance(Service)
    ).rejects.toThrow(
      'DependencyInjection: Class "Service" has mixed diInject format. Use either single-argument or multi-argument injection metadata.'
    );
  });

  it('throws when constructor argument for nested injection is not an object', async () => {
    const di = createContainerWithInjector();

    di.define('logger', [], () => {
      return {
        name: 'logger',
      };
    });

    class Service {
      static diInject = {
        0: {
          'logger': 'logger',
        },
      };

      constructor(params) {
        this.params = params;
      }
    }

    await expect(
      di.createClassInstance(Service, 'not-an-object')
    ).rejects.toThrow(
      'DependencyInjection: Constructor argument 0 is not valid for nested-in-argument injection.'
    );
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

  it('throws when diInject contains invalid target path', async () => {
    const di = createContainerWithInjector();

    class Service {
      static diInject = {
        'config': 123,
      };
    }

    await expect(
      di.createClassInstance(Service)
    ).rejects.toThrow(
      'DependencyInjection: Invalid diInject entry for "config".'
    );
  });
});