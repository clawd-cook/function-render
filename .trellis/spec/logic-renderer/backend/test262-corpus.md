# test262 conformance corpus (packages/test262)

> How to grow the "配置 + render" conformance corpus and dashboard.

## Contract

- logic-render cannot execute raw JS. Each `CorpusEntry` (`packages/test262/src/schema.ts`)
  models one real test262 `test/language` case as a `FlowSpec` and cites its real relative
  path (`test262Path`, starting `test/language/`) for provenance + on-disk existence guard.
- Positive entry passes when `run(spec,{input,funcs}).result` deep-equals `expectation.expected`.
- Negative entry passes when render throws `FunctionRenderError` with `expectation.phase`.
  test262 parse-phase `SyntaxError` cases map to logic-render **`validate`**-phase rejection of
  a structurally invalid FlowSpec (document the mapping in `notes`).

## Adding cases (raises coverage under route C)

1. Pick a real, expressible case under `submodules/test262/test/language/**` (arithmetic,
   relational, equality, logical, or control-flow: `if/for/while/switch/tryCatch`).
2. Add an entry in `packages/test262/src/corpus/{expressions,statements,negative}.ts`
   (use `exprCase`/`specCase` helpers). Every `test262Path` must exist on disk.
3. `vp run -F @logic-renderer/test262 test` (seed must all pass + path guard) then
   `node --experimental-strip-types packages/test262/bin/run.ts` to refresh the report.

## Pipeline invariants

- Coverage denominator = `nonFixtureTotal` from `apps/docs/data/test262/language-index.json`
  (excludes `*_FIXTURE.js`), pinned to the test262 submodule commit.
- The CLI gates **seed regression** (any fail → exit 1) and **path drift** (missing file → exit 1);
  CI additionally gates **coverage decrease**. Perf (p50/p95) is observed, not gated.
- Docs read only JSON (`latest.json` / `history.jsonl` / `corpus.json` / `language-index.json`);
  never import node-only modules (`report.ts`, `verify.ts`) into the browser bundle.
