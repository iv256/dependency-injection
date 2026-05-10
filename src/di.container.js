/**
 * DI Container Module
 *
 * This module defines the main DIContainer class.
 *
 * DIContainer is the primary public API of the dependency injection library.
 * It coordinates dependency registration, lazy dependency access, and optional
 * DI-related helpers.
 *
 * Low-level key-value storage is delegated to DIRegistry.
 * Lazy promise creation is delegated to the DI lazy wrapper.
 * Class instance creation is delegated to the injector extension.
 */

import lazyPromise from './lazy.promise.js';
import lazy from './di.lazy.js';
import createInstance from './di.injector.js';
import { createRegistry } from './di.registry.js';


/**
 * Dependency Injection Container
 *
 * DIContainer is the main public API of the dependency injection library.
 *
 * It delegates low-level key-value storage to DIRegistry.
 * In the current version, the registry stores:
 *
 *   string key -> lazy promise
 *
 * DIContainer is responsible for:
 * - defining dependencies;
 * - getting dependencies lazily;
 * - exposing DI-specific helper methods;
 * - delegating instance creation to injector extensions.
 */
export class DIContainer {
  constructor() {
    this.registry = createRegistry();
  }

  /**
   * Defines a new dependency in the DI container.
   *
   * In the current version, `define(...)` converts dependency arguments
   * into a lazy promise and stores it in DIRegistry.
   *
   * @param {string} key - Unique dependency key.
   * @param {...*} args - Factory or dependency list and factory.
   * @returns {PromiseLike<any>} Registered lazy promise-like dependency value.
   */
  define(key, ...args) {
    // Normalize arguments into deps and factory
    let deps = null;
    let factory = null;
    if (
      args.length === 1 && typeof args[0] === 'function'
    ) {
      // It is a define(key, factory) call with no dependencies
      deps = [];
      factory = args[0];
    } else if (
      args.length === 2 &&
      Array.isArray(args[0]) && typeof args[1] === 'function'
    ) {
      // It is a define(key, deps, factory) call with list of dependencies
      deps = args[0];
      factory = args[1];
    } else {
      // Wrong arguments
      throw new TypeError('Lazy() expects (deps[], factory) or (factory)');
    }
    // Define factory result as a lazy promise and store it in registry
    const lazyResult = this.defineResolveableUnit(deps, factory);
    return this.registry.set(key, lazyResult);
  }

  defineResolveableUnit(deps, factory) {
    return lazyPromise((res, rej) => {
      Promise.all(deps)
        .then((resolvedDeps) => {
          const result = factory(...resolvedDeps);
  
          if (result instanceof Promise) {
            result.then(res).catch(rej);
          } else {
            if (result === undefined) {
              console.debug('Factory returned undefined, this may lead to unexpected behavior');
            }
            res(result);
          }
        })
        .catch(rej);
    });
  }


  /**
   * Returns a dependency from the DI container as a lazy thenable.
   *
   * The dependency is not resolved immediately.
   * Actual lookup and resolution happen only when `.then(...)` is called.
   *
   * @param {string} key - Dependency key.
   * @returns {PromiseLike<any>} Lazy thenable dependency accessor.
   */
  get(key) {
    const registry = this.registry;

    return {
      then(onFulfilled, onRejected) {
        try {
          const value = registry.get(key);
          return value.then(onFulfilled, onRejected);
        } catch (error) {
          return Promise.reject(error).then(onFulfilled, onRejected);
        }
      }
    };
  }

  /**
   * Creates a lazy promise from a factory or dependency list and factory.
   *
   * @param {...*} args - Factory or dependency list and factory.
   * @returns {PromiseLike<any>} Lazy promise-like value.
   */
  lazy(...args) {
    return lazy(...args);
  }

  /**
   * Creates an instance of a class with dependencies injected into class params.
   *
   * @param {Function} Class - Class constructor.
   * @param {Object} params - Additional constructor parameters.
   * @returns {Promise<any>} Created class instance.
   */
  createInstance(Class, params = {}) {
    return createInstance(this, Class, params);
  }
}

/**
 * Creates a new DI container instance.
 *
 * @returns {DIContainer} New DI container instance.
 */
export function createContainer() {
  return new DIContainer();
}