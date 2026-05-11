/**
 * DI Container Module
 *
 * This module defines the main DIContainer class.
 *
 * DIContainer is the main public API of the dependency injection library.
 *
 * The library implements a lazy promise-based dependency graph.
 *
 * A developer registers a named lazy resolvable unit with its dependencies
 * using `di.define(...)`.
 *
 * Each registered key is associated with:
 * - a list of lazy dependencies;
 * - a factory function that will be executed after all dependencies
 *   are resolved.
 * All this data is stored internally in a registry-based key-value storage.
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
 * Core dependency requirements:
 * - dependencies must already be normalized to thenable objects;
 * - syntax shortcuts are handled outside of the container core;
 * - dependency normalization is delegated to optional syntax extensions.
 *
 * Low-level key-value storage is delegated to DIRegistry.
 * Lazy thenable creation is delegated to the lazy promise primitive.
 * Class instance creation is delegated to the injector extension.
 */

import lazyPromise from './lazy.promise.js';
import { createRegistry } from './di.registry.js';


/**
 * Dependency Injection Container
 *
 * DIContainer is the main public API of the dependency injection library.
 *
 * It delegates low-level key-value storage to DIRegistry.
 * In the current version, the registry stores:
 *
 *   string key -> lazy resolvable unit
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
   * Defines a new named lazy resolvable unit in the DI container.
   *
   * Core define has a strict low-level contract:
   *
   *   di.define(key, dependencies, factory)
   *
   * Syntax shortcuts are not handled here. Public syntax extensions may wrap
   * this method and normalize flexible input before calling the core method.
   *
   * @param {string} key - Unique dependency key.
   * @param {Array<PromiseLike<any>>} dependencies - List of lazy thenable dependencies.
   * @param {Function} factory - Factory function executed after dependencies are resolved.
   * @returns {PromiseLike<any>} Registered lazy promise-like dependency value.
   */
  define(key, dependencies, factory) {
    if (typeof key !== 'string') {
      throw new TypeError('DependencyInjection: Dependency key must be a string.');
    }

    if (!Array.isArray(dependencies)) {
      throw new TypeError('DependencyInjection: Dependencies must be an array.');
    }

    if (typeof factory !== 'function') {
      throw new TypeError('DependencyInjection: Factory must be a function.');
    }

    for (const dependency of dependencies) {
      if (!dependency || typeof dependency.then !== 'function') {
        throw new TypeError('DependencyInjection: Core dependency must be a thenable object.');
      }
    }

    const lazyResult = this.#createLazyResolvableUnit(dependencies, factory);

    return this.registry.set(key, lazyResult);
  }

  /**
   * This method is used in `define()` to create a lazy resolvable unit
   * which will be stored in the registry under the given key
   * and will be resolved lazily when `di.get(key)` is called with `.then(...)`.
   * 
   * Dependencies must be already normalized to thenable objects.
   *
   * @param {Array<PromiseLike<any>>} dependencies - List of lazy thenable dependencies.
   * @param {Function} factory - Factory function to execute after dependencies are resolved.
   * @returns {PromiseLike<any>} Lazy promise-like value.
   */
  #createLazyResolvableUnit(dependencies, factory) {
    return lazyPromise((res, rej) => {
      Promise.all(dependencies)
        .then((resolvedDeps) => {
          const result = factory(...resolvedDeps);
          if (
            result &&
            typeof result.then === 'function'
          ) {
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
   * Creates a lazy promise from a factory
   *
   * @param {Function} factory - Factory function.
   * @returns {PromiseLike<any>} Lazy promise-like value.
   */
  lazy(factory) {
    return lazyPromise((res, rej) => {
      try {
        const result = factory();

        if (
          result &&
          typeof result.then === 'function'
        ) {
          result.then(res).catch(rej);
        } else {
          res(result);
        }
      } catch (error) {
        rej(error);
      }
    });
  }

}
