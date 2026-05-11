import { describe, it, expect } from 'vitest';

import {
  createCoreContainer,
  useDefineSyntax,
} from '../../../src/index.js';

function createContainerWithDefineSyntax() {
  const di = createCoreContainer();

  useDefineSyntax(di);

  return di;
}

describe('define syntax extension', () => {

  it('registers dependency without dependencies', async () => {
    const di = createContainerWithDefineSyntax();

    di.define('value', () => {
      return 42;
    });

    const result = await di.get('value');

    expect(result).toBe(42);
  });

  it('resolves dependency from thenable dependency item', async () => {
    const di = createContainerWithDefineSyntax();

    di.define('base.value', () => {
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
    const di = createContainerWithDefineSyntax();

    let isFactoryExecuted = false;

    di.define('service', () => {
      isFactoryExecuted = true;

      return {
        ok: true,
      };
    });

    expect(isFactoryExecuted).toBe(false);
  });

  it('returns registered lazy promise-like object', () => {
    const di = createContainerWithDefineSyntax();

    const result = di.define('value', () => {
      return 42;
    });

    expect(typeof result.then).toBe('function');
    expect(typeof result.catch).toBe('function');
    expect(typeof result.finally).toBe('function');
  });

  it('throws when defining duplicate key', () => {
    const di = createContainerWithDefineSyntax();

    di.define('service', () => {
      return {
        ok: true,
      };
    });

    expect(() => {
      di.define('service', () => {
        return {
          ok: false,
        };
      });
    }).toThrow(
      'DIRegistry: Dependency key "service" is already defined.'
    );
  });

  it('resolves dependency by string registry key', async () => {
    const di = createContainerWithDefineSyntax();

    di.define('config', () => {
      return {
        apiUrl: '/api',
      };
    });

    di.define('api.client', [
      'config',
    ], (config) => {
      return {
        url: config.apiUrl,
      };
    });

    await expect(di.get('api.client')).resolves.toEqual({
      url: '/api',
    });
  });

  it('resolves dependency from lazy thenable created with di.lazy()', async () => {
    const di = createContainerWithDefineSyntax();

    const expectedValue = 'lazy-value';

    di.define('service', [
      di.lazy(() => {
        return expectedValue;
      }),
    ], (value) => {
      return value;
    });

    await expect(di.get('service')).resolves.toBe(expectedValue);
  });

  it('resolves dependency from function dependency item', async () => {
    const di = createContainerWithDefineSyntax();

    const expectedValue = 15;

    di.define('service', [
      () => {
        return 10;
      },
    ], (value) => {
      return value + 5;
    });

    await expect(di.get('service')).resolves.toBe(expectedValue);
  });

  it('throws when key is not a string', () => {
    const di = createContainerWithDefineSyntax();

    expect(() => {
      di.define(123, () => {
        return 42;
      });
    }).toThrow(
      'DependencyInjection: Dependency key must be a string.'
    );
  });

  it('supports async factory definition', async () => {
    const di = createContainerWithDefineSyntax();

    const expectedValue = 123;

    di.define('async.value', async () => {
      return expectedValue;
    });

    const result = await di.get('async.value');

    expect(result).toBe(expectedValue);
  });

  it('supports dependency chain registration', async () => {
    const di = createContainerWithDefineSyntax();

    const expectedValue = 8;

    di.define('a', () => {
      return 2;
    });

    di.define('b', [
      'a',
    ], (a) => {
      return a * 2;
    });

    di.define('c', [
      'b',
    ], (b) => {
      return b * 2;
    });

    const result = await di.get('c');

    expect(result).toBe(expectedValue);
  });

});
