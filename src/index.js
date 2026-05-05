import { DIContainer, createContainer } from './di.container.js';

// Default singleton instance for convenience
const di = createContainer();

// Export factory for creating independent containers
export { DIContainer, createContainer };
export default di;
