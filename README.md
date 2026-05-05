# Dependency-Injection  
### Promise-based Lazy Dependency Resolution Container

A dependency injection container with lazy, promise-based resolution

## Overview

**Dependency-Injection** is a container to define and resolve dependencies for JavaScript/Node applications.

The key feature of this container is that it is designed to support **lazy and asynchronous resolution** of dependencies, allowing to define complex dependencies and execute them as a promise-based expression.

In other words, the container stores lazy dependency resolvers (lazy promise-based execution units). Where each resolver is a lazy promise-based computation that produces a result on demand.

Developers request dependencies via di.get(key), and the container resolves them lazily and asynchronously.

Resolved result can be object, another promise or function (In functional case it can be considered as a **functional computations**, allowing dependencies to describe not only returned data, but also as an executable flows defined by dependencies).

## Synopsis

The format of defining AnyThing (object, functional, class, module, etc) is:

```js
di.define(key, dependencyExpression, factory, options)
```

Where:
- *key* - is a flat string identifier
- *dependencyExpression* - describes dependencies which are needed: how and which dependencies shold be resolved on demand to produce the result. Each dependency is resolved as a promise.

Usually dependencyExpression in an array of dependencies (list of promises). But it can be also a single expression, for example, if there is only one dependency or some another promise-based expression.
 
After dependencie expression is resolved the results will be passed into *factory* as arguments.

- *factory* is a function that produces the result based on resolved dependencies. It can return any value, object, function, or promise. It is executed lazily when the dependency is requested via `di.get(key)`, and it is executed with resolved dependencies as arguments.

- *options* may include lifecycle (e.g. singleton, transient)

Example:

```js

di.define('config', [], () => {
  return { apiUrl: '/api' }
});

di.define('client', ['config'], (config) => {
  return new ApiClient(config.apiUrl)
});

di.define('service', [
  'repository',
  'client',
  di.lazy(loadInitialData),
], (repository, client, initialData) => {
  return new Service(repository, client, initialData)
}, { lifecycle: 'singleton' })
```
---

## Key Features

### 1. Lazy Resolution

Dependencies are **not executed at registration time**.  
They are resolved only when explicitly requested via `di.get(...)`.

This allows:

- fast application startup (define dependencies without executing them)
- on-demand computation (execute dependencies only when needed)
- simplify application logic (by describing dependencies directly 'inplace')
- avoid unnecessary computations (because dependencies execute only when requested or used by other dependencies as a part of their resolution)

---

### 2. Asynchronous Resolution

All dependencies are asynchronous. It is compatible with asynchronous operations (with JavaScript/Node async functions, network APIs, and native promise support).

Resolution excetutes defined dependencies asyncronously, as a promises-based expression, with resolving nested dependencies (as a "domino effect") and allowing to provide the result into another promise or definition.

---

### 3. Functional Dependency Model

Dependencies are not limited to objects.

A dependency can represent:

- a value  
- a service instance  
- a function  
- a computation  
- a full execution flow  

Example:

```js
di.define('fn.fetchUserData', ['clients.userClient'], (client) => {
  return async function fetchUserData(userId) {
    return client.fetchUserData(userId)
  }
})
```

---

### 4. Dependency Expressions

Dependencies are described using **dependency expressions**, allowing flexible composition:

- `di.ref(key)` — reference another dependency
- `di.value(value)` — inject a static value
- `di.lazy(fn)` — lazy execution
- `di.all([...])` — resolve multiple dependencies

Example:

```js
di.define('service', [
  'repo',
  di.value(3000),
  di.lazy(loadConfig)
], (repo, timeout, config) => {
  return new Service(repo, timeout, config)
})
```

---

### 5. Lifecycle Control

Each dependency should be defined with its lifecycle:

- `singleton` — executed once and cached (default behavior)
- `transient` — executed on every resolution


Example:

```js
di.define('logger', [], createLogger, { lifecycle: 'singleton' })
```

Lifecycle support is planned but not fully implemented yet
Now by default all dependencies are singletons (executed once and cached).
Transient lifecycle can be defined now via functional wrapper - fabric that produces a new result on every execution:

```js
function transient(factory) {
  return async function(...args) {
    return factory(...args)
  }
}
```

---

### 6. Declarative Execution

Calling:

```js
await di.get('app.run')
```

triggers resolution of dependencies and execution of the corresponding logic.

The container:

1. Resolves dependencies recursively  
2. Executes them lazily  
3. Builds and executes a dependency chain  
4. Returns the final result  

This allows dependencies to form meaningful execution flows.

---

## Basic Usage

### Define Dependencies

```js
di.define('config', [], () => {
  return { apiUrl: '/api' }
})

di.define('client', ['config'], (config) => {
  return new ApiClient(config.apiUrl)
})
```

---

### Resolve Dependencies

```js
const client = await di.get('client')
```

---

### Functional Execution

```js
di.define('app.run', ['client'], async (client) => {
  await client.initialize()
})

await di.get('app.run')
```

