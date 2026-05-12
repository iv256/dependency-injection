# Glossary

This document describes the core concepts and terminology used in the dependency-injection library.

---

# Core Concepts

## Dependency Injection Container

A runtime system that stores, resolves, and executes named lazy dependencies.

The container is built around lazy asynchronous dependency resolution and dependency graph execution.

---

## Dependency Graph

A graph of dependencies connected through named definitions.

Dependencies may depend on other dependencies, forming executable lazy resolution chains.

Resolution of one dependency may trigger resolution of other dependencies.

---

## Lazy Resolution

A resolution approach where dependencies are not executed immediately.

Dependency execution starts only after explicit activation through `.then(...)`, `.catch(...)`, or `.finally(...)`.

---

# Public API Concepts

## define(...)

Registers a named dependency inside the container.

`define(...)` describes:

- dependency key;
- dependency expression;
- factory;
- optional lifecycle configuration.

A definition becomes part of the dependency graph.

Example:

```js
 di.define(key, dependencies, factory)
```

---

## get(...)

Returns a lazy resolution handle for a dependency.

`get(...)` itself does not execute dependency resolution.

Resolution starts only after lazy handle activation.

Example:

```js
 di.get(key)
```

---

## lazy(...)

Creates a lazy thenable object.

Used to defer execution until explicit activation.

Example:

```js
 di.lazy(factory)
```

---

# Runtime Concepts

## Dependency Definition

A developer-defined dependency description created through `define(...)`.

A dependency definition describes:

- key;
- dependency expression;
- factory;
- optional metadata.

A dependency definition becomes part of the dependency graph after registration.

---

## Resolvable Unit

A named lazy executable unit registered inside the dependency graph.

A resolvable unit is defined through:

```js
 di.define(key, dependencies, factory)
```

Where:

- `key` gives the unit a unique name inside the registry;
- `dependencies` describe what must be resolved before execution;
- `factory` describes the executable logic of the unit.

The factory function represents arbitrary developer-defined code.

The developer may use it to:

- create objects;
- execute computations;
- call APIs;
- initialize services;
- execute async operations;
- return values;
- run arbitrary application logic.

The factory is executed by the Dependency Resolver after dependency resolution is completed.

Resolved dependencies are passed into the factory as arguments.

Example:

```js
 factory(...resolvedDependencies)
```

A resolvable unit becomes part of the dependency graph after registration through `define(...)`.

---

## Dependency Node

An internal runtime representation of a registered resolvable unit.

Dependency nodes are stored inside the dependency registry.

A dependency node may contain:

- dependency key;
- normalized dependency expression;
- factory reference;
- lifecycle metadata;
- cache state;
- execution metadata.

---

## Dependency Registry

A storage system that maps dependency keys to dependency nodes.

Example:

```text
 key -> DependencyNode
```

---

## Dependency Expression

A normalized description of dependencies required for resolution.

Dependency expressions may contain:

- references to other dependencies;
- lazy computations;
- static values;
- grouped dependency expressions.

---

## Lazy Resolution Handle

A lazy thenable object returned by `di.get(...)`.

The handle represents deferred access to dependency resolution.

The handle itself does not perform resolution until activated.

---

## Resolution Trigger

An operation that activates lazy dependency resolution.

Usually triggered through:

```js
 .then(...)
 .catch(...)
 .finally(...)
```

---

## Dependency Resolver

A runtime component responsible for dependency resolution and resolvable unit execution.

The resolver:

1. loads dependency definition;
2. resolves dependency expression;
3. resolves nested dependencies;
4. executes the resolvable unit factory and passes resolved dependencies into it as arguments;
5. stores cache if needed;
6. returns final result.

The resolver activates execution only after lazy resolution activation through a resolution trigger.

---

# Resolution Lifecycle

## Definition Phase

```js
 di.define(...)
```

Creation of dependency definition.

---

## Registration Phase

Storage of dependency node inside registry.

---

## Access Phase

```js
 di.get(key)
```

Requesting dependency access.

---

## Activation Phase

Lazy handle activation through:

```js
 .then(...)
 .catch(...)
 .finally(...)
```

---

## Resolution Phase

Dependency expression resolution.

---

## Factory Execution Phase

Factory execution using resolved dependencies.

Example:

```js
 factory(...resolvedDependencies)
```

---

# Architectural Concepts

## Core

The minimal low-level dependency container implementation.

The core contains:

- define;
- get;
- lazy;
- registry;
- resolver;
- lazy.promise primitive.

---

## Extension

An optional module that extends the core container behavior.

Extensions are attached explicitly.

Example:

```js
 useDefineSyntax(di)
 useInjector(di)
```

---

## Composition Root

A module responsible for assembling the final container configuration.

The composition root connects:

- core container;
- extensions;
- public container API.
