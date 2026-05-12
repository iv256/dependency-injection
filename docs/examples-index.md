# Examples Index

This document describes the shared fictional application
used across examples, tests, documentation, and code comments.

The goal of this document is to keep terminology,
dependency relationships, and example entities consistent
across the project.

The entities described here are intentionally simplified.

They are not part of the dependency injection library itself.
They exist only to demonstrate dependency resolution behavior.

---

# Shared Example Application

The examples use a fictional personal profile application.

The application contains:

- Logger
- AppConfig
- ApiClient
- UserService
- PhotoService
- User
- Photo
- UserView
- PhotoView
- ProfilePageView

The entities are intentionally simple and may appear
in examples, tests, README files, and code comments.

---

# Dependency Relationships

The examples may demonstrate dependency relationships such as:

```text
[AppConfig]
    ↓
[ApiClient]
```

```text
[Logger]
    ↓
[ApiClient]
```

```text
[ApiClient]
    ↓
[UserService]
    ↓
[User]
    ↓
[UserView]
```

```text
[ApiClient]
    ↓
[PhotoService]
    ↓
[Photo]
    ↓
[PhotoView]
```

```text
[UserView] ──→
                [ProfilePageView]
[PhotoView] ──→
```

```text
[Logger]
    ↓
[UserService]
```

```text
[Logger]
    ↓
[PhotoService]
```

The exact dependency graph may differ between examples.

The relationships above describe only the general structure
used across the documentation.

---

# Lazy Resolution Behavior

Examples may demonstrate:

- lazy service initialization;
- deferred API client creation;
- nested dependency resolution;
- asynchronous dependency execution;
- dependency chains;
- runtime object composition.

---

# Example Entity Snippets

The following snippets show approximate examples
of how application entities may look.

These snippets intentionally do not include
dependency injection container definitions or composition logic.

They exist only to provide a shared mental model
for examples and documentation.

---

## Logger

```js
class Logger {
  debug(message) {
    console.debug(message);
  }

  warn(message) {
    console.warn(message);
  }

  error(message) {
    console.error(message);
  }
}
```

---

## AppConfig

```js
const AppConfig = {
  apiBaseUrl: 'https://api.example.com',

  userEndpoint: '/users',
  photoEndpoint: '/photos',

  enableDebug: true,
  requestTimeout: 5000,
};
```

---

## ApiClient

```js
class ApiClient {
  constructor({ config, logger }) {
    this.config = config;
    this.logger = logger;
  }

  async get(url) {
    this.logger.debug(`GET ${url}`);

    return fetch(`${this.config.apiBaseUrl}${url}`);
  }
}
```

---

## UserService

```js
class UserService {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  async getUser(userId) {
    const response = await this.apiClient.get(
      `/users/${userId}`
    );

    return new User(response);
  }
}
```

---

## PhotoService

```js
class PhotoService {
  constructor({ apiClient }) {
    this.apiClient = apiClient;
  }

  async getPhotos(userId) {
    const response = await this.apiClient.get(
      `/users/${userId}/photos`
    );

    return response.map((photo) => {
      return new Photo(photo);
    });
  }
}
```

---

## User

```js
class User {
  constructor(data = {}) {
    this.id = data.id;
    this.name = data.name;
  }
}
```

---

## Photo

```js
class Photo {
  constructor(data = {}) {
    this.id = data.id;
    this.url = data.url;
  }
}
```

---

## UserView

```js
class UserView {
  constructor({ user }) {
    this.user = user;
  }
}
```

---

## PhotoView

```js
class PhotoView {
  constructor({ photos }) {
    this.photos = photos;
  }
}
```

---

## ProfilePageView

```js
class ProfilePageView {
  constructor({
    userView,
    photoView,
  }) {
    this.userView = userView;
    this.photoView = photoView;
  }
}
```
