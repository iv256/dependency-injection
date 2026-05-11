/**
 * DI Injector Extension.
 *
 * This module provides an optional injector layer for the dependency injection
 * container. The core DI container is responsible for dependency registration,
 * lazy dependency resolution, lifecycle handling, and dependency graph execution.
 * The core container should not know how user classes, constructor params,
 * property paths, or future injection targets are structured. 
 *
 * This injector extension stays outside of the DI container core
 * and is responsible for creating user-level runtime structures
 * with dependencies resolved from the DI container by declared dependency keys.
 *
 * In the current version, this module implements class-based injection.
 * The injector reads dependency metadata from a class constructor, resolves
 * declared dependency keys through the DI container, injects resolved values
 * into the constructor params object, and only then creates the class instance.
 *
 * The important execution flow is:
 *
 * 1. A class declares dependency metadata using the static `diKeyMap` property.
 * 2. `diKeyMap` maps DI container keys to target paths inside constructor params.
 * 3. `createClassInstance(...)` reads dependency keys from `Class.diKeyMap`.
 * 4. The injector calls `di.get(key)` for every declared dependency key.
 * 5. The DI container resolves these dependencies using its lazy resolution logic.
 * 6. The injector writes resolved dependency values into the params object.
 * 7. The injector creates the class instance using `new Class(params)`.
 *
 * This means that dependencies are not passed to the injector as already
 * resolved values. The injector receives dependency keys and asks the DI
 * container to resolve them at the moment when the class instance is being
 * created.
 *
 * Example:
 *
 * class UserService {
 *   static diKeyMap = {
 *     'logger': 'services.logger',
 *     'config': 'runtime.config',
 *     'database': 'database'
 *   };
 *
 *   constructor(params) {
 *     this.services = params.services;
 *     this.runtime = params.runtime;
 *     this.database = params.database;
 *   }
 * }
 *
 * await di.createClassInstance(UserService, {
 *   userId: 100
 * });
 *
 * After dependency resolution and injection, the constructor receives params
 * with the following structure:
 *
 * {
 *   userId: 100,
 *   services: {
 *     logger: resolvedLogger
 *   },
 *   runtime: {
 *     config: resolvedConfig
 *   },
 *   database: resolvedDatabase
 * }
 *
 * Multiple target paths are also supported:
 *
 * class ReportService {
 *   static diKeyMap = {
 *     'logger': ['logger', 'services.logger'],
 *     'config': 'config'
 *   };
 *
 *   constructor(params) {
 *     this.logger = params.logger;
 *     this.services = params.services;
 *     this.config = params.config;
 *   }
 * }
 *
 * In this case, the same resolved `logger` dependency will be injected into
 * both `params.logger` and `params.services.logger`.
 *
 */


/**
 * Injects a value into an object using dot-separated path notation.
 *
 * This function mutates the target object. Missing intermediate objects are
 * created automatically.
 *
 * @param {Object} obj - Target object.
 * @param {string} path - Dot-separated target path.
 * @param {*} value - Value to assign.
 * @throws {Error} If the target path already contains a value.
 */
function injectPathIntoObject(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let target = obj;

  for (const key of keys) {
    if (target[key] !== undefined && typeof target[key] !== 'object') {
      throw new Error(`DependencyInjection: Path "${path}" cannot be created because "${key}" is not an object.`);
    }
    
    if (!target[key]) {
      target[key] = {};
    }

    target = target[key];
  }

  if (target[last] !== undefined) {
    throw new Error(`DependencyInjection: Path "${path}" already has a value.`);
  }

  target[last] = value;
}


/**
 * Injects resolved dependencies into a target object according to a DI key map.
 *
 * This function mutates the target object. Each dependency key from `diKeyMap`
 * is matched against `resolvedKeyDeps`, then injected into one or more target
 * paths.
 *
 * @param {Object} obj - Target object for dependency injection.
 * @param {Object} resolvedKeyDeps - Resolved dependency values keyed by dependency key.
 * @param {Object} diKeyMap - Mapping between dependency keys and target paths.
 * @returns {Object} The same target object with injected dependencies.
 * @throws {Error} If the target object, resolved dependencies, or DI key map are invalid.
 * @throws {Error} If a required dependency is missing.
 */
