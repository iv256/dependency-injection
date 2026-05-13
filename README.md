# Dependency-Injection

### Promise-based Lazy Dependency Resolution Container

A dependency injection container focused on lazy and asynchronous dependency resolution.

---

# Overview

**Dependency-Injection** is a JavaScript/Node.js dependency injection container designed around:

- lazy dependency activation;
- asynchronous dependency resolution;
- promise-based execution;
- executable dependency graphs;
- explicit runtime composition.

The container stores named lazy dependency definitions.

Dependencies are registered through:

```js
di.define(key, dependencies, factory)
```

Dependencies are resolved through:

```js
await di.get(key)
```

Dependencies are not executed during registration.
Resolution starts only after `.then(...)` / `await` activation.

The result of `di.get(...)` is a lazy resolution handle.

This allows dependencies to behave as lazy executable runtime units.

---

# Motivation

Most dependency injection containers are primarily focused on:

- object construction;
- constructor injection;
- service registration;
- synchronous application assembly.

This project explores a different approach.

Here dependencies are treated not only as objects,
but also as:

- asynchronous computations;
- executable functions;
- runtime execution flows;
- lazy promise-based operations.

The container is designed to support scenarios where:

- expensive resources should not initialize during startup;
- asynchronous infrastructure should be activated on demand;
- dependency chains should execute lazily;
- execution should happen only when really needed.

The project is also designed to remain flexible and minimally intrusive.

Dependencies may coexist with regular JavaScript classes,
functions, modules, or application code that knows nothing
about the DI container itself.

The container may inject dependencies into classes,
but it does not require the entire application architecture
to be built around framework-specific abstractions.

---

# Core Resolution Model

The container uses a lazy resolution model:

```text
get() does not resolve.
get() returns a lazy resolution handle.
.then() / await activates resolution.
resolver executes the dependency graph.
```

Example:

```js
const userServiceHandle = di.get('user.service');

// Nothing is executed yet.

const userService = await userServiceHandle;

// Dependency resolution starts here.
```

---

# Dependency Definition

Dependencies are defined through:

```js
di.define(key, dependencies, factory)
```

Example:

```js
di.define('app.config', [], () => {
  return {
    apiBaseUrl: 'https://api.example.com',
    userEndpoint: '/users',
    photoEndpoint: '/photos',
    requestTimeout: 5000,
  };
});


di.define('logger', [], () => {
  return new Logger();
});


di.define('api.client', [
  'app.config',
  'logger',
], (config, logger) => {
  return new ApiClient({
    config,
    logger,
  });
});
```

The factory is executed lazily after dependencies are resolved.

---

# Functional Dependencies

Dependencies are not limited to objects.

A dependency may return:

- object;
- class instance;
- function;
- async function;
- executable runtime logic.

Example:

```js
di.define('format.user.name', [], () => {
  return (user) => {
    return user.name.toUpperCase();
  };
});
```

---

# Injector Extension

The container supports optional constructor argument injection.

Dependencies may be injected through class metadata:

```js
static diInject
```

The old metadata name:

```js
static diKeyMap
```

is deprecated and kept only for backward compatibility.

## Single-argument nested injection

The simplest form injects dependencies into the first constructor argument object.

```js
class UserView {
  static diInject = {
    'user': 'user',
  };

  constructor({ user }) {
    this.user = user;
  }
}

const userView = await di.createClassInstance(UserView);
```

This is equivalent to creating:

```js
new UserView({
  user: resolvedUser,
});
```

## Multi-argument and direct injection

The injector can also inject dependencies into specific constructor arguments.

```js
class ApiClient {
  static diInject = {
    0: {
      'app.config': 'config',
      'logger': 'logger',
    },
  };

  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
  }
}
```

A string value at a numeric argument index means direct-argument injection:

```js
class UserService {
  static diInject = {
    0: 'api.client',
  };

  constructor(apiClient) {
    this.apiClient = apiClient;
  }
}
```

This is equivalent to creating:

```js
new UserService(resolvedApiClient);
```

Nested and direct injection can be combined:

```js
class ProfilePageView {
  static diInject = {
    0: {
      'user.view': 'userView',
      'photo.view': 'photoView',
    },
  };

  constructor({ userView, photoView }) {
    this.userView = userView;
    this.photoView = photoView;
  }
}
```

The injector extension remains optional.
Regular classes may exist without any DI-specific metadata.

---

# Architecture

The project currently uses a:

```text
core + extensions + composition root
```

architecture.

## Core

The core container provides:

- low-level dependency registration;
- dependency resolution;
- lazy promise execution;
- registry management.

## Extensions

Optional extensions provide higher-level behavior:

- define syntax extensions;
- constructor injector extensions;
- future annotation layers;
- future tooling and helpers.

## Composition Root

The public container is assembled through:

```text
src/index.js
```

using explicit extension composition.

---

# Examples

Executable examples are available in:

[`examples/`](./examples/)

Shared fictional application entities are described in:

[`docs/examples-index.md`](./docs/examples-index.md)

---

# Documentation

- [`docs/architecture.md`](./docs/architecture.md)
- [`docs/glossary.md`](./docs/glossary.md)
- [`docs/roadmap.md`](./docs/roadmap.md)
- [`docs/changelog.md`](./docs/changelog.md)
- [`examples/README.md`](./examples/README.md)

---

# Roadmap

The project is still evolving.

Planned future directions include:

- dependency expressions;
- diagnostics and debugging tools;
- lifecycle support;
- annotation-based extensions;
- build-time integration.

See:

[`docs/roadmap.md`](./docs/roadmap.md)
