# @nihilux/roon-web-model

A simple package to hold the `.d.ts` typing the common part of this repo.

Nothing more, nothing less.

Used as a devDependency to ensure `types` coherence between the [API](../../app/roon-web-api/README.md), the [client](../roon-web-client/README.md) and the [web app](../../app/roon-web-ng-client/README.md).

## Exports

This package exports type definitions from three main modules:

- **`api-model`** - TypeScript interfaces and types for the backend API
- **`client-model`** - TypeScript interfaces and types for the HTTP client
- **`roon-kit`** - Roon-related types, copied from [Stevenic/roon-kit](https://github.com/Stevenic/roon-kit) with modifications

## Attribution

**This module includes sources copied from [Stevenic/roon-kit](https://github.com/Stevenic/roon-kit).**

See the [README](./src/roon-kit/README.md) in the `roon-kit` folder for more info.

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for how to contribute.
