# Simple Personal User Page Example

This folder contains examples for the Dependency Injection container.

To make the examples easy to understand, we use one simple demo application: **Personal User Page**.

The goal of this example is not to build a real frontend framework or a complete production application.  
The goal is to have a small, clear, and intuitive project model that helps us demonstrate how the DI container works.

This example will be used in:

- code examples;
- tests;
- documentation;
- comments inside source files;
- future examples for class injection, function injection, lazy dependencies, singleton services, function wrappers, and dependency graphs.

---

## General idea

The demo application represents a simple personal user page.

The application can:

1. load application configuration;
2. create a logger;
3. create an HTTP client;
4. authorize the user;
5. load current user data;
6. load user photos;
7. prepare data for the user page;
8. render a login view;
9. render a user view.

The example is intentionally small.

There are no repositories, routers, stores, settings managers, dashboards, controllers, or complex domain layers.

---

## Main components

The example uses the following components:

```text
Config
Logger
HttpClient

AuthService
UserService
PhotoService

User
Photo[]

LoginView
UserView
```

---

## Component responsibilities

### Config

`Config` contains basic application settings.

Example:

```js
const config = {
  apiBaseUrl: 'https://api.example.com',

  endpoints: {
    login: '/auth/login',
    currentUser: '/users/me',
    currentUserPhotos: '/users/me/photos'
  },

  logLevel: 'debug'
};
```

The config is used by:

```text
Logger
HttpClient
```

---

### Logger

`Logger` is a simple shared service used to log application actions.

It can be used by:

```text
HttpClient
AuthService
UserService
PhotoService
LoginView
```

`UserView` does not need to use `Logger` directly in the basic example.

The view should stay simple.  
It receives prepared data and renders it.

Example:

```js
logger.info('User login started');
logger.info('Current user loaded');
logger.error('Failed to load user photos');
```

---

### HttpClient

`HttpClient` is the transport layer.

It is responsible for sending HTTP requests to a remote server.

It depends on:

```text
Config
Logger
```

It can provide simple methods:

```js
httpClient.get(url);
httpClient.post(url, data);
```

Example dependency:

```text
Config + Logger
  ↓
HttpClient
```

---

### AuthService

`AuthService` is responsible for user authorization.

It depends on:

```text
HttpClient
Logger
```

It can provide methods like:

```js
authService.login(credentials);
authService.logout();
```

Example dependency:

```text
HttpClient + Logger
  ↓
AuthService
```

---

### UserService

`UserService` is responsible for loading the current user.

It depends on:

```text
HttpClient
Logger
```

It can provide a method like:

```js
userService.getCurrentUser();
```

The method returns a `User` object.

Example dependency:

```text
HttpClient + Logger
  ↓
UserService
  ↓
User
```

---

### PhotoService

`PhotoService` is responsible for loading photos of the current user.

It depends on:

```text
HttpClient
Logger
```

It can provide a method like:

```js
photoService.getCurrentUserPhotos();
```

The method returns an array of `Photo` objects.

Example dependency:

```text
HttpClient + Logger
  ↓
PhotoService
  ↓
Photo[]
```

---

### User

`User` is a simple data object.

It does not know anything about the DI container.

It does not use `HttpClient`, `Logger`, or services directly.

Example:

```js
class User {
  constructor({ id, name, email, avatarUrl }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.avatarUrl = avatarUrl;
  }
}
```

---

### Photo

`Photo` is a simple data object.

It also does not know anything about the DI container.

Example:

```js
class Photo {
  constructor({ id, title, url }) {
    this.id = id;
    this.title = title;
    this.url = url;
  }
}
```

---

### LoginView

`LoginView` represents a simple login form.

It depends on:

```text
AuthService
Logger
```

It can call:

```js
authService.login(credentials);
```

Example dependency:

```text
AuthService + Logger
  ↓
LoginView
```

This is acceptable because `LoginView` represents an interactive form.  
It has to call an action when the user submits credentials.

---

### UserView

`UserView` represents the personal user page.

It does not depend on services directly.

It depends only on prepared data:

```text
User
Photo[]
```

