# rels-scripts

Shared toolchain scripts for RELS repositories.

This package provides the common development, test, lint, formatting, build, and dev-server
behavior used by projects such as `rels-lib` and `rels-web`.

## Requirements

- Node.js `>=20`
- Package manager: `pnpm`

## What it provides

- `rels-scripts start`, `rels-scripts dev`, or `rels-scripts serve`
  - Vite development server by default
- `rels-scripts build`
  - production build pipeline
- `rels-scripts test`
  - repo test runner
- `rels-scripts lint`
  - repo lint runner
- `rels-scripts format`
  - repo formatting runner
- `rels-scripts commit-msg`
  - conventional commit validation
- `rels-scripts init`
  - local repo bootstrap for Husky/editor setup

## Common consumer usage

Typical consuming repo scripts look like:

```json
{
  "scripts": {
    "start": "rels-scripts start",
    "build": "rels-scripts build",
    "test": "rels-scripts test",
    "lint": "rels-scripts lint",
    "format": "rels-scripts format",
    "prepare": "rels-scripts init"
  }
}
```

## Dev server behavior

The webpack development server is configured for RELS-style local development:

- HTTPS is enabled
- static assets can be served from `public/`
- `node_modules/rels-assets/assets` is served when present
- history API fallback is enabled for app routes

### HMR

Hot Module Replacement is now opt-in.

Default behavior:

- `hot: false`
- `liveReload: true`

Opt in with:

```bash
RELS_HMR=true rels-scripts start
```

This exists because some consumers were loading the webpack dev client with HMR effectively
disabled, which created browser console noise without any real development benefit.

## Bundler Selection

`rels-scripts` supports both **Vite** (default) and **webpack** as a compatibility bundler.

### Using Vite (default)

```bash
npm run dev
npm run build
```

### Using webpack compatibility mode

```bash
BUNDLER=webpack npm start
BUNDLER=webpack npm run build
```

Vite is now the default. Existing consumers can force webpack temporarily with
`BUNDLER=webpack` while they complete migration.

### Vite-specific features

- Faster cold start in development (2-3x improvement)
- Faster HMR when `RELS_HMR=true` (5-10x improvement)
- Native ESM support
- Better tree-shaking in production

### Webpack vs Vite compatibility

Both bundlers support:
- HTTPS dev server
- Environment variables from `.env` files (RELS_* prefix)
- SVG as React components
- CSS/SCSS modules
- Public folder serving
- Service workers (optional)
- Semantic versioning integration
- Handlebars templates
- rels-assets serving
- Proxy support

For migration guidance and troubleshooting, see [docs/VITE_MIGRATION.md](docs/VITE_MIGRATION.md).

## Local verification

Run the rels-scripts smoke tests:

```bash
npm test
```

Useful local commands:

```bash
npm test
npm run lint
npm run format
```

## Notes for consumers

- Git-hosted consumers should avoid relying on package-level `prepare` scripts for heavyweight setup.
- If a consumer needs repo bootstrap, prefer an explicit local script such as `setup` or `init`.
- If local asset URLs fall through to SPA HTML, check that the consuming repo has populated
  `node_modules/rels-assets/assets`.

## Further reference

See [docs/MODERNIZATION_NOTES.md](/Users/joeyw/public_html/rels-scripts/docs/MODERNIZATION_NOTES.md)
for recent improvements, known seams, and next modernization work.
