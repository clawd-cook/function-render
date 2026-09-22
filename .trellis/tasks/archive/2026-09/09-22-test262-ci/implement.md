# Implement — scheduled CI

Design: parent `design.md`. Wires ingest + harness + docs.

## Steps

1. `.github/workflows/test262.yml` with jobs:
   - `conformance` (runs on schedule/dispatch/PR):
     - checkout `submodules: recursive`; setup node 22.22 + corepack pnpm 12.5.1.
     - `pnpm install --frozen-lockfile`.
     - `node --experimental-strip-types scripts/test262/build-index.ts`.
     - `node --experimental-strip-types packages/test262/bin/run.ts`.
     - gate script: fail if `passed<total` or `coverage.covered` < previous committed value.
     - `vp run -F @logic-renderer/test262 test`.
   - write-back (schedule/dispatch only): `git add apps/docs/data/test262`; commit
     `chore(test262): update conformance report [skip ci]` if changed; push.
   - `concurrency: { group: test262-${{ github.ref }}, cancel-in-progress: false }`.
2. Keep PR path-filtered validation (no write-back) via an `if:` guard on the commit step.
3. Local validation: `actionlint` if available; otherwise YAML parse + shell dry-run of the
   index+corpus+gate sequence.

## Validation

```bash
python3 -c 'import yaml,sys; yaml.safe_load(open(".github/workflows/test262.yml")); print("yaml ok")'
# dry-run pipeline locally (already covered by ingest + harness validation)
```

## Rollback

Delete `.github/workflows/test262.yml`.
