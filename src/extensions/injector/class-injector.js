/**
 * DI Class Injector Extension.
 *
 * This module provides an optional class injector layer for the dependency
 * injection container. The core DI container is responsible for dependency
 * registration, lazy resolution, and dependency graph execution. The core
 * container should not know how user classes, constructor arguments, object
 * params, property paths, or future injection targets are structured.
 *
 * This extension stays outside the DI container core and creates user-level
 * runtime structures with dependencies resolved from the DI container.
 *
 * The injector is designed around constructor argument injection.
 * It supports two main forms:
 *
 * 1. Single-argument injection.
 *
 *    This is the default and most common form. Dependencies are injected into
 *    the first constructor argument, which is treated as an object params
 *    argument.
 *
 *    Example:
 *
 *    class UserView {
 *      static diInject = {
 *        'user': 'user',
 *        'logger': 'services.logger'
 *      };
 *
 *      constructor(params = {}) {
 *        this.user = params.user;
 *        this.logger = params.services.logger;
 *      }
 *    }
 *
 *    await di.createClassInstance(UserView, {
 *      viewId: 'main-user-view'
 *    });
 *
 *    The constructor receives:
 *
 *    {
 *      viewId: 'main-user-view',
 *      user: resolvedUser,
 *      services: {
 *        logger: resolvedLogger
 *      }
 *    }
 *
 * 2. Multi-argument injection.
 *
 *    This form allows dependencies to be injected into object params located
 *    at specific constructor argument indexes.
 *
 *    Example:
 *
 *    class Widget {
 *      static diInject = {
 *        0: {
 *          'config': 'config'
 *        },
 *        2: {
 *          'logger': 'logger'
 *        }
 *      };
 *
 *      constructor(params = {}, options, services = {}) {
 *        this.config = params.config;
 *        this.logger = services.logger;
 *      }
 *    }
 *
 *    await di.createClassInstance(Widget, {
 *      widgetId: 'main-widget'
 *    });
 *
 *    Internally the injector prepares constructor args and calls:
 *
 *    new Widget(
 *      { widgetId: 'main-widget', config: resolvedConfig },
 *      undefined,
 *      { logger: resolvedLogger }
 *    )
 *
 * The current injector supports nested-in-argument injection. This means that
 * dependencies are injected into object arguments using dot-separated paths.
 * Direct-argument injection, where a dependency becomes the entire constructor
 * argument value, is intentionally not implemented yet.
 *
 * Deprecated compatibility:
 *
 * The old static metadata name `diKeyMap` is still supported as a deprecated
 * alias for the default single-argument `diInject` form.
 *
 * Example:
 *
 * class LegacyView {
 *   static diKeyMap = {
 *     'config': 'config'
 *   };
 * }
 *
 * is treated as:
 *
 * class LegacyView {
 *   static diInject = {
 *     'config': 'config'
 *   };
 * }
 *
 * New code should use `diInject`.
 *
 * Implementation workflow:
 *
 * createClassInstance(di, Class, params)
 *     ↓
 * validate Class constructor
 *     ↓
 * normalizeConstructorInjectionMap(Class)
 *     ↓
 * resolveDeprecatedDiKeyMap(Class)
 *     ↓
 * detect injection metadata form:
 *     ├── no metadata
 *     │       ↓
 *     │   no injection, use provided params as constructor argument 0
 *     │
 *     ├── single-argument injection
 *     │       ↓
 *     │   normalize to argument 0 injection map
 *     │
 *     └── multi-argument injection
 *             ↓
 *         keep explicit constructor argument indexes
 *     ↓
 * validate nested-in-argument injection maps
 *     ↓
 * resolveConstructorInjectionDependencies(di, constructorInjectionMap)
 *     ↓
 * injectResolvedDependenciesIntoConstructorArgs(args, resolvedKeyDeps, map)
 *     ↓
 * new Class(...args)
 *
 * Terminology used in this module:
 *
 * - Injection metadata:
 *   Static class metadata that describes which DI dependency keys should be
 *   resolved and where resolved values should be inserted.
 *
 * - Single-argument injection:
 *   A shorthand form where dependencies are injected into constructor argument 0.
 *
 * - Multi-argument injection:
 *   A form where top-level metadata keys are constructor argument indexes.
 *
 * - Nested-in-argument injection:
 *   A dependency is inserted into a nested path inside an object argument,
 *   for example into `params.services.logger`.
 *
 * - Plain object:
 *   A normal object used as an object params container, for example:
 *   `{}`, `{ config: value }`, or `{ services: { logger } }`.
 *   Arrays, functions, null, strings, and numbers are not valid object params
 *   containers for nested-in-argument injection.
 */


