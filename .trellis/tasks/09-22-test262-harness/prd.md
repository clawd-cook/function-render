# Child: conformance harness & seed corpus

Parent: `09-22-test262-conformance-dashboard`. Design: parent `design.md` §CorpusEntry/§report.

## Goal

A workspace package that models test262 language cases as logic-render `FlowSpec` configs,
renders them via `@logic-renderer/runner`, judges pass/fail, benchmarks `run()`, and emits the
report JSON that drives CI + docs. Ships a ~40–80 entry seed corpus.

## Requirements

- New package `packages/test262` (`@logic-renderer/test262`, `type: module`), deps
  `@logic-renderer/runner`+`@logic-renderer/catalog` (workspace:*), `zod` (catalog); dev
  `vite`/`vite-plus`/`typescript`/`@types/node` (catalog/pinned) mirroring sibling packages.
- `CorpusEntry` schema (parent design). Executor `runCorpus()`:
  - positive: `deepEqual(run(spec,{input,funcs:standardCatalog}).result, expected)`.
  - negative: expect `FunctionRenderError` with matching `phase` (+ optional message substring).
  - benchmark: run each entry N samples (default 5), record per-case times → p50/p95/total/throughput.
  - guard: every `test262Path` must exist in `language-index.json`.
- Seed corpus (~40–80) concentrated in `expressions/` (addition, multiplication, subtraction,
  division, modulus, relational, equality, logical-and/or) and `statements/` (if, for, while,
  switch, try) + a few negatives. Each entry cites a real `test262Path` + `esid`.
- `bin/run.ts` CLI writes `apps/docs/data/test262/latest.json` and appends `history.jsonl`.
- Vitest tests: seed all pass; negative modeling works; coverage guard catches a bad path.

## Acceptance Criteria

- [ ] `vp run -F @logic-renderer/test262 test` green (seed all pass, guard + negative covered).
- [ ] `node --experimental-strip-types packages/test262/bin/run.ts` writes a valid `latest.json`
      (`passRate=1`, `performance.p50Ms` present) and appends one `history.jsonl` line.
- [ ] Report `coverage.denominator=23726`; `coverage.covered` = seed count.

## Out of scope

- Auto-generating entries from JS; achieving a coverage percentage.
