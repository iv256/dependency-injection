import { describe, it, expect } from 'vitest';

import {
  createCoreContainer,
} from '../../src/index.js';

describe('core define', () => {

  it('registers dependency without dependencies using strict core syntax', async () => {
    const di = createCoreContainer();

    di.define('value', [], () => {
      return 42;
    });

    const result = await di.get('value');

    expect(result).toBe(42);
  });

  it('registers dependency with normalized thenable dependencies', async () => {
    const di = createCoreContainer();

    di.define('base.value', [], () => {
      return 10;
    });

    di.define('computed.value', [
      di.get('base.value'),
    ], (baseValue) => {
      return baseValue + 5;
    });

    const result = await di.get('computed.value');

    expect(result).toBe(15);
  });

  it('does not execute factory during define()', () => {
    const di = createCoreContainer();

    let isFactoryExecuted = false;

    di.define('service', [], () => {
      isFactoryExecuted = true;

      return {
        ok: true,
      };
    });

    expect(isFactoryExecuted).toBe(false);
  });

  it('executes factory only when dependency is resolved', async () => {
    const di = createCoreContainer();

    let isFactoryExecuted = false;

    di.define('service', [], () => {
      isFactoryExecuted = true;

      return {
        ok: true,
      };
    });

    expect(isFactoryExecuted).toBe(false);

    await di.get('service');

    expect(isFactoryExecuted).toBe(true);
  });

  it('returns registered lazy promise-like object', () => {
    const di = createCoreContainer();

    const result = di.define('value', [], () => {
      return 42;
    });

    expect(typeof result.then).toBe('function');
    expect(typeof result.catch).toBe('function');
    expect(typeof result.finally).toBe('function');
  });

  it('throws when defining duplicate key', () => {
    const di = createCoreContainer();

    di.define('service', [], () => {
      return {
        ok: true,
      };
    });

    expect(() => {
      di.define('service', [], () => {
        return {
          ok: false,
        };
      });
    }).toThrow(
      'DIRegistry: Dependency key "service" is already defined.'
    );
  });

  it('throws when key is not a string', () => {
    const di = createCoreContainer();

    expect(() => {
      di.define(123, [], () => {
        return 42;
      });
    }).toThrow(
      'DependencyInjection: Dependency key must be a string.'
    );
  });

  it('throws when dependencies are not an array', () => {
    const di = createCoreContainer();

    expect(() => {
      di.define('value', () => {
        return 42;
      });
    }).toThrow(
      'DependencyInjection: Dependencies must be an array.'
    );
  });

  it('throws when factory is not a function', () => {
    const di = createCoreContainer();

    expect(() => {
      di.define('value', [], {
        invalid: true,
      });
    }).toThrow(
      'DependencyInjection: Factory must be a function.'
    );
  });

  it('throws when dependency is not a thenable object', () => {
    const di = createCoreContainer();

    expect(() => {
      di.define('computed.value', [
        'base.value',
      ], (baseValue) => {
        return baseValue + 5;
      });
    }).toThrow(
      'DependencyInjection: Core dependency must be a thenable object.'
    );
  });

  it('supports lazy thenable dependency created with di.lazy()', async () => {
    const di = createCoreContainer();

    const expectedValue = 'lazy-value';

    di.define('service', [
      di.lazy(() => {
        return expectedValue;
      }),
    ], (value) => {
      return value;
    });

    const result = await di.get('service');

    expect(result).toBe(expectedValue);
  });

  it('supports async factory result', async () => {
    const di = createCoreContainer();

    const expectedValue = 123;

    di.define('async.value', [], async () => {
      return expectedValue;
    });

    const result = await di.get('async.value');

    expect(result).toBe(expectedValue);
  });

  it('supports dependency chain registration', async () => {
    const di = createCoreContainer();

    const expectedValue = 8;

    di.define('a', [], () => {
      return 2;
    });

    di.define('b', [
      di.get('a'),
    ], (a) => {
      return a * 2;
    });

    di.define('c', [
      di.get('b'),
    ], (b) => {
      return b * 2;
    });

    const result = await di.get('c');

    expect(result).toBe(expectedValue);
  });

});
