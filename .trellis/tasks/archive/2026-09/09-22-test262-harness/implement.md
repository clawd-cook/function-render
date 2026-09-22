# Implement — harness

Design: parent `design.md`. Depends on ingest (`language-index.json`).

## Files (packages/test262)

- `package.json` — name `@logic-renderer/test262`, scripts `test`/`check` via `vp`.
- `tsconfig.json` — mirror `packages/runner`.
- `src/schema.ts` — `CorpusEntry`, `Report`, `HistoryLine` types (+ zod where useful).
- `src/deep-equal.ts` — small structural equality (or reuse JSON compare like core's).
- `src/run-corpus.ts` — `runCorpus(entries, {samples})`: execute + judge + time; returns Report.
- `src/report.ts` — `writeReport(report, dir)`: write `latest.json`, append `history.jsonl`.
- `src/corpus/index.ts` + `src/corpus/{expressions,statements,negative}.ts` — seed entries.
- `src/index.ts` — exports.
- `bin/run.ts` — CLI: load index, run corpus, write to `apps/docs/data/test262/`.
- `tests/*.test.ts` — seed pass, negative-match, coverage-guard.

## Modeling notes

- test262 positive cases that use `eval("1 + 1")` are modeled by the *semantics*: e.g.
  `{ type:"expr", params:{ value:{ $add:[1,1] } } }`, `expected:2`, citing the real path/esid.
- Relational/equality/logical → `$gt/$lt/$eq/$neq/$and/$or/$not`. Control-flow statements →
  `if/for/while/switch/tryCatch` nodes. Prefer pure-protocol (no callFunc) where possible.
- Negatives: pick cases whose semantics logic-render can genuinely reject (e.g. `$div` by zero
  → `run` error; unknown atom / bad slot → `validate`). Record mapping in `notes`.

## Validation

```bash
vp run -F @logic-renderer/test262 test
node --experimental-strip-types packages/test262/bin/run.ts
node -e 'const j=require("./apps/docs/data/test262/latest.json");console.log(j.conformance,j.performance.p50Ms)'
```

## Rollback

Remove `packages/test262` and generated `latest.json`/`history.jsonl` lines.
