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
 *
 * There are two independent design axes:
 *
 * 1. Constructor argument selection:
 *
 *    - Single-argument injection:
 *      Shorthand form. Dependencies are injected into constructor argument 0.
 *
 *    - Multi-argument injection:
 *      Explicit form. Top-level metadata keys are constructor argument indexes.
 *
 * 2. Injection mode inside a selected constructor argument:
 *
 *    - Nested-in-argument injection:
 *      A resolved dependency is inserted into a path inside an object argument.
 *
 *    - Direct-argument injection:
 *      A resolved dependency becomes the whole constructor argument value.
 *
 * Single-argument nested-in-argument injection example:
 *
 * class UserView {
 *   static diInject = {
 *     'user': 'user',
 *     'logger': 'services.logger'
 *   };
 *
 *   constructor(params = {}) {
 *     this.user = params.user;
 *     this.logger = params.services.logger;
 *   }
 * }
 *
 * await di.createClassInstance(UserView, {
 *   viewId: 'main-user-view'
 * });
 *
 * The constructor receives:
 *
 * {
 *   viewId: 'main-user-view',
 *   user: resolvedUser,
 *   services: {
 *     logger: resolvedLogger
 *   }
 * }
 *
 * Multi-argument nested-in-argument injection example:
 *
 * class Widget {
 *   static diInject = {
 *     0: {
 *       'config': 'config'
 *     },
 *     2: {
 *       'logger': 'logger'
 *     }
 *   };
 *
 *   constructor(params = {}, options, services = {}) {
 *     this.config = params.config;
 *     this.logger = services.logger;
 *   }
 * }
 *
 * await di.createClassInstance(Widget, {
 *   widgetId: 'main-widget'
 * });
 *
 * Internally the injector prepares constructor args and calls:
 *
 * new Widget(
 *   { widgetId: 'main-widget', config: resolvedConfig },
 *   undefined,
 *   { logger: resolvedLogger }
 * )
 *
 * Multi-argument direct-argument injection example:
 *
 * class DatabaseClient {
 *   static diInject = {
 *     0: {
 *       'config': 'config'
 *     },
 *     1: 'db.connector',
 *     2: {
 *       'logger': 'logger'
 *     }
 *   };
 *
 *   constructor(params = {}, dbConnector, services = {}) {
 *     this.config = params.config;
 *     this.dbConnector = dbConnector;
 *     this.logger = services.logger;
 *   }
 * }
 *
 * Internally the injector prepares constructor args and calls:
 *
 * new DatabaseClient(
 *   { config: resolvedConfig },
 *   resolvedDbConnector,
 *   { logger: resolvedLogger }
 * )
 *
 * The syntax contrast is intentional:
 *
 * {
 *   'db.connector': 'db'
 * }
 *
 * means:
 *
 * - single-argument injection;
 * - nested-in-argument injection;
 * - inject resolved `db.connector` into `args[0].db`.
 *
 * {
 *   0: 'db.connector'
 * }
 *
 * means:
 *
 * - multi-argument injection;
 * - direct-argument injection;
 * - make `args[0]` equal to resolved `db.connector`.
 *
 * Deprecated compatibility:
 *
 * The old static metadata name `diKeyMap` is still supported as a deprecated
 * alias for the default single-argument `diInject` form. New code should use
 * `diInject`.
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
 *     │   normalize to argument 0 nested-in-argument injection map
 *     │
 *     └── multi-argument injection
 *             ↓
 *         keep explicit constructor argument indexes
 *     ↓
 * detect injection mode for each constructor argument:
 *     ├── object value
 *     │       ↓
 *     │   nested-in-argument injection
 *     │
 *     └── string value
 *             ↓
 *         direct-argument injection
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
 * - Direct-argument injection:
 *   A dependency becomes the whole constructor argument value, for example
 *   `constructor(params, dbConnector)` where `dbConnector` is resolved from DI.
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
 * Checks whether a constructor argument injection descriptor is direct.
 *
 * In direct-argument injection, the descriptor is a DI dependency key string.
 * The resolved dependency becomes the whole constructor argument value.
 *
 * @param {*} descriptor - Constructor argument injection descriptor.
 * @returns {boolean} True when descriptor is direct-argument injection.
 */
