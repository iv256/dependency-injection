import { describe, it, expect } from 'vitest';

import { createContainer } from '../src/index.js';

describe('di.define()', () => {

  it('registers dependency without dependencies', async () => {
    const di = createContainer();

    di.define('value', () => {
      return 42;
    });

    const result = await di.get('value');

    expect(result).toBe(42);
  });

  it('registers dependency with dependencies array', async () => {
    const di = createContainer();

    di.define('base.value', () => {
      return 10;
    });

    di.define('computed.value', [
      di.get('base.value')
    ], (baseValue) => {
      return baseValue + 5;
    });

    const result = await di.get('computed.value');

    expect(result).toBe(15);
  });

  it('does not execute factory during define()', () => {
    const di = createContainer();

    let isFactoryExecuted = false;

    di.define('service', () => {
      isFactoryExecuted = true;

      return {
        ok: true
      };
    });

    expect(isFactoryExecuted).toBe(false);
  });

  it('returns registered lazy promise-like object', () => {
    const di = createContainer();

    const result = di.define('value', () => {
      return 42;
    });

    expect(typeof result.then).toBe('function');
    expect(typeof result.catch).toBe('function');
    expect(typeof result.finally).toBe('function');
  });

  it('throws when defining duplicate key', () => {
    const di = createContainer();

    di.define('service', () => {
      return {
        ok: true
      };
    });

    expect(() => {
      di.define('service', () => {
        return {
          ok: false
        };
      });
    }).toThrow(
      'DIRegistry: Dependency key "service" is already defined.'
    );
  });

  it('throws when key is not a string', () => {
    const di = createContainer();

    expect(() => {
      di.define(123, () => {
        return 42;
      });
    }).toThrow(
      'Dependency key must be a string'
    );
  });

  it('supports async factory definition', async () => {
    const di = createContainer();

    di.define('async.value', async () => {
      return 123;
    });

    const result = await di.get('async.value');

    expect(result).toBe(123);
  });

  it('supports dependency chain registration', async () => {
    const di = createContainer();

    di.define('a', () => {
      return 2;
    });

    di.define('b', [
      di.get('a')
    ], (a) => {
      return a * 2;
    });

    di.define('c', [
      di.get('b')
    ], (b) => {
      return b * 2;
    });

    const result = await di.get('c');

    expect(result).toBe(8);
  });

});