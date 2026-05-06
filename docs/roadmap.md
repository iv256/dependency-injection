# Project Roadmap

This document describes the planned evolution of the dependency-injection library across versions.

---

## v0.1.0 — Initial Working Version

**Goal:**  
Stabilize and preserve the current working implementation.

**Scope:**

- Basic `di.define(...)`
- Basic `di.get(...)`
- Lazy promise-based execution
- Basic dependency resolution via arrays
- Initial examples in `examples/`
- Initial README and architecture documentation

**Status:** Mostly Completed

---

## v0.2.0 — Test Coverage

**Goal:**  
Protect current behavior with automated tests before further refactoring.

**Scope:**

- Tests for lazy execution (`lazyPromise`)
- Tests for `di.define(...)`
- Tests for `di.get(...)`
- Tests for dependency resolution
- Tests for async factories
- Tests for functional dependency results

**Status:** Mostly Completed

---

## v0.3.0 — Core Refactoring

**Goal:**  
Separate the core system from utilities and optional features.

**Scope:**

- Extract container core logic
- Isolate lazy promise primitive
- Separate dependency resolution logic
- Define clear public API boundaries
- Keep injector (class-based injection) as an optional layer

**Status:** Planned

---

## v0.4.0 — Dependency Expressions

**Goal:**  
Introduce and formalize dependency expressions as a core abstraction.

**Scope:**

- `di.ref(key)`
- String key as alias for `di.ref(key)`
- `di.value(value)`
- `di.lazy(fn)`
- `di.all([...])`
- Expression normalization pipeline
- Expression execution pipeline

**Status:** Planned

---

## v0.5.0 — Diagnostics and Debugging

**Goal:**  
Provide visibility into dependency resolution and execution.

**Scope:**

- List registered dependencies
- Inspect dependency by key
- Show resolution status
- Show cache status
- Basic execution trace
- Console-friendly debug output

**Status:** Planned

---

## v0.6.0 — Lifecycle Options

**Goal:**  
Introduce explicit lifecycle behavior for dependencies.

**Scope:**

- Reserved `options.lifecycle`
- `singleton` (default behavior)
- `transient`
- Lifecycle documentation
- Tests for lifecycle behavior

**Status:** Planned

---

## Future — Annotation / Build-time Layer

**Goal:**  
Prepare an optional annotation-based layer on top of the runtime container.

**Scope:**

- Metadata format for annotations
- Decorator syntax exploration
- Build-time extraction of dependency definitions
- Application context generation
- Integration with module systems

**Status:** Future
