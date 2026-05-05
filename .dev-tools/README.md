# 🛠️ .dev-tools — Development Tooling Overview

This folder `.dev-tools/` contains configuration files for ensure code quality, maintain consistency across the team, and support automation during development, but they are **not** part of the runtime logic of the application.

---

## Folder Structure

```txt
.dev-tools/
├── eslint.config.js       # ESLint configuration for code linting
├── prettier.config.js     # Prettier configuration for formatting
├── jsdoc.json             # JSDoc configuration for documentation generation
├── README.md              # Documentation for the developer tooling setup
```

---

## Functional Overview of Each Tool

### 1. **ESLint (Linter)**

- A **linter** analyzes source code to find programming errors, bugs, stylistic errors, and suspicious constructs.
- ESLint works based on a set of **rules** defined in `eslint.config.js` (Flat Config in ESLint v9+).
- ESLint uses **plugins** like:
  - `eslint-plugin-import` (for organizing imports),
  - `eslint-plugin-jsdoc` (for verifying documentation comments),
  - `eslint-plugin-prettier` (to integrate formatting checks).

**ESLint does not format code by itself** unless explicitly told to do so. It can report issues or fix some with `--fix`.

### 2. **Prettier (Formatter)**

- A **formatter** reprints code with consistent style — indentation, quotes, commas, spacing.
- Prettier is **opinionated**, meaning it enforces a strict and unified style.
- Configured via `.dev-tools/prettier.config.js`.

**Difference from a linter**:
- A **linter** checks for problems or anti-patterns (quality, correctness).
- A **formatter** enforces code appearance.

### 3. **Integration: Linter + Formatter**

- We use `eslint-plugin-prettier` to **run Prettier as part of ESLint**.
- This means: ESLint will **fail** if code is not formatted by Prettier.
- You can run `npm run lint:fix` to apply both fixes and formatting in one step.

### 4. **JSDoc (Documentation Generator)**

- Parses specially formatted comments to generate static HTML documentation.
- Configured in `.dev-tools/jsdoc.json`.
- Output goes to: `doc/jsdoc/` (ignored in Git).
- Triggered via: `npm run doc`.

---

## Scripts in `package.json`

The `scripts` section maps command aliases to actual tool executions:

```json
"scripts": {
  "lint": "eslint . -c .dev-tools/eslint.config.js",
  "lint:fix": "eslint . -c .dev-tools/eslint.config.js --fix",
  "format": "prettier --write . --config .dev-tools/prettier.config.js",
  "doc": "jsdoc -c .dev-tools/jsdoc.json",
  "prepare": "husky install"
}
```

### Explanation:

- `lint`: analyzes all JavaScript files using ESLint
- `lint:fix`: does the same but auto-fixes fixable problems
- `format`: explicitly formats all code using Prettier
- `doc`: generates documentation from JSDoc comments
- `prepare`: used by `husky` to install Git hooks on `npm install`

---

## Pre-commit Hook (Husky + lint-staged)

To ensure code is linted and formatted **before committing**, we use:

```json
"husky": {
  "hooks": {
    "pre-commit": "lint-staged"
  }
}
```

And:

```json
"lint-staged": {
  "**/*.js": [
    "eslint --fix -c .dev-tools/eslint.config.js",
    "prettier --write --config .dev-tools/prettier.config.js"
  ]
}
```

### Result:
- Git will refuse to commit any code that fails linting or formatting.
- Only staged (`git add`) `.js` files are processed.

---

## EditorConfig

The `.editorconfig` file (stored in project root) ensures consistent basic formatting like indentation and line endings across different editors.

```ini
root = true

[*]
charset = utf-8
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
```

---

## Summary of Relationships

| Component       | Defined In                            | Purpose                          |
|----------------|----------------------------------------|----------------------------------|
| ESLint Rules    | `.dev-tools/eslint.config.js`          | Analyze and report code quality |
| Prettier Rules  | `.dev-tools/prettier.config.js`        | Automatically format code        |
| JSDoc Settings  | `.dev-tools/jsdoc.json`                | Generate documentation           |
| Scripts         | `package.json > scripts`               | Provide CLI access               |
| Lint Hooks      | `package.json > husky + lint-staged`   | Auto-check staged files before commit |
| Editor Settings | `.editorconfig`                        | Enforce consistent style in editor |

---

## To Test Everything

```bash
npm run lint         # Check all files
npm run lint:fix     # Fix + format all files
npm run format       # Format entire codebase
npm run doc          # Generate HTML docs in doc/jsdoc/
```

---

This setup ensures:
- Clean, readable, consistently styled code.
- Catching of bugs and anti-patterns before they are committed.
- A solid foundation for scalable and maintainable development.


# Links
 - https://prettier.io/docs/configuration.html (Prettier Configuration)
 - https://github.com/prettier/prettier (Prettier GitHub)