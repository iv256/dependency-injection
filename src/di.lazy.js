import lazyPromise from './lazy.promise.js';


/**
 * Executes a factory function once all dependencies are resolved.
 * Works as a wrapper over lazyPromise, injecting resolved dependencies.
 *
 * @param {Promise[]} deps - Array of dependencies (as promises or values)
 * @param {Function} factory - Async function to execute after deps are resolved
 * @returns {LazyPromise}
 */
function lazyPromiseWithDeps(deps, factory) {
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
 * Universal lazy wrapper that decides between lazyPromise and lazyPromiseWithDeps
 * depending on whether the first argument is an array of dependencies or not.
 *
 * @param {Array|string|Function} maybeDeps
 * @param {Function} maybeFactory
 * @returns {Object} lazy promise
 */
export default function lazy(...args) {
  if (
    args.length === 1
    && typeof args[0] === 'function'
  ) {
    // Lazy factory with no dependencies
    return lazyPromiseWithDeps([], ...args);
  } else if (
    args.length === 2
    && Array.isArray(args[0])
    && typeof args[1] === 'function'
  ) {
    // lazy factory with dependencies
    return lazyPromiseWithDeps(...args);
  } else {
    throw new TypeError('Lazy() expects (deps[], factory) or (factory)');
  }
}
