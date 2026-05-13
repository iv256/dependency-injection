# Injector Extension

This document describes the class injector extension used by the dependency-injection container.

The injector is an optional extension. It is not part of the container core.

The core container is responsible for:

- dependency registration;
- lazy dependency resolution;
- dependency graph execution;
- factory execution.

The injector extension is responsible for:

- reading class-level injection metadata;
- resolving required dependency keys through the DI container;
- preparing constructor arguments;
- creating class instances through `new Class(...args)`.

---

# Motivation

Without an injector, every class instance must usually be created through an explicit factory:

```js
di.define('user.view', [
  'user',
], (user) => {
  return new UserView({
    user,
  });
});
```

This is clear and useful for complex runtime composition.

However, in many application layers there may be many similar classes:

- views;
- widgets;
- controllers;
- modal windows;
- small UI components;
- lightweight service objects.

Creating a separate factory for each of them may become repetitive.

The injector allows a class to declare how it should receive dependencies,
and lets a single universal creation mechanism create many different classes.

Instead of writing many factories, a class can declare metadata:

```js
class UserView {
  static diInject = {
    'user': 'user',
  };

  constructor({ user }) {
    this.user = user;
  }
}
```

and then be created through:

```js
const userView = await di.createClassInstance(UserView);
```

This keeps the injector useful for common cases,
while explicit `di.define(...)` factories remain available for complex cases.

---

# Design Position

The injector is not the foundation of the DI container.

The foundation is still:

```text
di.define(...) → di.get(...) → lazy resolution → factory execution
```

The injector is a convenience layer on top of that model.

It is especially useful when many classes follow predictable constructor patterns.

Conceptually:

```text
core container
    ↓
resolved dependencies
    ↓
injector extension
    ↓
constructor arguments
    ↓
class instance
```

---

# Metadata

The modern class metadata field is:

```js
static diInject
```

The deprecated field:

```js
static diKeyMap
```

is still supported as a backward compatibility alias for the default single-argument form.

New code should use `diInject`.

A class must not define both `diInject` and `diKeyMap`.

---

# Two Independent Axes

The injector has two independent design axes.

## 1. Constructor Argument Selection

This axis answers the question:

```text
Which constructor argument should receive the dependency?
```

There are two forms:

```text
single-argument injection
multi-argument injection
```

## 2. Injection Mode

This axis answers the question:

```text
How should the dependency be inserted into the selected argument?
```

There are two modes:

```text
nested-in-argument injection
direct-argument injection
```

Together they form the current injector model:

```text
single-argument + nested-in-argument
multi-argument  + nested-in-argument
multi-argument  + direct-argument
```

---

# Single-Argument Nested Injection

This is the default and most ergonomic form.

Dependencies are injected into the first constructor argument object.

```js
class UserView {
  static diInject = {
    'user': 'user',
  };

  constructor({ user }) {
    this.user = user;
  }
}
```

Usage:

```js
const userView = await di.createClassInstance(UserView);
```

Conceptually this creates:

```js
new UserView({
  user: resolvedUser,
});
```

This form is useful for simple classes that receive one object params argument.

---

# Nested Paths

The target path may be nested.

```js
class UserView {
  static diInject = {
    'user': 'user',
    'logger': 'services.logger',
  };

  constructor(params = {}) {
    this.user = params.user;
    this.logger = params.services.logger;
  }
}
```

Conceptually this creates:

```js
new UserView({
  user: resolvedUser,
  services: {
    logger: resolvedLogger,
  },
});
```

Existing intermediate objects are preserved.

For example, if `services` already exists and contains other keys,
the injector adds only the requested nested path.

The injector does not silently overwrite existing target values.

---

# One Dependency, Multiple Target Paths

The same dependency can be injected into several paths.

```js
class UserView {
  static diInject = {
    'logger': [
      'logger',
      'services.logger',
    ],
  };

  constructor(params = {}) {
    this.logger = params.logger;
    this.serviceLogger = params.services.logger;
  }
}
```

Both paths receive the same resolved dependency instance.

---

# Multi-Argument Nested Injection

Use numeric constructor argument indexes when dependencies must be injected into more than one constructor argument.

