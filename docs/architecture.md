# Architecture

This document describes the current architecture and execution model of the container.

## Purpose

This document describes the **architectural principles and design assumptions** behind the *Dependency-Injection* container.

It is not a full specification, but a concise set of notes that guide how the system is designed and intended to evolve.

---

## Conceptual Model

The system is based on the following idea:

Container stores Dependency Definitions (not objects), and returns resolved values, objects, functions, as a promise. 
Depending on lifecycle (e.g. Singleton or Transient) it may cache results or re-execute definitions on demand

More formally:

Definition describes how to produce a Resolution Result.

DependencyExpression describes how to resolve dependencies and obtain its results as a factory arguments.

Access to contained (via `di.get(key)`) starts lazy resolution of a Definition.

Lifecycle controls caching or re-execution of the Resolution Result.

---

## Core Terminology

### Container

A runtime object that stores dependency definitions and resolves them on demand.

---

### Key

A **string identifier** of a dependency.

- Keys are **flat (single-level)**
- The container is a flat map
- Semantic grouping via `.` is allowed

Example:

services.userService
queries.fetchUserData
app.run

---

### Dependency Definition

A record stored in the container:

key + dependencyExpression + factory + options

It describes how to produce a result.

---

### Dependency Expression

A declarative description of dependencies.

It defines how factory arguments are resolved.

Common forms:

'service.key'        // alias for di.ref('service.key')
di.ref('service.key')
di.value(value)
di.lazy(fn)
di.all([...])

Dependency expressions may be simple or composed and can be extended.

---

### Factory

A function that produces the result of a dependency.

---

### Lifecycle

Controls how often a dependency is executed:

singleton — executed once and cached
transient — executed on every resolution

---

### Resolution

The process of obtaining a result:

await di.get(key)

---

## Define API

Core function:

di.define(key, dependencyExpression, factory, options)

### Parameters

#### key

string

Flat identifier.

---

#### dependencyExpression

DependencyExpression | DependencyExpression[]

Describes dependencies.

---

#### factory

function(...resolvedDeps) → result

Produces the final result.

---

#### options

Metadata:

{
  lifecycle: 'singleton' | 'transient'
}
