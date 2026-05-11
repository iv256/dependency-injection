/**
 * lazyPromise.js
 *
 * This module defines a `lazyPromise` factory function.
 *
 * A lazy promise is a wrapper around a promise-producing function (the factory),
 * which delays execution until the first interaction: `.then()`, `.catch()`, or `.finally()`.
 * This mechanism is useful for managing deferred dependencies, triggering async workflows only when needed,
 * and building lazy execution graphs in modular systems.
 *
 * The returned object mimics the behavior of a native Promise and supports chaining.
 * Additional properties are included to support compatibility with `Promise.all`, coercion,
 * and manual access to the internal promise.
 *
 * --------------------------------------------------
 * Factory function format:
 *   (resolve, reject) => { ... }
 *   - `resolve(value)` resolves the promise with a given value.
 *   - `reject(error)` rejects the promise with a given error.
 *
 * Example usage:
 *
 *   import { lazyPromise } from './lazy.promise.js';
 *
 *   const lazy = lazyPromise((resolve, reject) => {
 *     console.log('Lazy execution begins...');
 *     setTimeout(() => resolve('Result'), 1000);
 *   });
 *
 *   // No execution until .then() is called:
 *   lazy.then(value => {
 *     console.log(value); // Logs 'Result' after 1 second
 *   });
 */

export default function lazyPromise(factory) {
    let promise = null;
  
    if (typeof factory !== 'function') {
        throw new TypeError('lazyPromise() expects a function (factory) as its argument');
    }

    // Triggers execution of the factory only once
    const execute = () => {
      if (!promise) {
        promise = new Promise(factory);
      }
      return promise;
    };
  
    return {
      then: (...args) => execute().then(...args),
      catch: (...args) => execute().catch(...args),
      finally: (...args) => execute().finally(...args),
  
      // Allows the object to behave like a native Promise in string context
      [Symbol.toStringTag]: 'Lazy Promise',
  
      // Ensures conversion into a Promise-like object
      [Symbol.toPrimitive](hint) {
        return '[object Lazy Promise]';
      },
  
      // Explicit access to the underlying promise
      asPromise: () => execute()
    };
  }
  