# Architecture Decisions

This document records architectural decisions and the reasoning behind them.

## Design Decisions

- Container stores **definitions, not instances**
- Keys are **flat strings**, hierarchy is semantic only
- Resolution is **lazy by default**
- Execution is **async promise-based**
- DependencyExpression is the **core abstraction**
- DI is treated as a **special case of lazy dependency resolution**
- The container is **explicit (no magic, no auto-wiring)**
- Registration is expected to happen during **bootstrap phase**
- The system supports both **object-oriented and functional styles**
