import { DIContainer, createContainer as createCoreContainer } from './di.container.js';
import { useInjector } from './di.injector.js';

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

export { DIContainer, createCoreContainer, useInjector };
export default di;
