# Design — test262 conformance & benchmark dashboard

## Architecture overview

```
submodules/test262 (pinned 045bf6f9, HTTPS)
        │  git ls-files test/language/**/*.js
        ▼
[ingest] scripts/test262/build-index.ts ──► apps/docs/data/test262/language-index.json
        │   { commit, total, nonFixtureTotal, byCategory, files:[{path,esid,flags,negative,features}] }
        ▼
[harness] packages/test262/                (new workspace package)
        │   corpus/*.ts  (CorpusEntry[]) ── each references a real index path
        │   runCorpus() → uses @logic-renderer/runner run()
        │   emits report:  apps/docs/data/test262/latest.json  (+ append history.jsonl)
        ▼
[docs] apps/docs  new page /logic-render/test262/
        │   reads latest.json + history.jsonl + language-index.json
        │   metric cards + trend (inline SVG) + failure table + OnlineRunner reuse
        ▼
[ci] .github/workflows/test262.yml
            daily cron → submodule init → build-index → runCorpus → write data → commit [skip ci] → build/deploy docs
            PR (packages/**, corpus, harness) → validate only, no write-back
```

## Contracts / data shapes

### language-index.json (produced by ingest, R2)
```jsonc
{
  "commit": "045bf6f9966ce3291b8fbc1e0403cd97b9201b00",
  "generatedAt": "<iso>",
  "total": 24009,
  "nonFixtureTotal": 23726,
  "byCategory": { "expressions": 11164, "statements": 9350, "...": 0 },
  "files": [
    { "path": "test/language/expressions/addition/S11.6.1_A1.js",
      "esid": "sec-addition-operator-plus",
      "flags": ["onlyStrict"], "negative": null, "features": [] }
  ]
}
```
- Denominator for coverage = `nonFixtureTotal` (exclude `_FIXTURE.js`).
- Frontmatter parsed from the `/*--- ... ---*/` YAML block (js-yaml or a minimal parser).

### CorpusEntry (harness, R1/R3)
```ts
interface CorpusEntry {
  id: string;                 // stable slug, e.g. "expressions-addition-S11.6.1_A1"
  test262Path: string;        // real path under submodules/test262 (must exist in index)
  esid?: string;
  category: string;           // top-level test/language category
  description: string;        // what the modeled FlowSpec asserts
  spec: FlowSpec;             // hand-authored config
  input: unknown;             // becomes $.input
  expectation:                // positive or negative
    | { kind: "value"; expected: unknown }
    | { kind: "throws"; phase: "run" | "validate" | "rollback"; messageIncludes?: string };
  notes?: string;
}
```
- Positive: `deepEqual(run(spec,{input,funcs}).result, expected)`.
- Negative: expect `FunctionRenderError` with matching `phase` (test262 parse/resolution
  negatives are modeled as `validate`; runtime negatives as `run`). test262 flags
  (`onlyStrict`/`noStrict`/`module`/`raw`) are recorded for provenance but do not change
  execution (logic-render has no strict/module modes).
- Corpus validity check: every `test262Path` must exist in `language-index.json` (guards
  against typos / drift from the pin).

### report latest.json (harness, R4)
```jsonc
{
  "commit": "<repo sha>", "test262Commit": "045bf6f9…", "node": "v22.22.2",
  "generatedAt": "<iso>",
  "conformance": { "total": 60, "passed": 60, "failed": 0, "passRate": 1.0,
                   "coverage": { "covered": 60, "denominator": 23726, "ratio": 0.0025 } },
  "performance": { "samples": 5, "p50Ms": 0.12, "p95Ms": 0.4, "totalMs": 40.0, "casesPerSec": 1500 },
  "failures": [ { "id": "...", "test262Path": "...", "reason": "..." } ],
  "byCategory": { "expressions": { "total": 30, "passed": 30 } }
}
```
### history.jsonl (one JSON object per line, appended each run)
`{ "ts": "<iso>", "commit": "<sha>", "passRate": 1.0, "coverage": 0.0025, "p50Ms": 0.12, "p95Ms": 0.4, "total": 60 }`

## Package/layout decisions

- New workspace package `packages/test262` (name `@logic-renderer/test262`), `type: module`,
  scripts `test`/`check`/`bench` via `vp`; depends on `@logic-renderer/runner` +
  `@logic-renderer/catalog` (workspace:*) and `zod` (catalog). Follows existing package
  conventions (`packages/core|runner|catalog`).
- Ingest script under `scripts/test262/` (repo-root), run with `node --experimental-strip-types`
  like `apps/node-service`. Writes into `apps/docs/data/test262/` so docs can import it.
- Docs data dir `apps/docs/data/test262/{language-index.json, latest.json, history.jsonl}` is
  committed; the daily job refreshes it.

## Docs rendering (R6)

- New page `apps/docs/test262/index.md` + a theme component `Test262Dashboard.vue`
  (registered in `apps/docs/.vitepress/theme/index.ts`, like the existing Leetcode components).
- Trend charts as **inline SVG** (no new dependency) — small polyline over `history.jsonl`.
- Reuse `OnlineRunner.vue` for a "run this case" list built from corpus entries.
- Add a top-nav item (`一致性` / `test262`) in `apps/docs/.vitepress/config.ts`.

## CI (R5)

- `.github/workflows/test262.yml`: jobs use Node 22.22.x + corepack pnpm 12.5.1 + local `vp`
  (mirror `.cursor/cloud-*` setup), `actions/checkout` with `submodules: recursive` (HTTPS).
- Daily `schedule` + `workflow_dispatch`; PR trigger on relevant paths runs validation only.
- Write-back step commits only `apps/docs/data/test262/**` with `[skip ci]` under a
  `concurrency` group keyed to the workflow + ref.

## Trade-offs / risks

- Coverage ratio will look tiny (≈0.25% for 60/23,726). This is expected under route C; the
  dashboard emphasizes pass-rate + trend, and states coverage is incremental.
- Submodule init in CI adds ~tens of seconds; mitigated by `--depth 1` blobless-ish checkout.
- Modeling negative parse-time syntax errors is imperfect (logic-render validates FlowSpec,
  not JS syntax); we only include negatives whose semantics the engine can genuinely reject,
  and record the mapping in `notes`.

## Compatibility

- No changes to `packages/core|runner|catalog` public APIs. New package + scripts + docs +
  workflow are additive. `.gitmodules` URL change is the only edit to existing infra.