```js
class ProfilePageView {
  static diInject = {
    0: {
      'user.view': 'userView',
    },

    1: {
      'photo.view': 'photoView',
    },
  };

  constructor(userArea = {}, photoArea = {}) {
    this.userView = userArea.userView;
    this.photoView = photoArea.photoView;
  }
}
```

Conceptually this creates:

```js
new ProfilePageView(
  { userView: resolvedUserView },
  { photoView: resolvedPhotoView }
);
```

This form should be used only when constructor arguments really have separate meanings.

For a single object params argument, prefer the shorthand form without numeric index keys.

---

# Direct-Argument Injection

A string value at a numeric constructor argument index means direct-argument injection.

The resolved dependency becomes the whole constructor argument value.

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

Conceptually this creates:

```js
new UserService(resolvedApiClient);
```

This is different from the shorthand nested form:

```js
static diInject = {
  'api.client': 'apiClient',
};
```

which creates:

```js
new UserService({
  apiClient: resolvedApiClient,
});
```

The difference is intentional:

```text
non-numeric top-level key
    ↓
dependency key for nested injection into argument 0

numeric top-level key
    ↓
constructor argument index
```

---

# Mixed Nested and Direct Injection

Nested and direct injection can be combined.

```js
class UserService {
  static diInject = {
    0: {
      'app.config': 'config',
    },

    1: 'api.client',

    2: {
      'logger': 'logger',
    },
  };

  constructor(params = {}, apiClient, services = {}) {
    this.config = params.config;
    this.apiClient = apiClient;
    this.logger = services.logger;
  }
}
```

Conceptually this creates:

```js
new UserService(
  { config: resolvedConfig },
  resolvedApiClient,
  { logger: resolvedLogger }
);
```

---

# Deprecated `diKeyMap`

The old metadata name is still supported:

```js
class LegacyUserView {
  static diKeyMap = {
    'user': 'user',
  };
}
```

It is treated as:

```js
class LegacyUserView {
  static diInject = {
    'user': 'user',
  };
}
```

This exists only for compatibility.

New code should use `diInject`.

---

# Implementation Workflow

The injector follows this workflow:

```text
createClassInstance(di, Class, params)
    ↓
validate Class constructor
    ↓
normalizeConstructorInjectionMap(Class)
    ↓
resolve deprecated diKeyMap if needed
    ↓
detect metadata form:
    ├── no metadata
    │       ↓
    │   no injection
    │
    ├── single-argument injection
    │       ↓
    │   normalize to argument 0 nested-in-argument map
    │
    └── multi-argument injection
            ↓
        keep explicit constructor argument indexes
    ↓
detect injection mode for each constructor argument:
    ├── object descriptor
    │       ↓
    │   nested-in-argument injection
    │
    └── string descriptor
            ↓
        direct-argument injection
    ↓
resolve dependencies through di.get(...)
    ↓
prepare constructor args
    ↓
new Class(...args)
```

---

# Validation Rules

The injector validates metadata before creating the class instance.

Important rules:

- `diInject` and deprecated `diKeyMap` must not be used together.
- single-argument and multi-argument metadata formats must not be mixed.
- nested-in-argument injection requires object params containers.
- direct-argument injection cannot overwrite an already provided constructor argument.
- nested target paths cannot overwrite existing values.
- intermediate nested paths must be objects.

Examples of invalid cases:

```js
class InvalidClass {
  static diInject = {
    'user': 'user',
    1: {
      'logger': 'logger',
    },
  };
}
```

This mixes single-argument and multi-argument metadata.

```js
class InvalidClass {
  static diInject = {
    0: 'api.client',
  };
}

await di.createClassInstance(InvalidClass, {
  alreadyProvided: true,
});
```

This tries to inject a direct dependency into an argument that already has a value.

---

# When to Use the Injector

Use the injector when:

- many classes follow similar constructor patterns;
- classes can declare dependency metadata clearly;
- a universal class creation mechanism is more convenient than many factories;
- View-like or component-like classes need different subsets of dependencies.

Prefer explicit `di.define(...)` factories when:

- construction logic is complex;
- the class should not know about DI metadata;
- dependencies require conditional logic;
- the object is part of infrastructure wiring;
- the construction process is important application composition logic.

---

# Related Documents

- [`../architecture.md`](../architecture.md)
- [`../glossary.md`](../glossary.md)
- [`../examples-index.md`](../examples-index.md)
- [`../../examples/README.md`](../../examples/README.md)
