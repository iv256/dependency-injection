# Architecture

This document describes the current runtime execution architecture
of the *Dependency-Injection* container.

The purpose of this document is to explain:

- how dependency execution works;
- how runtime resolution behaves;
- how dependency graphs are executed;
- how core and extensions interact;
- how lazy resolution is activated.

For terminology definitions see:

- [`glossary.md`](./glossary.md)
- [`README.md`](../README.md)

Planned and future features are described separately in:

- [`roadmap.md`](./roadmap.md)

Examples and fictional shared entities are described in:

- [`examples-index.md`](./examples-index.md)
- [`../examples/README.md`](../examples/README.md)

---

# Architectural Goal

The container is designed as a:

```text
lazy promise-based dependency execution runtime
```

The system is built around executable dependency definitions,
lazy activation, asynchronous resolution, and runtime dependency graphs.

Unlike traditional dependency injection containers focused primarily on object construction,
this container treats dependencies as executable runtime units.

The architecture is designed to support:

- lazy dependency execution;
- asynchronous infrastructure activation;
- executable runtime flows;
- deferred application assembly;
- runtime graph execution.

The system is also designed to remain flexible and minimally intrusive.

The container may coexist with regular JavaScript classes,
functions, modules, and application code that do not know
anything about the container itself.

---

# High-Level Runtime Model

The runtime model is based on the following flow:

```text
di.define(...)
    ↓
Dependency Definition
    ↓
Container Registry
    ↓

di.get(...)
    ↓
Lazy Resolution Handle
    ↓

await / then
    ↓
Resolution Activation
    ↓

Dependency Resolver
    ↓
Dependency Graph Execution
    ↓
Factory Execution
    ↓
Resolved Result
```

---

# Core Runtime Principle

The container separates:

```text
dependency registration
```

from:

```text
dependency execution
```

Dependencies are registered lazily:

```js
di.define(key, dependencies, factory)
```

and executed only after explicit activation:

```js
await di.get(key)
```

More precisely:

```text
di.get(...)
```

returns:

```text
Lazy Resolution Handle
```

Execution starts only after:

```text
await
.then(...)
.catch(...)
.finally(...)
```

activation.

---

# Runtime Execution Pipeline

The runtime execution model consists of several phases.

---

## 1. Definition Phase

A dependency is described through:

```js
di.define(key, dependencies, factory)
```

At this stage:

- nothing is executed;
- dependencies are not resolved;
- factories are not called.

Only metadata is registered.

---

## 2. Registration Phase

The container stores a:

```text
Dependency Definition
```

inside the internal registry.

The stored definition contains:

```text
key
dependencies
factory
options
```

The container stores definitions,
not resolved objects.

---

## 3. Access Phase

A dependency is requested through:

```js
di.get(key)
```

The container returns:

```text
Lazy Resolution Handle
```

At this stage:

- resolution is still not started;
- dependencies are not executed;
- factories are not called.

---

## 4. Activation Phase

Resolution starts only after activation:

```js
await di.get(key)
```

or:

```js
di.get(key).then(...)
```

Activation transfers execution control to the resolver.

---

## 5. Resolution Phase

The resolver:

- loads the dependency definition;
- resolves dependency expressions;
- recursively resolves nested dependencies;
- builds the execution graph;
- prepares resolved dependency results.

Runtime execution forms a dependency graph:

```text
app.config ──┐
             ├── api.client ──┐
logger ──────┘                │
                              ├── user.service ──┐
                              │                  │
                              │                  ├── user ──┐
                              │                  │          │
                              │                  │          ├── user.view
                              │                  │          │
                              │                  │          └── profile.page.view
                              │                  │
                              │                  └── photos ──┐
                              │                               │
                              │                               ├── photo.view
                              │                               │
                              │                               └── profile.page.view
```

The graph is executed lazily and recursively.

---

## 6. Factory Execution Phase

After dependencies are resolved,
the resolver executes the factory:

```text
factory(...resolvedDependencies)
```

Resolved dependency results are passed as factory arguments.

Factories may return:

- object;
- class instance;
- promise;
- function;
- async function;
- executable runtime logic.

---

# Dependency Graph Model

The container internally behaves as a:

```text
lazy executable dependency graph
```

Dependencies form execution chains.

A dependency may trigger execution of:

- nested dependencies;
- asynchronous resources;
- executable flows;
- functional runtime composition.

The execution graph is assembled dynamically during resolution.

---

# Core / Extensions / Composition Root

The project currently uses a:

```text
core + extensions + composition root
```

architecture.

The core runtime owns:

- dependency registration;
- dependency resolution;
- registry management;
- lazy execution semantics;
- runtime graph execution.

Extensions provide optional higher-level behavior around the runtime core.

Examples:

- define syntax helpers;
- class injection;
- future diagnostics;
- future annotation layers.

The public container is assembled through:

```text
src/index.js
```

using explicit extension composition.

Conceptually:

```text
createContainer()
    ↓
createCoreContainer()
    ↓
apply extensions
    ↓
return configured public container
```

---

# References

- [`README.md`](../README.md)
- [`glossary.md`](./glossary.md)
- [`examples-index.md`](./examples-index.md)
- [`../examples/README.md`](../examples/README.md)
- [`roadmap.md`](./roadmap.md)
- [`changelog.md`](./changelog.md)
