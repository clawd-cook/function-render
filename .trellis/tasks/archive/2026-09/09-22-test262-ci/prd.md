# Child: scheduled GitHub Actions workflow

Parent: `09-22-test262-conformance-dashboard`. Design: parent `design.md` §CI.

## Goal

Automate the pipeline on a daily schedule: init test262, build the index, run the corpus,
write/commit the report data (driving the docs trend), and validate on relevant PRs.

## Requirements

- `.github/workflows/test262.yml`:
  - Triggers: `schedule` daily cron (UTC) + `workflow_dispatch`; `pull_request` on paths
    `packages/**`, `apps/docs/data/test262/**`, `scripts/test262/**`, the workflow file.
  - Setup: `actions/checkout` with `submodules: recursive`; Node 22.22.x; corepack pnpm
    12.5.1; `pnpm install --frozen-lockfile`; build via local `vp` (mirror `.cursor/cloud-*`).
  - Steps: build index → run corpus (`bin/run.ts`) → (scheduled only) commit
    `apps/docs/data/test262/**` with `[skip ci]` + `concurrency` group → build docs.
  - Failure policy: seed regression (`passed<total`) = fail; coverage decrease vs committed
    `latest.json` = fail; perf observed-only. PR runs validation, **no** write-back.

## Acceptance Criteria

- [ ] Workflow YAML parses / `actionlint` clean.
- [ ] Job logic matches R5 (paths, cron, gates, write-back isolation, skip-ci, concurrency).
- [ ] Dry run of the shell logic (index+corpus+gate) passes locally.

## Out of scope

- Deploying to GitHub Pages hosting infra changes beyond building docs; perf threshold gating.
