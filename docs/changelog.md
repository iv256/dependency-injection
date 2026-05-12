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

### Notes

- Current behavior is now partially protected before deeper refactoring.
- Lazy resolution semantics are now covered by tests.

---

## v0.3.0 — Core Refactoring

### Progress

- The library architecture was separated into:
  - core;
  - extensions;
  - composition root.

- The core contains the minimal low-level container functionality.
- Extensions provide optional behavior through `useExtension(...)` style composition.
- Composition root performs explicit assembly of the final public container.

#### Core

- Isolated core container architecture
- Introduced `createCoreContainer()`
- Introduced `createContainer()`
- Preserved strict low-level `define(...)`
- Preserved core `get(...)`
- Preserved core `lazy(...)`
- Isolated `lazy.promise` as a low-level primitive

#### Extensions

- Moved flexible define syntax into extension layer
- Moved injector logic into optional extension layer
- Introduced `useDefineSyntax(...)`
- Introduced `useInjector(...)`

#### Composition Root

- Introduced composition root assembly through `src/index.js`
- Core container is now extended through explicit extension composition

### Notes

- The architecture is moving toward a `core + extensions` model.
- The core container is being isolated from optional syntax and tooling layers.
- Extensions extend the core container explicitly through composition.
