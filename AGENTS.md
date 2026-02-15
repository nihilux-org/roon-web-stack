# AGENTS.md

Guidelines for agentic coding agents working in this repository.

## Project Overview

This is a **Bun monorepo** using workspaces. It contains:

- **packages/roon-web-model** - Shared TypeScript types/interfaces
- **packages/roon-web-client** - HTTP client library
- **packages/roon-web-eslint** - Shared ESLint config
- **app/roon-web-api** - Backend API (Bun + Hono)
- **app/roon-web-ng-client** - Angular frontend

**Bun version:** `1.3.9` (enforced in package.json)

---

## Build/Lint/Test Commands

### Root-Level Commands

```bash
bun install                    # Install dependencies
bun run build                  # Build all packages/apps
bun run lint                   # Lint all packages/apps
bun run lint:fix               # Lint and auto-fix
bun run test                   # Run all tests
bun run ci                     # Full CI: install, build, lint, test
bun run backend                # Start backend in dev mode
bun run frontend               # Build client and serve Angular
```

### Package-Specific Commands

Run from package directory or use `--filter`:

```bash
bun run --filter @nihilux/roon-web-api test
bun run --filter @nihilux/roon-web-client lint
```

### Running a Single Test

**Vitest (API and client packages):**

```bash
# Run specific test file
bun run vitest run path/to/specific.test.ts

# Run tests matching pattern
bun run vitest run -t "test name pattern"

# Watch mode
bun run vitest watch path/to/specific.test.ts
```

**Angular/Vitest:**

```bash
cd app/roon-web-ng-client
bun run ng test --include="**/specific.component.spec.ts"
```

---

## Code Style Guidelines

### Prettier Configuration

- **Quotes:** Double quotes (`"`)
- **Semicolons:** Required
- **Arrow parens:** Always
- **Trailing commas:** ES5
- **Bracket spacing:** true

### ESLint Rules

- **Import sorting:** Auto-sorted via `eslint-plugin-simple-import-sort`
- **Unused imports:** Automatically removed
- **Console:** Forbidden (use logger instead)
- **Type checking:** Strict TypeScript rules enabled

### Import Order (Enforced)

Imports are auto-sorted in this order:

1. **Mocks first** - Files matching `@mock*` or `*.mock*`
2. **External packages** - Third-party modules
3. **Internal via aliases** - Path aliases like `@infrastructure`, `@data`, `@service`
4. **Relative imports** - `./` and `../`

Example:

```typescript
import { nanoidMock } from "@mock";
import { clientManagerMock } from "../service/client-manager.mock";

import { Subject } from "rxjs";
import { Hono } from "hono";

import { logger } from "@infrastructure";
import { clientManager } from "@service";
import { Command } from "@nihilux/roon-web-model";

import { handleCommand } from "./command-handler";
```

### Path Aliases

**API (`app/roon-web-api`):**

- `@infrastructure` → `src/infrastructure`
- `@data` → `src/data`
- `@mock` → `src/mock`
- `@service` → `src/service`
- `@roon-kit` → `src/roon-kit`
- `@router` → `src/router`

**Client (`packages/roon-web-client`):**

- `@mock` → `src/mock`

**Angular (`app/roon-web-ng-client`):**

- `@components/*` → `src/app/components/*`
- `@services/*` → `src/app/services/*`
- `@model` → `src/app/model`

### Naming Conventions

| Type                     | Convention         | Example                      |
| ------------------------ | ------------------ | ---------------------------- |
| Variables/functions      | `camelCase`        | `clientId`, `getZone`        |
| Classes/interfaces/types | `PascalCase`       | `ClientManager`, `ZoneState` |
| Constants                | `UPPER_SNAKE_CASE` | `DEFAULT_PORT`               |
| Files                    | `kebab-case`       | `client-manager.ts`          |
| Test files               | `*.test.ts`        | `api-router.test.ts`         |
| Mock files               | `*.mock.ts`        | `client-manager.mock.ts`     |
| Angular selectors        | `nr-prefix`        | `nr-zone-player`             |

### Error Handling

- Use typed catch: `(err: unknown)`
- Log errors via logger: `logger.error(err, "context message")`
- Never use `console.log/error/warn`

### Comments

- **DO NOT add comments** unless explicitly requested
- Code should be self-documenting

---

## Testing Guidelines

### Vitest Configuration (API & Client)

- **Globals:** Enabled (use `describe`, `it`, `expect`, `vi` without imports)
- **Coverage provider:** Istanbul
- **Coverage thresholds:**
  - API: 100% (statements, branches, functions, lines)
  - Client: 100% lines, 98% branches

### Coverage Exclusions

Files excluded from coverage:

- `src/index.ts` - Entry points
- `src/build.ts` - Build scripts
- `src/**/*.mock.ts` - Mock files
- `src/**/*.test.ts` - Test files
- `src/roon-kit/**/*` - Vendored code
- `src/infrastructure/logger.ts` - Logging setup
- `src/infrastructure/host-info.ts` - Host config
- `src/router/app-router.ts` - Bun-specific static serving

### Mock Pattern

```typescript
// src/service/client-manager.mock.ts
import { Mock } from "vitest";

const register: Mock = vi.fn();
const unregister: Mock = vi.fn();

export const clientManagerMock = { register, unregister };

vi.mock("./client-manager", () => ({
  clientManager: clientManagerMock,
}));
```

### Test Pattern

```typescript
// Mock imports FIRST
import { clientManagerMock } from "../service/client-manager.mock";

// External imports
import { beforeEach, describe, expect } from "vitest";

// Internal imports
import { apiRouter } from "./api-router";

describe("module test suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should do something", async () => {
    const res = await apiRouter.request("/endpoint", { method: "GET" });
    expect(res.status).toBe(200);
  });
});
```

---

## Important Notes

## Important Rules

1. **Never use `console.log/warn/error`** - Use `logger` from `@logger`
2. **No unused imports** - ESLint will error; use `lint:fix` to auto-remove
3. **Always handle errors** - Catch, log, and throw appropriate custom errors
4. **Update session cookies** - After session operations, call `c.set("sessionCookie", newValue)`
5. **Environment config** - Access via `environment` from `@environment`, never `process.env` directly
6. **Type exports** - Use barrel files (`index.ts`) to re-export from modules
7. **Relative imports** - Include `.ts` extension for same-module imports
8. **NEVER fix linter issues by disabling rules** - ALWAYS fix the issue
9. **ALWAYS validate changes via tests and lint**
10. **ALWAYS Maintain code coverage to configured threshold:** ALWAYS add test when adding features

### Commits

- **Conventional commits required** - Use `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, etc.
- **Squash on merge** enabled

### Before Submitting PR

1. Run `bun run lint` - Fix all errors
2. Run `bun run test` - All tests must pass with coverage thresholds met
3. CI must pass (runs on every PR)

### Files Not to Modify

- `src/roon-kit/**/*` - Vendored from external source, keep as-is
- `*.mock.ts` files in `src/mock/` - Global mocks, modify carefully

### CI/CD

- CI workflow: `.github/workflows/ci.yml`
- Runs: `bun install --frozen-lockfile`, `build`, `lint`, `test`
- CD workflow: `.github/workflows/cd.yml` (Docker image publishing)
