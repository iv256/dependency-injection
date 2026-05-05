// lib/dependency-injection/di.container.js

import lazy from './di.lazy.js';
import createInstance from './di.injector.js';


/**
 * Dependency Injection Container
 */
export class DIContainer {


  constructor() {

    // Internal storage for all registered dependencies
    this._container = Object.create(null);

    // Proxy interface with validation and immutability
    this.container = new Proxy(this._container, {

      get(target, key) {
        if (typeof key !== 'string') {
          throw new Error(`Invalid dependency key type: "${String(key)}". Dependency key must be a string.`);
        }
        if (!(key in target)) {
          throw new Error(`Dependency key "${key}" is not defined in the DI container`);
        }
        return target[key]; // Return promise without resolving
      },

      set(target, key, value) {
        if (typeof key !== 'string') {
          throw new Error(`Invalid dependency key type: "${String(key)}". Dependency key must be a string.`);
        }
        if (key in target) {
          throw new Error(`Dependency key "${key}" is already defined`);
        }
        target[key] = value;
        return true;
      }

    });

  }


  /**
   * Defines a new dependency in the DI container.
   *
   * ---
   * Usage Variant 1: Define without dependencies by providing only a factory.
   *
   * @param {string} key - Unique dependency name.
   * @param {Function} factory - Async or sync factory with no arguments.
   * @returns {Promise<any>} - A LazyPromise resolving to the defined value.
   * 
   * @example
   * di.define('logger', async () => new Logger());
   *
   * ---
   * Usage Variant 2: Define with dependencies; the factory will be called with
   * resolved dependencies passed as arguments.
   *
   * @param {string} key - Unique dependency name.
   * @param {Array<Promise|any>} deps - Dependencies (lazy promises or plain values).
   * dependency can be passed via a following ways:
   * - `di.ref(key)` — is a reference to another dependency in container.
   * - `di.value(value)` — inject a value or any object
   * - `di.lazy(fn)` — lazy execution of fn function and use its returned result as a resolved dependency
   * - `di.all([...])` — resolve multiple dependencies
   * - `di.some([...])` — resolve one of these dependencies
   * - ... and any other custom dependency expression (as long as it resolves to a promise or value)
   * Note:
   * If a dependency is a string, it will be treated as a key to another dependency in the container
   * (e.g. the dependency 'connection' is equal to di.ref('connection') and should be resolved as di.get('connection')).
   * If a dependency is a plain value (not a promise), it will be treated as a resolved value and passed directly to the factory.
   * @param {Function} factory - Async or sync factory with args matching deps.
   * This factory will be called after all dependencies are resolved and passed in it as arguments in the same order as they are defined in deps.
   * @param {Object} [options] - Optional configuration for the dependency.
   * @param {string} [options.lifecycle] - Lifecycle of the dependency ('singleton' or 'transient').
   * If 'singleton' (default), the resolved value will be cached and returned for all subsequent requests.
   * If 'transient', a new value will be created each time the dependency is resolved.
   * @returns {Promise<any>} - A LazyPromise resolving to the defined value.
   * This promise will resolve after all dependencies are resolved and the factory is executed.
   *
   * @example
   * di.define('service', [
   *   'repository',
   *   di.ref('httpClient'),
   *   di.lazy(fnLoadInitialData),
   * ], (repository, httpClient, initialData) => {
   *   return new Service(repository, httpClient, initialData)
   * }, { lifecycle: 'singleton' })
  */
  define(key, ...args) {
    this.container[key] = lazy(...args);
    return this.container[key];
  }


  /**
   * Returns a dependency from the DI container as a lazy promise.
   * 
   * It does not resolve the dependency immediately
   * Dependency will only be resolved on demand when `.then(...)` is called on the returned object.
   * This allows for lazy and dynamic resolution of dependencies, even if they are not defined at the time of the call.
   * The returned object is a thenable that defers to the actual dependency when `.then(...)` is invoked.
   * It looks up the dependency in the container and executes `.then(...)` on it, allowing for dynamic and flexible dependency management.
   *
   * This allows for:
   * - Dynamic and cyclic dependency resolution.
   * - Full laziness: no resolution or validation occurs until needed.
   *
   * This function supports **runtime resolution** of dependencies
   * even if the dependency has not been defined at the time `di.get(...)` is called.
   * So, a developer can define one dependency from another, even if it's not defined yet.
   * This allows for dynamic and flexible dependency management.
   * The returned object behaves like a Promise. It delays resolution
   * until `.then(...)` is invoked, at which point it:
   *   1. Looks up the actual lazy promise from the DI container.
   *   2. Executes `.then(...)` on the retrieved value.
   * 
   * Example:
   * ```js
   * di.define('logger', () => new Logger());
   * di.get('logger').then(logger => logger.log('Hello'));
   * ```
   *
   * @param {string} key - The dependency key to resolve lazily.
   * @returns {PromiseLike<any>} A thenable object that defers to the actual dependency.
   */
  get(key) {
    const self = this;
    // TODO: check may be we can use lazy promise here instead of creating a custom thenable object
    return {
      then(onFulfilled, onRejected) {
        const value = self.container[key];

        if (!value) {
          return Promise.reject(
            new Error(`Dependency "${key}" is not defined in the DI container`)
          ).then(onFulfilled, onRejected);
        }

        return value.then(onFulfilled, onRejected);
      }
    };
  }


  /**
   * Universal lazy wrapper that decides between lazyPromise and lazyPromiseWithDeps
   * depending on whether the first argument is an array of dependencies or not.
   *
   * @param {...*} args - Either a factory function or an array of dependencies and a factory.
   * @returns {Object} lazy promise
   * 
   * @example
   * // Lazy factory with no dependencies
   * di.lazy(() => {
   *   console.log('Lazy execution');
   *   return 'Result';
   * });
   * 
   * @example
   * // Lazy factory with dependencies
   * di.lazy([di.get('db'), di.get('config')], (db, config) => {
   *   console.log('Lazy execution with deps');
   *   return new Service(db, config);
   * });
   */
  lazy(...args) {
    return lazy(...args);
  }


  /**
   * Creates an instance of a class with dependencies injected into class' params.
   * 
   * @param {Function} Class - The class constructor
   * @param {Object} params - Additional parameters to pass to the constructor
   * @returns {Object} The created instance
   */
  createInstance(Class, params = {}) {
    return createInstance(this, Class, params);
  }

}

// Fabric for creating new containers
export function createContainer() {
  return new DIContainer();
}
