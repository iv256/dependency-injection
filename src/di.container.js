/**
 * DI Container Module
 *
 * This module defines the main DIContainer class.
 *
 * DIContainer is the main public API of the dependency injection library.
 *
 * The library implements a lazy promise-based dependency graph.
 *
 * A developer registers a named lazy resolvable unit with its dependencies using `di.define(...)`.
 * So, each key described lazy resolvable unit is associated with:
 * - a list of lazy dependencies;
 * - a factory function that will be executed after all dependencies
 *   are resolved.
 * All this data are stored internally in a registry-based key-value storage.
 *
 * Based on a lazy-evaluation principle, dependencies are not resolved immediately.
 * Instead, the container returns lazy resolution handles through `di.get(key)`,
 * and actual dependency resolution starts only after the returned lazy
 * handle is activated with `.then(...)`.
 *
 * This allows the container to build lazy dependency chains where resolving
 * one unit may automatically trigger resolution of other dependent units.
 *
 * It allows a developer to register named lazy units of work and resolve them
 * later only when their result is actually needed.
 *
 * Basic usage:
 * 
 *   di.define('config', () => {
 *     return loadConfig();
 *   });
 *
 *   di.define('api.client', ['config'], (config) => {
 *     return createApiClient(config);
 *   });
 *
 *   di.get('api.client').then((apiClient) => {
 *     // Use resolved apiClient here.
 *   });
 *
 * Why this is useful:
 *
 * - dependencies are described in one place;
 * - dependent units are resolved automatically;
 * - independent dependencies may be resolved in parallel;
 * - execution remains lazy until `.then(...)` is called;
 * - named units can be reused through registry keys;
 * - dependency chains may trigger automatically through lazy resolution.
 *
 * Usage lifecycle:
 * 
 *   di.define(key, deps, factory)
 *       ↓
 *   creates a lazy resolvable unit
 *       ↓
 *   stores this unit in DIRegistry under the given key
 *
 *   di.get(key)
 *       ↓
 *   returns a lazy resolution handle
 *       ↓
 *   .then(...) activates this handle
 *       ↓
 *   the container looks up the registered unit
 *       ↓
 *   the unit resolves its dependencies
 *       ↓
 *   the unit executes its factory
 *       ↓
 *   the resolved result is returned to the user
 *
 * Dependency input requirements in the current version:
 *
 * - a dependency can be a string key of another registered unit;
 * - a dependency can be a lazy thenable created with `di.lazy(...)`;
 * - native Promise values are not accepted as dependencies;
 * - plain functions are not accepted as dependencies;
 * - all dependencies must remain lazy until the resolution phase.
 *
 * Low-level key-value storage is delegated to DIRegistry.
 * Lazy thenable creation is delegated to the lazy promise primitive.
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
      throw new TypeError('define() expects (key, deps[], factory) or (key, factory)');
    }
    // Define factory result as a lazy promise and store it in registry
    const lazyResult = this.createLazyResolvableUnit(deps, factory);
    return this.registry.set(key, lazyResult);
  }

  createLazyResolvableUnit(deps, factory) {
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