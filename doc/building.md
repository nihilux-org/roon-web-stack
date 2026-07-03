# Building from Source

This document describes how to build the roon-web-stack monorepo from source.

## Prerequisites

- **Bun** `1.3.14` (as defined in `package.json`) — See [bun.sh](https://bun.sh) for installation instructions
- **Git** — for cloning the repository

## Monorepo Structure

This project uses Bun workspaces with the following structure:

- `packages/roon-web-model` — Shared TypeScript types/interfaces
- `packages/roon-web-client` — HTTP client library
- `packages/roon-web-eslint` — Shared ESLint config
- `app/roon-web-api` — Backend API (Bun + Hono)
- `app/roon-web-ng-client` — Angular frontend

## Install and Build

Clone the repository and navigate to the project directory:

```bash
git clone https://github.com/nihilux-org/roon-web-stack.git
cd roon-web-stack
```

Install dependencies and build all packages:

```bash
bun install
bun run build
```

## Development Mode

Start the backend in development mode:

```bash
bun run backend
```

## Frontend Watch Mode

Build the client and serve the Angular application with hot reload:

```bash
bun run frontend
```

## Available Commands

| Command            | Description                          |
|--------------------|--------------------------------------|
| `bun install`      | Install dependencies                 |
| `bun run build`    | Build all packages/apps              |
| `bun run lint`     | Lint all packages/apps               |
| `bun run lint:fix` | Lint and auto-fix issues             |
| `bun run test`     | Run all tests                        |
| `bun run ci`       | Full CI: install, build, lint, test  |
| `bun run cd`       | Full CD: as used to build on github  |
| `bun run backend`  | Start backend in dev mode            |
| `bun run frontend` | Build client and serve Angular       |

### Package-Specific Commands

Run commands for a specific package using `--filter`:

```bash
bun run --filter @nihilux/roon-web-api test
bun run --filter @nihilux/roon-web-client lint
```

## Docker Image Build

### Using the release script

The `scripts/local-release.zsh` script builds the Docker image locally. This script requires `docker` and `buildx` to be installed.

Use the `-l` flag for local builds (cannot push to Docker Hub without credentials):

```bash
scripts/local-release.zsh -l
```

See the script for options and default values.

### Using docker build directly

Alternatively, build the Docker image manually:

```bash
docker build -t nihiluxorg/roon-web-stack:latest -f app/roon-web-api/Dockerfile .
```

After building, run the container as described in the [getting-started guide](./getting-started.md).
