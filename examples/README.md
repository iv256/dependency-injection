# Examples

This directory contains executable examples demonstrating
various dependency injection scenarios.

The examples use the shared fictional application described in:

```text
../docs/examples-index.md
```

Shared example entities are located in:

```text
./shared/
```

The examples use the public DI container created through
the composition root:

```js
createContainer()
```

This means that examples use:

- the core DI container;
- define syntax extensions;
- injector extensions;
- the default public container configuration.

Each example demonstrates a separate dependency resolution scenario.

---

# Available Examples

## simple.dependency.js

Demonstrates:

- single dependency registration;
- lazy resolution handle behavior;
- delayed factory execution.

Run:

```bash
npm run example:simple-dependency
```

---

## dependency.list.js

Demonstrates:

- multiple dependencies;
- dependency list resolution;
- object creation using several dependencies.

Run:

```bash
npm run example:dependency-list
```

---

## dependency.chain.js

Demonstrates:

- dependency chains;
- nested dependency resolution;
- runtime object graph execution.

Run:

```bash
npm run example:dependency-chain
```

---

## functional.dependency.js

Demonstrates:

- executable functional dependencies;
- dependencies returning functions;
- functional runtime composition.

Run:

```bash
npm run example:functional-dependency
```

---

## class.injection.js

Demonstrates:

- class injection;
- static `diKeyMap`;
- constructor param injection;
- automatic dependency resolution during class creation.

Run:

```bash
npm run example:class-injection
```
