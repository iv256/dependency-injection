import lazyPromise from '../src/core/lazy.promise.js';
import { describe, it, expect } from 'vitest';

describe('lazyPromise', () => {

    it('does not execute factory during creation', () => {

      let isFactoryExecuted = false;

      const lazy = lazyPromise((resolve) => {
        isFactoryExecuted = true;
        resolve(42);
      });

      expect(isFactoryExecuted).toBe(false);

    });


    it('executes factory on first then()', async () => {

      let isFactoryExecuted = false;

      const lazy = lazyPromise((resolve) => {
        isFactoryExecuted = true;
        resolve(42);
      });

      await lazy.then(() => {});
      expect(isFactoryExecuted).toBe(true);

    });

    it('executes factory only once', async () => {

      let countFactoryExecution = 0;

      const lazy = lazyPromise((resolve) => {
        countFactoryExecution++;
        resolve(42);
      });

      await lazy;
      await lazy;
      await lazy;

      expect(countFactoryExecution).toBe(1);

    });


    it('resolves value correctly', async () => {

      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      const value = await lazy;
      expect(value).toBe(42);

    });


    it('propagates rejection', async () => {

      const lazy = lazyPromise((resolve, reject) => {
        reject(new Error('Failure'));
      });

      await expect(lazy).rejects.toThrow('Failure');

    });


    it('supports asynchronous resolution', async () => {

      const lazy = lazyPromise((resolve) => {

        setTimeout(() => {
          resolve(42);
        }, 10);

      });

      const value = await lazy;
      expect(value).toBe(42);

    });


    it('returns native promise through asPromise()', async () => {

      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      const promise = lazy.asPromise();
      expect(promise).toBeInstanceOf(Promise);

      const value = await promise;
      expect(value).toBe(42);

    });


    it('works with Promise.all()', async () => {
      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      const result = await Promise.all([
        Promise.resolve(1),
        lazy,
        Promise.resolve(3),
      ]);

      expect(result).toEqual([1, 42, 3]);
    });


    it('can be assimilated by Promise.resolve()', async () => {
      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      const value = await Promise.resolve(lazy);
      expect(value).toBe(42);
    });


    it('provides custom toStringTag', () => {

      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      const tag = Object.prototype.toString.call(lazy);
      expect(tag).toBe('[object Lazy Promise]');

    });


    it('supports primitive string conversion', () => {

      const lazy = lazyPromise((resolve) => {
        resolve(42);
      });

      expect(String(lazy)).toBe('[object Lazy Promise]');

    });


});