function isDirectArgumentInjectionDescriptor(descriptor) {
  return typeof descriptor === 'string';
}


/**
 * Checks whether a constructor argument injection descriptor is nested.
 *
 * In nested-in-argument injection, the descriptor is a map where keys are DI
 * dependency keys and values are target paths inside an object argument.
 *
 * @param {*} descriptor - Constructor argument injection descriptor.
 * @returns {boolean} True when descriptor is nested-in-argument injection.
 */
function isNestedInArgumentInjectionDescriptor(descriptor) {
  return isPlainObject(descriptor);
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
 * Each value is either:
 *
 * - an object map for nested-in-argument injection;
 * - a string DI key for direct-argument injection.
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
 * Validates direct-argument injection descriptor.
 *
 * @param {string} depKey - DI dependency key used as direct argument value.
 * @throws {Error} If dependency key is invalid.
 */
function validateDirectArgumentInjectionDescriptor(depKey) {
  if (typeof depKey !== 'string' || depKey.length === 0) {
    throw new Error('DependencyInjection: Direct argument injection key must be a non-empty string.');
  }
}


/**
 * Validates one constructor argument injection descriptor.
 *
 * @param {*} descriptor - Constructor argument injection descriptor.
 * @param {string} argIndex - Constructor argument index.
 * @throws {Error} If descriptor is invalid.
 */
function validateConstructorArgumentInjectionDescriptor(descriptor, argIndex) {
  if (isDirectArgumentInjectionDescriptor(descriptor)) {
    validateDirectArgumentInjectionDescriptor(descriptor);
    return;
  }

  if (isNestedInArgumentInjectionDescriptor(descriptor)) {
    validateNestedInArgumentInjectionMap(descriptor);
    return;
  }

  throw new Error(
    `DependencyInjection: Invalid injection descriptor for constructor argument ${argIndex}.`
  );
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
 * 2. Multi-argument form with nested and direct descriptors:
 *
 *    {
 *      0: { 'config': 'config' },
 *      1: 'db.connector',
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
      validateConstructorArgumentInjectionDescriptor(
        injectionMetadata[argIndex],
        argIndex
      );
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
        .flatMap(descriptor => {
          if (isDirectArgumentInjectionDescriptor(descriptor)) {
            return [descriptor];
          }

          return Object.keys(descriptor);
        })
    ),
  ];

  const depValues = await Promise.all(depKeys.map(key => di.get(key)));

  return Object.fromEntries(
    depKeys.map((key, index) => [key, depValues[index]])
  );
}


/**
 * Injects resolved dependencies into one constructor object argument.
 *
 * @param {Array} args - Constructor arguments.
 * @param {number} numericArgIndex - Constructor argument index.
 * @param {string} argIndex - Constructor argument index as metadata key.
 * @param {Object} resolvedKeyDeps - Resolved dependency values by dependency key.
 * @param {Object} injectionMap - Nested-in-argument injection map.
 * @throws {Error} If target argument is already defined and is not an object.
 */
