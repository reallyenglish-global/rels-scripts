# rels-scripts Overview

`rels-scripts` is a thin CLI wrapper that standardises how the rels-* family of React applications lint, test, format, and build code. It exposes a stable interface (`pnpm exec rels-scripts <task>`) that can be dropped into any project so teams avoid copying boilerplate from create-react-app and keep their tooling aligned.

## Key Directories
- `bin/` – entry point (`bin/rels-scripts.js`) that proxies a task argument to the matching file under `scripts/`.
- `scripts/` – task implementations (build, start, lint, format, test, init, vscode, hooks). Each script bootstraps node env vars, wires configs from the `config/` folder, and then shells out with `cross-spawn`.
- `config/` – shared configuration for Babel/Webpack/eslint/prettier/mocha plus helper utilities like `paths.js`, `env.js`, and `versioning.js` for semantic-release metadata.
- `util/` – thin helpers consumed by webpack/babel configs.

## CLI Tasks
### init
- Installs husky/commitlint hooks via `scripts/hooks.js` and configures `.vscode/settings.json` via `scripts/vscode.js`.
- Updates the consumer's `package.json` with rels-standard scripts and semantic-release defaults. The script no-ops inside CI.

### start
- Spins up a webpack dev server using configs exported from `config/webpack.config` and `config/webpackDevServer.config`.
- Forces `BABEL_ENV`/`NODE_ENV` to `development`, verifies `public/index.html` + `src/index.js` exist, then auto-opens the browser (HTTPS only) once compilation succeeds.

### build
- Calls `config/versioning.js` first so semantic-release metadata (git tag/head/branch) is injected into the build environment.
- Runs a production webpack build, prints bundle stats (warning if gzipped bundles exceed 512/1024 KB), copies everything from `public` except `index.html`, and optionally writes `bundle-stats.json` when `--stats` is provided.

### test
- Forces mocha into watch mode locally (`--watch` is skipped in CI), wires `config/.mocharc.js`, and spawns `pnpm exec mocha`.

### lint
- Runs eslint with the shared config (`config/.eslintrc.js`) over `src/**/*.js(x)` while keeping `NODE_ENV=BABEL_ENV=development` for Babel parser compatibility.

### format
- Runs prettier with the shared `.prettierrc.yml` / `.prettierignore` and targets JS + SCSS files under `src/`.

## Configuration Highlights
- `config/paths.js` mirrors Create React App path resolution so webpack loaders behave consistently across repos.
- `config/versioning.js` delegates to semantic-release in dry-run mode and exports env vars such as `${APP}_VERSION`/`_REVISION`/`_BRANCH` which `scripts/build.js` expects to exist.
- `config/env.js` centralises dotenv loading and injects public `REACT_APP_*` variables.

## Automation Hooks
- `scripts/hooks.js` installs husky with `pnpm exec` and wires two hooks: `pre-commit` (`run-p test lint format`) and `commit-msg` (commitlint with the bundled config).
- `scripts/vscode.js` keeps local VS Code settings in sync with the project-wide prettier/eslint versions to avoid editor drift.

## How to Consume the CLI
1. Install dependencies in a consuming project: `pnpm add -D rels-scripts`.
2. Run `pnpm exec rels-scripts init` to scaffold scripts, husky hooks, and VS Code settings.
3. Call `pnpm lint|format|test|start|build` (or invoke the `rels-scripts` binary directly) to execute the shared tasks.

## Opportunities for Improvement
- Add automated tests for `bin/rels-scripts.js` and the task wrappers so regressions in spawn arguments are caught early.
- Publish a starter template or generator for rels front-end apps that already includes `rels-scripts`.
- Document the release workflow (how semantic-release is configured when dry-run mode should be toggled off) and surface a checklist for CI.
