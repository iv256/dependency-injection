/**
 * Dependency Injection library public composition root.
 *
 * This module assembles the public DI container API by composing:
 *
 * - the core DI container implementation;
 * - optional extensions;
 * - the default public container instance.
 *
 * The core container itself remains independent from extensions.
 * Extensions are attached externally during container assembly.
 * 
 */

import { DIContainer } from './core/di.container.js';
import { useInjector } from './extensions/injector/index.js';


/**
 * Creates a new DI container instance.
 *
 * @returns {DIContainer} New DI container instance.
 */
export function createCoreContainer() {
  return new DIContainer();
}


/**
 * Creates a public DI container instance with default extensions applied.
 *
 * The core DIContainer class stays independent from optional extensions.
 * This factory assembles the default public container by creating the core
 * container first and then applying external extensions to it.
 *
 * @returns {DIContainer} DI container instance with default extensions.
 */
export function createContainer() {
  const container = createCoreContainer();

  useInjector(container);

  return container;
}


// Default singleton instance for convenience.
const di = createContainer();

export {
  DIContainer, 
  useInjector,
};

export default di;
