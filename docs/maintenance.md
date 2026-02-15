# Maintenance Playbook

This project is meant to be consumed as a dev-dependency inside rels-* applications, so the repo itself should stay lean and predictable. Use this checklist as the baseline whenever you change scripts or config.

## Environment & Tooling
- Node: prefer the currently supported LTS (>=18). The webpack/Mocha stack still supports 16 but CI should match 18+.
- Package manager: `pnpm` is the required package manager for this repo and consuming apps.
- Git hooks: `rels-scripts init` installs husky into `.husky/`. Run `pnpm exec husky install` manually if you touch hook wiring.

## Local Setup
1. `pnpm install` to get dependencies.
2. `pnpm lint`, `pnpm test`, and `pnpm format` should succeed before submitting changes.
3. Run `node scripts/init.js` from a sample consumer app to ensure we do not regress husky/vscode setup.

## Release Workflow
- `config/versioning.js` runs semantic-release in `dryRun: true` so builds get metadata without actually publishing. Disable dry-run only inside CI is a future enhancement.
- The repo's own `package.json#release` replicates the default plugin chain used in consumer apps. Bump dependencies or update plugin settings in one place.
- Tagging: when `versioning()` succeeds it exports `${APP}_VERSION`, `${APP}_REVISION`, `${APP}_BRANCH`. Inspect these in CI logs to confirm they reflect the git state you expect.

## Testing Changes to Tasks
- `scripts/test.js`, `scripts/lint.js`, and `scripts/format.js` spawn via `pnpm exec`. When editing arguments, verify quoting/spacing by running each script in verbose (`DEBUG=* pnpm exec rels-scripts <task>`).
- For webpack changes (`scripts/start.js` / `scripts/build.js`), smoke-test using a sample React app that imports CSS, images, and service workers. The configs mirror CRA 5 so CRA documentation applies.
- Husky automation can fail silently if `pnpm` is missing. Add a covering test or manual check by removing `.husky/` and rerunning `rels-scripts init`.

## Support Channels
- Open issues in GitHub `reallyenglish-global/rels-scripts`.
- Assign at least one maintainer familiar with webpack before merging config heavy PRs.
- Encourage consumer teams to pin rels-scripts to a specific version since semantic-release is not publishing packages automatically yet.
