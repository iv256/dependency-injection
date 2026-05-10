/**
 * Injects a value into an object using dot-separated path notation.
 *
 * @param {Object} obj - Target object
 * @param {string} path - Dot-separated path (e.g., 'A.B.C')
 * @param {*} value - Value to assign
 */
function injectPathIntoObject(obj, path, value) {
  const keys = path.split('.');
  const last = keys.pop();
  let target = obj;

  for (const key of keys) {
    if (!target[key]) target[key] = {};
    target = target[key];
  }

  if (target[last] !== undefined) {
    throw new Error(`DependencyInjection: Path "${path}" already has a value.`);
  }
  target[last] = value;
}


/**
 * Creates a structured object from resolved dependencies
 * according to the static `di` map.
 *
 * @param {Object} resolvedKeyDeps - Resolved dependency values keyed by symbolic name
 * @param {Object} diKeyMap - Mapping of dependency keys to parameter paths
 * @returns {Object} Structured injection object
 * @throws {Error} If a dependency key is not found in resolvedKeyDeps
 */
function injectResolvedDependenciesIntoObject(obj, resolvedKeyDeps, diKeyMap) {

  // Validate inputs
  if (!obj || typeof obj !== 'object') {
    throw new Error('DependencyInjection: Object is not valid for dependency injection.');
  }
  if (!resolvedKeyDeps || typeof resolvedKeyDeps !== 'object') {
    throw new Error('DependencyInjection: Resolved dependencies are not valid.');
  }
  if (!diKeyMap || typeof diKeyMap !== 'object') {
    throw new Error(`DependencyInjection: Object does not have a valid diKeyMap.`);
  }

  for (const depKey of Object.keys(diKeyMap)) {

    // Check each key in diKeyMap
    if (!(depKey in resolvedKeyDeps)) {
      throw new Error(`DependencyInjection: Required dependency "${depKey}" is missing from __deps.`);
    }

    // Inject the resolved dependency into the object at the specified path
    const value = resolvedKeyDeps[depKey];
    const targets = Array.isArray(diKeyMap[depKey]) ? diKeyMap[depKey] : [diKeyMap[depKey]];

    for (const path of targets) {
      injectPathIntoObject(obj, path, value);
    }
  }

  return obj;
}


/**
 * Creates an instance of a class with dependencies injected into class' params
 * (do `new Class(params)` where params are with injected dependencies)
 * 
 * @param {Function} Class - The class constructor
 * @param {Object} params - Additional parameters to pass to the constructor
 * @returns {Object} The created instance
 */
export async function createInstance(di, Class, params = {}) {

  // Validate that Class is a constructor function
  if (typeof Class !== 'function') {
    throw new Error('DependencyInjection: argument should be a class (i.e a constructor function).');
  }

  // Get key map of dependency injection
  const diKeyMap = Class.diKeyMap;
  if (diKeyMap) {

    // Validate key map
    if (!diKeyMap || typeof diKeyMap !== 'object') {
      throw new Error(`DependencyInjection: Class "${Class.name}" does not have a valid diKeyMap.`);
    }
    for (const key in diKeyMap) {
      if (typeof diKeyMap[key] !== 'string' && !Array.isArray(diKeyMap[key])) {
        throw new Error(`DependencyInjection: Invalid diKeyMap entry for "${key}".`);
      }
    }

    // Resolve and inject dependencies by diKeyMap into Class params
    const depsKeys = Object.keys(diKeyMap);
    if (depsKeys.length > 0) {

      // Resolve dependencies and prepare them for injection
      const depsValues = await Promise.all(depsKeys.map(key => di.get(key)));
      const resolvedKeyDeps = Object.fromEntries(
          depsKeys.map((key, i) => [key, depsValues[i]])
      );
    
      // Inject resolved dependencies into params
      injectResolvedDependenciesIntoObject(params, resolvedKeyDeps, diKeyMap);
    }
  }

  // Create and return the Class instance
  return new Class(params);

}

/**
 * Applies the class injector extension to a DI container instance.
 *
 * The core DIContainer does not import or know about this extension.
 * This function attaches `createInstance(...)` from the outside during
 * public container assembly.
 *
 * @param {Object} di - DI container instance.
 * @returns {Object} The same DI container instance with injector API attached.
 */
export function useInjector(di) {
  if (!di || typeof di !== 'object') {
    throw new Error('DependencyInjection: DI container instance is required.');
  }

  Object.defineProperty(di, 'createInstance', {
    configurable: true,
    enumerable: false,
    writable: false,
    value(Class, params = {}) {
      return createInstance(di, Class, params);
    },
  });

  return di;
}

export default createInstance;
