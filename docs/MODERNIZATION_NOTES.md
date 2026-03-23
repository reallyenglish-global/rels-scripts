# rels-scripts Modernization Notes

This document records the recent modernization work in `rels-scripts`, the problems it addressed,
and the next improvements worth making.

## Recent improvements

### pnpm migration

The toolchain has been moved onto `pnpm`.

What this improved:

- dependency resolution is now consistent with modern consumer repos
- CI can use `pnpm` caching
- local installs align better with current RELS repository workflows

### CI and packaging compatibility

Recent consumer work exposed a few git-dependency and package-manager seams:

- git-hosted packages with heavyweight `prepare` behavior can break consumer installs under `pnpm`
- consumer repos needed more predictable package-manager behavior during CI and local bootstrap

This was partly addressed in consumer repos and should continue to inform changes here.

### HMR is now opt-in

The webpack dev server now defaults to:

- `hot: false`
- `liveReload: true`

and supports explicit opt-in HMR with:

```bash
RELS_HMR=true rels-scripts start
```

Why this change was needed:

- some consuming apps loaded the webpack dev client while HMR was effectively disabled
- that produced browser console noise:
  - `[HMR] Hot Module Replacement is disabled.`
- live reload was sufficient for the current stack
- disabling HMR by default removed the error without changing runtime behavior

## Known seams and issues

### Hard-coded Husky paths

Some consumer repos still carry hook scripts with machine-specific paths, for example references to
another developer's home directory.

Impact:

- commits can fail on the wrong machine even when code is valid
- toolchain adoption becomes less portable than it should be

Recommendation:

- resolve local binaries dynamically
- avoid absolute home-directory paths in generated or committed hooks

### Deprecated webpack-dev-server options

The current dev-server config still relies on deprecated options such as:

- `https`
- `onBeforeSetupMiddleware`
- `onAfterSetupMiddleware`

Impact:

- noisy startup warnings
- higher maintenance cost when upgrading webpack-dev-server

Recommendation:

- migrate to the modern `server` and `setupMiddlewares` APIs

### Sparse public documentation

Before this doc pass, the repo did not have a top-level README that explained:

- what the package provides
- how consumers should use it
- which env flags matter
- what the expected local workflow is

That gap makes consumer debugging slower than it needs to be.

## Recommended next modernization steps

### 1. Fix Husky path portability

High priority because it affects basic contributor workflow.

Goal:

- no committed hook should depend on a specific machine path

### 2. Add explicit dev-server config tests

High priority because recent regressions were config-level, not app-level.

Good candidates:

- default dev-server mode disables HMR and enables live reload
- `RELS_HMR=true` flips those settings
- rels-assets static directory is included when present

### 3. Replace deprecated dev-server APIs

This will reduce warning noise and make future upgrades easier.

### 4. Document consumer integration contracts

A short doc or README section should cover:

- expected consumer scripts
- asset-serving assumptions
- local HTTPS expectations
- service worker expectations in development vs production

### 5. Re-evaluate whether full HMR is worth supporting

Right now the pragmatic position is:

- default to stable live reload
- allow explicit HMR opt-in

If consumers eventually want real HMR, it should be implemented deliberately and verified across at
least one live host app instead of being left half-enabled.

## Practical guidance for consumer repos

When a consumer app shows asset or startup problems, check these first:

1. Is `node_modules/rels-assets/assets` populated?
2. Is the app route falling through to SPA HTML because a local asset path is missing?
3. Is service worker registration happening in development when it should not?
4. Is the dev server showing HMR console noise because HMR is partially enabled?
5. Are hook failures caused by toolchain paths rather than application code?

These have been the most common recent failure modes.
