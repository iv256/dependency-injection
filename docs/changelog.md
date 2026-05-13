# Changelog

This document describes major development progress and architectural changes across roadmap stages.

---

## v0.1.0 — Initial Working Version

### Progress

- Implemented basic `di.define(...)`
- Implemented basic `di.get(...)`
- Implemented `lazy.promise` lazy thenable primitive
- Implemented `di.lazy(...)`
- Implemented lazy promise-based dependency resolution
- Implemented dependency chain resolution
- Implemented async factory support
- Added initial examples
- Added initial architecture and README documentation

### Notes

- The container is built around lazy thenable dependency resolution.
- Dependencies are resolved only after `.then(...)` activation.
- `lazy.promise` became the foundation of lazy dependency execution.

---

## v0.2.0 — Test Coverage

### Progress

- Added tests for core `define(...)`
- Added tests for core `di.get(...)`
- Added tests for `lazy.promise`
- Added tests for `di.lazy(...)`
- Added tests for lazy execution semantics
- Added tests for dependency chain resolution
- Added tests for async factories
- Added tests for syntax validation
- Added tests for class injector behavior
- Added tests for constructor injection edge cases

### Notes

- Current behavior is now partially protected before deeper refactoring.
- Lazy resolution semantics are now covered by tests.

---

## v0.3.0 — Core Refactoring and Injector Evolution

### Progress

- Separated architecture into:
  - core;
  - extensions;
  - composition root.

#### Core

- Introduced `createCoreContainer()`
- Introduced `createContainer()`
- Isolated `lazy.promise`
- Preserved strict low-level `define(...)`
- Preserved core `get(...)`

#### Extensions

- Introduced `useDefineSyntax(...)`
- Introduced `useInjector(...)`
- Moved injector logic into optional extension layer

#### Injector Evolution

- Introduced `diInject`
- Preserved deprecated `diKeyMap`
- Introduced multi-argument constructor injection
- Introduced nested-in-argument injection
- Introduced direct-argument injection
- Added injection descriptor validation
- Added nested path conflict validation
- Added direct injection conflict validation
- Improved injector normalization pipeline
- Improved injector runtime documentation
- Added implementation workflow documentation

#### Composition Root

- Introduced explicit extension composition through `src/index.js`

### Notes

- The architecture is moving toward a `core + extensions` model.
- The injector evolved into a constructor argument composition engine.
