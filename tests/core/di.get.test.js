import { describe, it, expect } from 'vitest';

import { createContainer } from '../../src/index.js';

describe('di.get()', () => {

  it('returns lazy thenable for defined dependency', async () => {
    const di = createContainer();

    di.define('value', () => {
      return 42;
    });

    const result = await di.get('value');

    expect(result).toBe(42);
  });

  it('does not execute factory before awaiting dependency', async () => {
    const di = createContainer();

    let isFactoryExecuted = false;

    di.define('service', () => {
      isFactoryExecuted = true;

      return {
        ok: true
      };
    });

    const lazyInstance = di.get('service');

    expect(isFactoryExecuted).toBe(false);

    await lazyInstance;

    expect(isFactoryExecuted).toBe(true);
  });

  it('returns thenable object', () => {
    const di = createContainer();

    di.define('value', () => 42);

    const result = di.get('value');

    expect(typeof result.then).toBe('function');
  });

  it('rejects when dependency does not exist', async () => {
    const di = createContainer();

    await expect(
      di.get('missing.service')
    ).rejects.toThrow(
      'Dependency key "missing.service" is not defined.'
    );
  });

  it('returns same resolved instance for multiple get() calls', async () => {
    const di = createContainer();

    const instance = {
      value: 42
    };

    di.define('service', () => {
      return instance;
    });

    const result1 = await di.get('service');
    const result2 = await di.get('service');

    expect(result1).toBe(result2);
  });

  it('executes factory only once', async () => {
    const di = createContainer();

    let executionCount = 0;

    di.define('service', () => {
      executionCount += 1;

      return {
        ok: true
      };
    });

    await di.get('service');
    await di.get('service');
    await di.get('service');

    expect(executionCount).toBe(1);
  });

  it('supports async factory resolution', async () => {
    const di = createContainer();

    di.define('async.service', async () => {
      return 123;
    });

    const result = await di.get('async.service');

    expect(result).toBe(123);
  });

});