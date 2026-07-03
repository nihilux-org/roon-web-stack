# roon-web-ng-client

Angular 22+ frontend for the Roon Web Stack application. This client provides a web-based interface to control and interact with Roon audio systems.

## Overview

This application is built with Angular 22 and Angular Material, providing a responsive UI for browsing Roon zones, controlling playback, managing queues, and configuring settings.

## Project Structure

```
src/app/
├── components/     # 24 UI components (nr- prefix)
├── services/       # 13 services for state management & Roon communication
└── model/          # TypeScript interfaces and types
```

### Components

All components use the `nr-` selector prefix. Key component categories:

- **Zone Components**: `nr-zone-container`, `nr-zone-player`, `nr-zone-volume`, `nr-zone-queue`, `nr-zone-selector`
- **Dialog Components**: `nr-settings-dialog`, `nr-zone-queue-dialog`, `nr-zone-grouping-dialog`, `nr-zone-transfer-dialog`, `nr-roon-browse-dialog`
- **Feature Components**: `nr-custom-actions-manager`, `nr-custom-action-recorder`, `nr-custom-action-editor`, `nr-full-screen-toggle`
- **Utility Components**: `nr-roon-image`, `nr-roon-browse-list`, `nr-extension-not-enabled`

### Services

Core services handle:

- Backend communication communication (`roon.service.ts`, `roon.worker.ts`)
- Settings persistence (`settings.service.ts`)
- Volume control (`volume.service.ts`)
- Dialog management (`dialog.service.ts`)
- Idle/visibility detection (`idle.service.ts`, `visibility.service.ts`)
- Fullscreen mode (`fullscreen.service.ts`)
- Custom actions (`custom-actions.service.ts`)

## Available Scripts

| Command | Description |
| ------- | ----------- |
| `bun run serve` | Start development server |
| `bun run build` | Build for production |
| `bun run test` | Run unit tests |
| `bun run test:coverage` | Run tests with coverage |
| `bun run test:watch` | Run tests in watch mode |
| `bun run lint` | Run ESLint |
| `bun run lint:fix` | Run ESLint and auto-fix |

## Development Server

From the monorepo root:

```bash
bun run frontend
```

Or from this directory:

```bash
bun run serve
```

Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### API Proxy

The dev server is configured to proxy `/api` requests to `localhost:3000/api`. Start the backend in dev mode for full functionality:

```bash
bun run backend
```

## Using the Angular CLI

To generate new components from the monorepo root:

```bash
bun run --filter @nihilux/roon-web-ng-client ng g c components/my-component
```

Or from this directory:

```bash
bun run ng g c components/my-component
```

## Further Help

For Angular CLI commands and options, see the [Angular CLI Reference](https://angular.dev/tools/cli).

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md).
