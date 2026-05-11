/**
 * Define syntax extension.
 *
 * This extension wraps the public `di.define(...)` method and adds a flexible
 * user-facing syntax while preserving the original strict core implementation
 * as `di.defineCore(...)`.
 *
 * Core define contract:
 *
 *   di.defineCore(key, dependencies, factory)
 *
 * Public define contract after this extension:
 *
 *   di.define(key, factory)
 *   di.define(key, dependencies, factory)
 *
 * Supported dependency inputs:
 *
 * - string:
 *   treated as a registry key and converted to `di.get(key)`;
 *
 * - function:
 *   treated as a lazy dependency factory and converted to `di.lazy(factory)`;
 *
 * - native Promise:
 *   passed as-is. This is allowed, but native promises may already be running;
 *
 * - thenable object:
 *   passed as-is.
 */

function normalizeDependency(di, dependency) {
  if (typeof dependency === 'string') {
    return di.get(dependency);
  }

  if (typeof dependency === 'function') {
    return di.lazy(dependency);
  }

  if (dependency instanceof Promise) {
    // Debug warning can be enabled later:
    // console.debug(
    //   'DependencyInjection: A native Promise was passed as a dependency. ' +
    //   'It may already be running and may break lazy execution semantics.'
    // );

    return dependency;
  }

  if (dependency && typeof dependency.then === 'function') {
    return dependency;
  }

  throw new TypeError('DependencyInjection: Invalid dependency item.');
}

function normalizeDependencies(di, dependencies) {
  if (!Array.isArray(dependencies)) {
    throw new TypeError('DependencyInjection: Dependencies must be an array.');
  }

  return dependencies.map((dependency) => normalizeDependency(di, dependency));
}

function normalizeDefineArguments(di, key, dependenciesOrFactory, maybeFactory) {
  if (typeof key !== 'string') {
    throw new TypeError('DependencyInjection: Dependency key must be a string.');
  }

  let dependencies = dependenciesOrFactory;
  let factory = maybeFactory;

  if (typeof dependenciesOrFactory === 'function' && maybeFactory === undefined) {
    dependencies = [];
    factory = dependenciesOrFactory;
  }

  if (typeof factory !== 'function') {
    throw new TypeError('DependencyInjection: Factory must be a function.');
  }

  return {
    key,
    dependencies: normalizeDependencies(di, dependencies),
    factory,
  };
}

/**
 * Applies flexible define syntax to a DI container instance.
 *
 * The original strict core `define(...)` method is preserved as `defineCore`.
 * The public `define(...)` method is replaced with a syntax-normalizing wrapper.
 *
 * @param {Object} di - DI container instance.
 * @returns {Object} The same DI container instance with enhanced define syntax.
 */
export function useDefineSyntax(di) {
  if (!di || typeof di !== 'object') {
    throw new TypeError('DependencyInjection: DI container instance is required.');
  }

  if (typeof di.define !== 'function') {
    throw new TypeError('DependencyInjection: DI container must have define method.');
  }

  if (typeof di.get !== 'function') {
    throw new TypeError('DependencyInjection: DI container must have get method.');
  }

  if (typeof di.lazy !== 'function') {
    throw new TypeError('DependencyInjection: DI container must have lazy method.');
  }

  const defineCore = di.define.bind(di);

  Object.defineProperty(di, 'defineCore', {
    configurable: true,
    enumerable: false,
    writable: false,
    value: defineCore,
  });

  Object.defineProperty(di, 'define', {
    configurable: true,
    enumerable: false,
    writable: false,
    value(key, dependenciesOrFactory, maybeFactory) {
      const normalized = normalizeDefineArguments(
        di,
        key,
        dependenciesOrFactory,
        maybeFactory
      );

      return defineCore(
        normalized.key,
        normalized.dependencies,
        normalized.factory
      );
    },
  });

  return di;
}

export default useDefineSyntax;