function injectNestedDependenciesIntoConstructorArg(args, numericArgIndex, argIndex, resolvedKeyDeps, injectionMap) {
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


/**
 * Injects one resolved dependency as the entire constructor argument value.
 *
 * Direct-argument injection does not merge objects and does not create nested
 * paths. The target constructor argument slot must be empty.
 *
 * @param {Array} args - Constructor arguments.
 * @param {number} numericArgIndex - Constructor argument index.
 * @param {string} argIndex - Constructor argument index as metadata key.
 * @param {Object} resolvedKeyDeps - Resolved dependency values by dependency key.
 * @param {string} depKey - Dependency key to inject directly.
 * @throws {Error} If target argument already has a value.
 */
function injectDirectDependencyIntoConstructorArg(args, numericArgIndex, argIndex, resolvedKeyDeps, depKey) {
  if (args[numericArgIndex] !== undefined) {
    throw new Error(
      `DependencyInjection: Constructor argument ${argIndex} already has a value and cannot receive direct-argument injection.`
    );
  }

  if (!(depKey in resolvedKeyDeps)) {
    throw new Error(`DependencyInjection: Required dependency "${depKey}" is missing.`);
  }

  args[numericArgIndex] = resolvedKeyDeps[depKey];
}


/**
 * Injects resolved dependencies into constructor arguments.
 *
 * Each constructor argument descriptor can use one of two modes:
 *
 * - object descriptor: nested-in-argument injection;
 * - string descriptor: direct-argument injection.
 *
 * @param {Array} args - Constructor arguments.
 * @param {Object} resolvedKeyDeps - Resolved dependency values by dependency key.
 * @param {Object} constructorInjectionMap - Canonical constructor argument injection map.
 * @returns {Array} Mutated constructor arguments.
 */
function injectResolvedDependenciesIntoConstructorArgs(args, resolvedKeyDeps, constructorInjectionMap) {
  for (const argIndex of Object.keys(constructorInjectionMap)) {
    const numericArgIndex = Number(argIndex);
    const descriptor = constructorInjectionMap[argIndex];

    if (isDirectArgumentInjectionDescriptor(descriptor)) {
      injectDirectDependencyIntoConstructorArg(
        args,
        numericArgIndex,
        argIndex,
        resolvedKeyDeps,
        descriptor
      );
      continue;
    }

    injectNestedDependenciesIntoConstructorArg(
      args,
      numericArgIndex,
      argIndex,
      resolvedKeyDeps,
      descriptor
    );
  }

  return args;
}


/**
 * Checks whether constructor injection map uses direct injection for argument 0.
 *
 * @param {Object} constructorInjectionMap - Canonical constructor argument injection map.
 * @returns {boolean} True when argument 0 receives direct-argument injection.
 */
function hasDirectInjectionForFirstArgument(constructorInjectionMap) {
  return isDirectArgumentInjectionDescriptor(constructorInjectionMap[0]);
}


/**
 * Creates initial constructor arguments array.
 *
 * The previous public API treated the second argument of createClassInstance as
 * constructor argument 0. This behavior is preserved unless argument 0 is going
 * to receive direct-argument injection and no explicit params were passed.
 *
 * @param {boolean} hasExplicitParams - Whether user passed params explicitly.
 * @param {Object} params - Constructor argument 0 object.
 * @param {Object} constructorInjectionMap - Canonical constructor argument injection map.
 * @returns {Array} Initial constructor arguments.
 */
function createInitialConstructorArgs(hasExplicitParams, params, constructorInjectionMap) {
  if (hasExplicitParams) {
    return [params];
  }

  if (hasDirectInjectionForFirstArgument(constructorInjectionMap)) {
    return [];
  }

  return [{}];
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
  const hasExplicitParams = arguments.length >= 3;
  const args = createInitialConstructorArgs(
    hasExplicitParams,
    params,
    constructorInjectionMap
  );

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
  if (arguments.length >= 3) {
    return createClassInstance(di, Class, params);
  }

  return createClassInstance(di, Class);
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
    value(Class, params) {
      if (arguments.length >= 2) {
        return createClassInstance(di, Class, params);
      }

      return createClassInstance(di, Class);
    },
  });

  Object.defineProperty(di, 'createInstance', {
    configurable: true,
    enumerable: false,
    writable: false,
    value(Class, params) {
      if (arguments.length >= 2) {
        return createClassInstance(di, Class, params);
      }

      return createClassInstance(di, Class);
    },
  });

  return di;
}

export default createClassInstance;