/**
 * Checks whether a value is a plain object.
 *
 * In this module, a plain object means a normal object that can be used as a
 * constructor params container for nested-in-argument injection.
 *
 * Valid examples:
 *
 * - {}
 * - { config: value }
 * - { services: { logger } }
 *
 * Invalid examples:
 *
 * - null
 * - []
 * - function () {}
 * - 'text'
 * - 123
 *
 * This check prevents the injector from trying to create nested paths inside
 * values that cannot safely behave as object params containers.
 *
 * @param {*} value - Value to check.
 * @returns {boolean} True when value is a non-null object and not an array.
 */
function isPlainObject(value) {
  return Boolean(
    value &&
    typeof value === 'object' &&
    !Array.isArray(value)
  );
}


/**
 * Checks whether a metadata key is a constructor argument index.
 *
 * @param {string} key - Metadata key.
 * @returns {boolean} True when key is a non-negative integer index.
 */
function isConstructorArgumentIndexKey(key) {
  return /^(0|[1-9]\d*)$/.test(key);
}


/**
 * Injects a value into an object using dot-separated path notation.
 *
 * This function mutates the target object. Missing intermediate objects are
 * created automatically.
 *
 * @param {Object} obj - Target object.
 * @param {string} path - Dot-separated target path.
 * @param {*} value - Value to assign.
 * @throws {Error} If the target path cannot be created or already contains a value.
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
 * Resolves deprecated class injection metadata.
 *
 * `diKeyMap` is supported only as a deprecated alias for `diInject`.
 * A class must not define both metadata properties at the same time.
 *
 * @param {Function} Class - Class constructor.
 * @returns {Object|undefined} Injection metadata or undefined when the class
 * does not declare injection metadata.
 * @throws {Error} If both `diInject` and deprecated `diKeyMap` are defined.
 */
function resolveDeprecatedDiKeyMap(Class) {
  if (Class.diInject !== undefined && Class.diKeyMap !== undefined) {
    throw new Error(
      `DependencyInjection: Class "${Class.name}" cannot define both diInject and deprecated diKeyMap.`
    );
  }

  if (Class.diInject === undefined && Class.diKeyMap !== undefined) {
    return Class.diKeyMap;
  }

  return Class.diInject;
}


/**
 * Checks whether injection metadata uses the default single-argument form.
 *
 * In this form metadata keys are dependency keys and values are target paths
 * inside constructor argument 0.
 *
 * @param {Object} injectionMetadata - Injection metadata.
 * @returns {boolean} True when metadata is a single-argument injection map.
 */
function isSingleArgumentInjectionMap(injectionMetadata) {
  const keys = Object.keys(injectionMetadata);

  return keys.every(key => !isConstructorArgumentIndexKey(key));
}


/**
 * Checks whether injection metadata uses multi-argument injection form.
 *
 * In this form top-level metadata keys are constructor argument indexes.
 * Each value is an injection map for that constructor argument.
 *
 * @param {Object} injectionMetadata - Injection metadata.
 * @returns {boolean} True when metadata is a multi-argument injection map.
 */
function isMultiArgumentInjectionMap(injectionMetadata) {
  const keys = Object.keys(injectionMetadata);

  return keys.length > 0 && keys.every(isConstructorArgumentIndexKey);
}


/**
 * Validates nested-in-argument injection map.
 *
 * This map has dependency keys as keys and target paths as values.
 * Target paths can be a string or a list of strings.
 *
 * @param {Object} injectionMap - Injection map for one constructor argument.
 * @throws {Error} If injection map is invalid.
 */
function validateNestedInArgumentInjectionMap(injectionMap) {
  if (!isPlainObject(injectionMap)) {
    throw new Error('DependencyInjection: Constructor argument injection map must be an object.');
  }

  for (const depKey of Object.keys(injectionMap)) {
    if (typeof depKey !== 'string' || depKey.length === 0) {
      throw new Error('DependencyInjection: Dependency key must be a non-empty string.');
    }

    const target = injectionMap[depKey];

    if (typeof target !== 'string' && !Array.isArray(target)) {
      throw new Error(`DependencyInjection: Invalid diInject entry for "${depKey}".`);
    }

    if (Array.isArray(target) && target.some(path => typeof path !== 'string')) {
      throw new Error(`DependencyInjection: Invalid target path list for "${depKey}".`);
    }
  }
}


/**
 * Normalizes class injection metadata to canonical constructor argument form.
 *
 * Supported input forms:
 *
 * 1. Single-argument form:
 *
 *    {
 *      'config': 'config'
 *    }
 *
 *    becomes:
 *
 *    {
 *      0: {
 *        'config': 'config'
 *      }
 *    }
 *
 * 2. Multi-argument form:
 *
 *    {
 *      0: { 'config': 'config' },
 *      2: { 'logger': 'logger' }
 *    }
 *
 * If injection metadata is undefined, the class does not request injection.
 * Returning an empty canonical map is safe because createClassInstance(...) then
 * skips dependency resolution and creates the class with the provided params
 * as constructor argument 0.
 *
 * @param {Function} Class - Class constructor.
 * @returns {Object} Canonical constructor argument injection map.
 * @throws {Error} If metadata is invalid or mixed.
 */
