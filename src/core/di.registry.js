/**
 * DI Registry
 *
 * This module defines a low-level registry used by the DI container.
 *
 * The registry stores dependency entries as key-value pairs:
 *
 *   string key -> lazy promise
 *
 * In the current version:
 *  - `define(key,...args)` writes key-lazy promise pairs into this registry.
 *  - `get(key)` reads value by key from this registry.
 *
 * Keys:
 * - A key must always be a string.
 * - The registry is flat and does not support nested keys.
 * - Dot notation may be used as a semantic convention.
 *   Example: "services.logger", "repositories.user".
 * - Dot notation does not create nested storage internally.
 *
 * Values:
 * - Every stored value must be a lazy promise-like object.
 * - The registry does not store dependency definitions, factories, or raw values.
 *
 * Responsibility:
 * - DIRegistry is a low-level storage layer under DIContainer.
 * - It validates keys and stored values.
 * - It does not resolve dependencies.
 * - It does not know about factories, dependency lists, lifecycles, or injection.
 */

/**
 * Checks whether a value looks like a lazy promise used by the DI container.
 *
 * @param {*} value - Value to check.
 * @returns {boolean} True if value has the expected lazy promise interface.
 */
function isLazyPromise(value) {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof value.then === 'function' &&
    typeof value.catch === 'function' &&
    typeof value.finally === 'function' &&
    typeof value.asPromise === 'function'
  );
}

/**
 * Low-level registry for DI container entries.
 */
export class DIRegistry {
  constructor() {
    this._storage = Object.create(null);
  }

  /**
   * Registers a lazy promise by dependency key.
   *
   * @param {string} key - Dependency key.
   * @param {PromiseLike<any>} value - Lazy promise-like dependency value.
   * @returns {PromiseLike<any>} Registered lazy promise-like value.
   */
  set(key, value) {
    this._validateKey(key);

    if (this.has(key)) {
      throw new Error(`DIRegistry: Dependency key "${key}" is already defined.`);
    }

    this._validateValue(key, value);

    this._storage[key] = value;
    return value;
  }

  /**
   * Returns a lazy promise by dependency key.
   *
   * @param {string} key - Dependency key.
   * @returns {PromiseLike<any>} Lazy promise-like dependency value.
   */
  get(key) {
    this._validateKey(key);

    if (!this.has(key)) {
      throw new Error(`DIRegistry: Dependency key "${key}" is not defined.`);
    }

    return this._storage[key];
  }

  /**
   * Checks whether a dependency key exists.
   *
   * @param {string} key - Dependency key.
   * @returns {boolean} True if dependency exists.
   */
  has(key) {
    this._validateKey(key);
    return key in this._storage;
  }

  /**
   * Validates dependency key.
   *
   * @param {*} key - Dependency key to validate.
   */
  _validateKey(key) {
    if (typeof key !== 'string') {
      throw new Error(
        `DIRegistry: Invalid dependency key type: "${String(key)}". Dependency key must be a string.`
      );
    }
  }

  /**
   * Validates dependency value.
   *
   * @param {string} key - Dependency key.
   * @param {*} value - Dependency value to validate.
   */
  _validateValue(key, value) {
    if (!isLazyPromise(value)) {
      throw new Error(
        `DIRegistry: Dependency value for key "${key}" must be a lazy promise.`
      );
    }
  }
}

/**
 * Creates a new DI registry instance.
 *
 * @returns {DIRegistry} New registry instance.
 */
export function createRegistry() {
  return new DIRegistry();
}

export default DIRegistry;