Example:

```js
const userView = new UserView(user, photos);
```

The view should only render what it receives.

It should not know:

- how the user was loaded;
- how photos were loaded;
- which HTTP client was used;
- which API endpoints were called;
- which logger was used;
- how dependencies were created.

Example dependency:

```text
User + Photo[]
  ↓
UserView
```

This keeps the view simple and makes the dependency graph more expressive.

---

## Why `UserView` does not depend on services

A view should not be responsible for loading data.

In this example:

```text
UserService loads User.
PhotoService loads Photo[].
UserView renders User and Photo[].
```

This creates a cleaner separation:

```text
Services load data.
Models hold data.
Views render data.
DI connects everything.
```

So instead of this:

```text
UserService + PhotoService + Logger
  ↓
UserView
```

we use this:

```text
UserService
  ↓
User

PhotoService
  ↓
Photo[]

User + Photo[]
  ↓
UserView
```

This is more interesting for the DI container because it shows that a dependency does not always have to be a service.  
A dependency can also be a prepared object, a data model, a list, or the result of an async factory.

---

## Full dependency graph

The whole example can be represented as a simple dependency graph:

```text
Config
  ├── Logger
  └── HttpClient
        ├── AuthService
        │     └── LoginView
        │
        ├── UserService
        │     └── User
        │           └── UserView
        │
        └── PhotoService
              └── Photo[]
                    └── UserView

Logger
  ├── HttpClient
  ├── AuthService
  ├── UserService
  ├── PhotoService
  └── LoginView
```

Or in a more direct form:

```text
config
logger        ← config

httpClient    ← config, logger

authService   ← httpClient, logger
userService   ← httpClient, logger
photoService  ← httpClient, logger

loginView     ← authService, logger

user          ← userService
photos        ← photoService

userView      ← user, photos
```

---

## Application flow

A typical flow looks like this:

```text
User opens the application
  ↓
LoginView is created
  ↓
User submits login form
  ↓
AuthService sends login request through HttpClient
  ↓
Logger logs the login process
  ↓
UserService loads current user through HttpClient
  ↓
PhotoService loads user photos through HttpClient
  ↓
User object is created
  ↓
Photo objects are created
  ↓
UserView is created from User and Photo[]
  ↓
UserView renders user data and photos
```

---

## Why this example is useful

This example is small, but it is enough to demonstrate many DI container features.

It can show:

- simple dependencies;
- single dependencies;
- multiple dependencies;
- shared singleton services;
- async factory functions;
- class construction;
- function injection;
- lazy dependency resolution;
- dependency graph visualization;
- future scoped dependencies;
- clean separation between services and views;
- dependencies that are not only services, but also prepared data objects.

---

## Example DI registration

```js
di.define('config', [], async () => {
  return {
    apiBaseUrl: 'https://api.example.com',

    endpoints: {
      login: '/auth/login',
      currentUser: '/users/me',
      currentUserPhotos: '/users/me/photos'
    },

    logLevel: 'debug'
  };
});

di.define('logger', ['config'], (config) => {
  return new Logger(config.logLevel);
});

di.define('httpClient', ['config', 'logger'], (config, logger) => {
  return new HttpClient(config.apiBaseUrl, logger);
});

di.define('authService', ['httpClient', 'logger'], (httpClient, logger) => {
  return new AuthService(httpClient, logger);
});

di.define('userService', ['httpClient', 'logger'], (httpClient, logger) => {
  return new UserService(httpClient, logger);
});

di.define('photoService', ['httpClient', 'logger'], (httpClient, logger) => {
  return new PhotoService(httpClient, logger);
});

di.define('loginView', ['authService', 'logger'], (authService, logger) => {
  return new LoginView(authService, logger);
});

di.define('user', ['userService'], async (userService) => {
  return userService.getCurrentUser();
});

di.define('photos', ['photoService'], async (photoService) => {
  return photoService.getCurrentUserPhotos();
});

di.define('userView', ['user', 'photos'], (user, photos) => {
  return new UserView(user, photos);
});
```

---

## Example class implementations

### Logger

