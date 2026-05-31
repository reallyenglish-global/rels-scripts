# Migrating from Webpack to Vite

## Overview

This guide helps consumer projects migrate from webpack to Vite bundler.

## Quick Start

1. Update your `.env` file:
   ```
   BUNDLER=vite
   ```

2. Test development server:
   ```bash
   npm start
   ```

3. Test production build:
   ```bash
   npm run build
   ```

## Known Differences

### Environment Variables

**Webpack:** `process.env.RELS_*`  
**Vite:** `import.meta.env.VITE_RELS_*` (internally mapped)

Consumer code using `process.env.RELS_*` will continue to work due to the compatibility layer in the Vite configuration.

### Import Syntax

**Webpack:** Supports both CommonJS and ESM  
**Vite:** Prefers ESM, CommonJS supported but slower

**Recommendation:** Prefer `import` over `require` for better performance.

### Dynamic Imports

Both support dynamic imports, but Vite's syntax is stricter:

```javascript
// ✅ Works in both
const Component = await import('./Component')

// ❌ Vite requires literal strings
const path = './Component'
const Component = await import(path) // This won't work

// ✅ Use glob imports for dynamic patterns in Vite
const modules = import.meta.glob('./components/*.js')
```

### Asset Handling

Both handle assets similarly, but with minor differences:

**SVG as React Components:**
- Webpack: `import { ReactComponent as Logo } from './logo.svg'`
- Vite: `import Logo from './logo.svg?react'`

Our configuration maintains webpack compatibility, so the webpack syntax continues to work.

## Troubleshooting

### Issue: Build fails with module resolution error

Vite uses different module resolution. Check:
1. Are all imports using valid paths?
2. Are file extensions correct?
3. Are there any webpack-specific loaders being used directly?

### Issue: Environment variables not working

Ensure variables are prefixed with `RELS_` and defined in `.env` files.

### Issue: Slower build than expected

Check:
1. Is `node_modules/.vite` cache directory being preserved?
2. Are dependencies optimized? Run `vite optimize` manually
3. Are source maps enabled unnecessarily in production?

### Issue: HTTPS certificates not working

Vite reuses the same HTTPS configuration as webpack (`SSL_CRT_FILE` and `SSL_KEY_FILE` environment variables).

### Issue: SVG imports not working

Ensure you're using the standard webpack import syntax:
```javascript
import Logo from './logo.svg'
```

The `?react` suffix is not needed as it's handled automatically.

## Rollback Plan

To switch back to webpack:

1. Remove `BUNDLER=vite` from `.env`
2. Or set `BUNDLER=webpack`
3. Clear cache: `rm -rf node_modules/.vite`

## Performance Comparison

Expected improvements with Vite:
- Dev server cold start: 2-3x faster
- HMR: 5-10x faster (when `RELS_HMR=true`)
- Production build: Similar or slightly faster

Monitor actual performance in your project and report any issues.

## Feature Parity

The following features are supported identically in both webpack and Vite:

- ✅ HTTPS dev server
- ✅ Environment variables from `.env` files (RELS_* prefix)
- ✅ Public folder serving
- ✅ Semantic versioning integration (RELS_*_VERSION, _REVISION, _BRANCH)
- ✅ SVG as React components
- ✅ CSS modules (.module.css, .module.scss)
- ✅ SCSS/SASS preprocessing
- ✅ PostCSS (autoprefixer, flexbugs-fixes, normalize)
- ✅ Production minification (Terser)
- ✅ Code splitting
- ✅ Service worker support (optional, via vite-plugin-pwa)
- ✅ Handlebars templates (.hbs files)
- ✅ rels-assets serving (custom plugin)
- ✅ Proxy support (from package.json)
- ✅ HMR opt-in (RELS_HMR=true)
- ✅ Browserslist compatibility
- ✅ Source maps (configurable via GENERATE_SOURCEMAP)
- ✅ Bundle analysis (--stats flag)

## Reporting Issues

If you encounter any issues with Vite that work correctly with webpack, please report them with:
1. Error message
2. Steps to reproduce
3. Consumer project name (if not confidential)
4. Node.js version
5. Output of `npm ls vite`
