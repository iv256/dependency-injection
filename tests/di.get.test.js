import { describe, it, expect } from 'vitest';
import { createContainer } from '../src/index.js';

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

});