```js
class Logger {
  constructor(logLevel) {
    this.logLevel = logLevel;
  }

  info(message) {
    console.log(`[INFO] ${message}`);
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }
}
```

### HttpClient

```js
class HttpClient {
  constructor(apiBaseUrl, logger) {
    this.apiBaseUrl = apiBaseUrl;
    this.logger = logger;
  }

  async get(endpoint) {
    this.logger.info(`GET ${this.apiBaseUrl}${endpoint}`);

    return {};
  }

  async post(endpoint, data) {
    this.logger.info(`POST ${this.apiBaseUrl}${endpoint}`);

    return {};
  }
}
```

### AuthService

```js
class AuthService {
  constructor(httpClient, logger) {
    this.httpClient = httpClient;
    this.logger = logger;
  }

  async login(credentials) {
    this.logger.info('Login started');

    return this.httpClient.post('/auth/login', credentials);
  }
}
```

### UserService

```js
class UserService {
  constructor(httpClient, logger) {
    this.httpClient = httpClient;
    this.logger = logger;
  }

  async getCurrentUser() {
    this.logger.info('Loading current user');

    const data = await this.httpClient.get('/users/me');

    return new User({
      id: data.id ?? 1,
      name: data.name ?? 'John Smith',
      email: data.email ?? 'john.smith@example.com',
      avatarUrl: data.avatarUrl ?? '/images/users/john-smith.png'
    });
  }
}
```

### PhotoService

```js
class PhotoService {
  constructor(httpClient, logger) {
    this.httpClient = httpClient;
    this.logger = logger;
  }

  async getCurrentUserPhotos() {
    this.logger.info('Loading current user photos');

    const data = await this.httpClient.get('/users/me/photos');

    return [
      new Photo({
        id: 1,
        title: 'Profile photo',
        url: '/images/photos/profile.png'
      }),
      new Photo({
        id: 2,
        title: 'Vacation photo',
        url: '/images/photos/vacation.png'
      })
    ];
  }
}
```

### User

```js
class User {
  constructor({ id, name, email, avatarUrl }) {
    this.id = id;
    this.name = name;
    this.email = email;
    this.avatarUrl = avatarUrl;
  }
}
```

### Photo

```js
class Photo {
  constructor({ id, title, url }) {
    this.id = id;
    this.title = title;
    this.url = url;
  }
}
```

### LoginView

```js
class LoginView {
  constructor(authService, logger) {
    this.authService = authService;
    this.logger = logger;
  }

  async submit(credentials) {
    this.logger.info('Login form submitted');

    return this.authService.login(credentials);
  }
}
```

### UserView

```js
class UserView {
  constructor(user, photos) {
    this.user = user;
    this.photos = photos;
  }

  render() {
    return {
      title: this.user.name,
      email: this.user.email,
      avatarUrl: this.user.avatarUrl,
      photos: this.photos.map((photo) => ({
        title: photo.title,
        url: photo.url
      }))
    };
  }
}
```

---

## Design principle

The example follows one simple rule:

```text
The DI container creates and connects objects.
The objects themselves do not need to know about the DI container.
```

For example:

```text
UserView knows about User and Photo[].
UserView does not know how User and Photo[] are loaded.

UserService knows about HttpClient.
UserService does not know how HttpClient is created.

HttpClient knows about Config and Logger.
HttpClient does not know how Config and Logger are created.
```

This keeps the code simple and makes dependencies explicit.

---

## Purpose of this example

This example will be used as the common story for the whole `examples` folder.

Every example can focus on one DI feature while keeping the same application model.

For example:

```text
basic/
  demonstrates simple define/get

class-injection/
  demonstrates creating class instances

function-injection/
  demonstrates injecting dependencies into functions

lazy-resolution/
  demonstrates that dependencies are created only when needed

dependency-graph/
  demonstrates how dependencies are connected

scopes/
  demonstrates future scoped dependency behavior
```

The same small application story helps avoid unnecessary cognitive load.

Instead of learning a new domain for every example, the reader only needs to understand one simple idea:

```text
A personal user page with login, user loading, photo loading, and views.
```