function normalizeConstructorInjectionMap(Class) {
  const injectionMetadata = resolveDeprecatedDiKeyMap(Class);

  if (injectionMetadata === undefined) {
    return {};
  }

  if (!isPlainObject(injectionMetadata)) {
    throw new Error(`DependencyInjection: Class "${Class.name}" does not have valid diInject metadata.`);
  }

  const keys = Object.keys(injectionMetadata);

  if (keys.length === 0) {
    return {};
  }

  if (isSingleArgumentInjectionMap(injectionMetadata)) {
    validateNestedInArgumentInjectionMap(injectionMetadata);

    return {
      0: injectionMetadata,
    };
  }

  if (isMultiArgumentInjectionMap(injectionMetadata)) {
    for (const argIndex of keys) {
      validateNestedInArgumentInjectionMap(injectionMetadata[argIndex]);
    }

    return injectionMetadata;
  }

  throw new Error(
    `DependencyInjection: Class "${Class.name}" has mixed diInject format. Use either single-argument or multi-argument injection metadata.`
  );
}


/**
 * Resolves all dependency keys used by constructor argument injection metadata.
 *
 * @param {Object} di - DI container instance.
 * @param {Object} constructorInjectionMap - Canonical constructor argument injection map.
 * @returns {Promise<Object>} Resolved dependency values keyed by dependency key.
 */
async function resolveConstructorInjectionDependencies(di, constructorInjectionMap) {
  const depKeys = [
    ...new Set(
      Object.values(constructorInjectionMap)
        .flatMap(injectionMap => Object.keys(injectionMap))
    ),
  ];

  const depValues = await Promise.all(depKeys.map(key => di.get(key)));

  return Object.fromEntries(
    depKeys.map((key, index) => [key, depValues[index]])
  );
}


/**
 * Injects resolved dependencies into constructor arguments.
 *
 * Each constructor argument that receives nested-in-argument injection is
 * treated as an object. Missing argument objects are created automatically.
 *
 * @param {Array} args - Constructor arguments.
 * @param {Object} resolvedKeyDeps - Resolved dependency values by dependency key.
 * @param {Object} constructorInjectionMap - Canonical constructor argument injection map.
 * @returns {Array} Mutated constructor arguments.
 * @throws {Error} If target argument is already defined and is not an object.
 */
function injectResolvedDependenciesIntoConstructorArgs(args, resolvedKeyDeps, constructorInjectionMap) {
  for (const argIndex of Object.keys(constructorInjectionMap)) {
    const numericArgIndex = Number(argIndex);
    const injectionMap = constructorInjectionMap[argIndex];

    if (args[numericArgIndex] === undefined) {
      args[numericArgIndex] = {};
    }

    if (!isPlainObject(args[numericArgIndex])) {
      throw new Error(
        `DependencyInjection: Constructor argument ${argIndex} is not valid for nested-in-argument injection.`
      );
    }

    for (const depKey of Object.keys(injectionMap)) {
      if (!(depKey in resolvedKeyDeps)) {
        throw new Error(`DependencyInjection: Required dependency "${depKey}" is missing.`);
      }

      const value = resolvedKeyDeps[depKey];
      const targets = Array.isArray(injectionMap[depKey])
        ? injectionMap[depKey]
        : [injectionMap[depKey]];

      for (const path of targets) {
        injectPathIntoObject(args[numericArgIndex], path, value);
      }
    }
  }

  return args;
}


/**
 * Creates a class instance with dependencies injected into constructor arguments.
 *
 * The function reads `Class.diInject`, resolves all dependency keys through the
 * DI container, injects resolved values into constructor arguments, and creates
 * a class instance using `new Class(...args)`.
 *
 * The second argument is kept backward-compatible with the previous API and is
 * treated as constructor argument 0.
 *
 * @param {Object} di - DI container instance.
 * @param {Function} Class - Class constructor.
 * @param {Object} params - Constructor argument 0 object.
 * @returns {Promise<Object>} Created class instance.
 * @throws {Error} If Class is not a constructor function.
 */
export async function createClassInstance(di, Class, params = {}) {
  if (typeof Class !== 'function') {
    throw new Error('DependencyInjection: Argument should be a class constructor.');
  }

  const constructorInjectionMap = normalizeConstructorInjectionMap(Class);
  const args = [params];

  if (Object.keys(constructorInjectionMap).length > 0) {
    const resolvedKeyDeps = await resolveConstructorInjectionDependencies(
      di,
      constructorInjectionMap
    );

    injectResolvedDependenciesIntoConstructorArgs(
      args,
      resolvedKeyDeps,
      constructorInjectionMap
    );
  }

  return new Class(...args);
}


/**
 * Deprecated alias for backward compatibility.
 *
 * @deprecated Use createClassInstance instead.
 *
 * @param {Object} di - DI container instance.
 * @param {Function} Class - Class constructor.
 * @param {Object} params - Constructor argument 0 object.
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