function injectResolvedDependenciesIntoObject(obj, resolvedKeyDeps, diKeyMap) {
  if (!obj || typeof obj !== 'object') {
    throw new Error('DependencyInjection: Object is not valid for dependency injection.');
  }

  if (!resolvedKeyDeps || typeof resolvedKeyDeps !== 'object') {
    throw new Error('DependencyInjection: Resolved dependencies are not valid.');
  }

  if (!diKeyMap || typeof diKeyMap !== 'object') {
    throw new Error('DependencyInjection: Object does not have a valid diKeyMap.');
  }

  for (const depKey of Object.keys(diKeyMap)) {
    if (!(depKey in resolvedKeyDeps)) {
      throw new Error(`DependencyInjection: Required dependency "${depKey}" is missing.`);
    }

    const value = resolvedKeyDeps[depKey];
    const targets = Array.isArray(diKeyMap[depKey])
      ? diKeyMap[depKey]
      : [diKeyMap[depKey]];

    for (const path of targets) {
      injectPathIntoObject(obj, path, value);
    }
  }

  return obj;
}


/**
 * Validates a class-level DI key map.
 *
 * @param {Function} Class - Class constructor.
 * @param {Object} diKeyMap - Class-level DI key map.
 * @throws {Error} If the DI key map is invalid.
 */
function validateClassDiKeyMap(Class, diKeyMap) {
  if (!diKeyMap || typeof diKeyMap !== 'object') {
    throw new Error(`DependencyInjection: Class "${Class.name}" does not have a valid diKeyMap.`);
  }

  for (const key in diKeyMap) {
    const value = diKeyMap[key];

    if (typeof value !== 'string' && !Array.isArray(value)) {
      throw new Error(`DependencyInjection: Invalid diKeyMap entry for "${key}".`);
    }

    if (Array.isArray(value) && value.some(path => typeof path !== 'string')) {
      throw new Error(`DependencyInjection: Invalid target path list for "${key}".`);
    }
  }
}


/**
 * Creates a class instance with dependencies injected into constructor params.
 *
 * The function reads `Class.diKeyMap`, resolves all dependency keys through
 * the DI container, injects resolved values into the `params` object, and then
 * creates a class instance using `new Class(params)`.
 *
 * This function mutates the provided `params` object.
 *
 * @param {Object} di - DI container instance.
 * @param {Function} Class - Class constructor.
 * @param {Object} params - Constructor params object.
 * @returns {Promise<Object>} Created class instance.
 * @throws {Error} If Class is not a constructor function.
 */
export async function createClassInstance(di, Class, params = {}) {
  if (typeof Class !== 'function') {
    throw new Error('DependencyInjection: Argument should be a class constructor.');
  }

  const diKeyMap = Class.diKeyMap;

  if (diKeyMap) {
    validateClassDiKeyMap(Class, diKeyMap);

    const depKeys = Object.keys(diKeyMap);

    if (depKeys.length > 0) {
      const depValues = await Promise.all(depKeys.map(key => di.get(key)));

      const resolvedKeyDeps = Object.fromEntries(
        depKeys.map((key, index) => [key, depValues[index]])
      );

      injectResolvedDependenciesIntoObject(params, resolvedKeyDeps, diKeyMap);
    }
  }

  return new Class(params);
}


/**
 * Deprecated alias for backward compatibility.
 *
 * @deprecated Use createClassInstance instead.
 *
 * @param {Object} di - DI container instance.
 * @param {Function} Class - Class constructor.
 * @param {Object} params - Constructor params object.
 * @returns {Promise<Object>} Created class instance.
 */
export async function createInstance(di, Class, params = {}) {
  return createClassInstance(di, Class, params);
}


/**
 * Applies the class injector extension to a DI container instance.
 *
 * The core DI container does not import or know about this extension.
 * This function attaches class injection API from the outside during public
 * container assembly.
 *
 * @param {Object} di - DI container instance.
 * @returns {Object} The same DI container instance with injector API attached.
 * @throws {Error} If DI container instance is invalid.
 */
export function useInjector(di) {
  if (!di || typeof di !== 'object') {
    throw new Error('DependencyInjection: DI container instance is required.');
  }

  Object.defineProperty(di, 'createClassInstance', {
    configurable: true,
    enumerable: false,
    writable: false,
    value(Class, params = {}) {
      return createClassInstance(di, Class, params);
    },
  });

  Object.defineProperty(di, 'createInstance', {
    configurable: true,
    enumerable: false,
    writable: false,
    value(Class, params = {}) {
      return createClassInstance(di, Class, params);
    },
  });

  return di;
}

export default createClassInstance;