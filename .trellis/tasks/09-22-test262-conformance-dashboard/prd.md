# test262 language conformance & benchmark dashboard (parent)

## Goal

Use logic-render's configurable logic ("配置 + render") to exercise TC39 test262
`test/language` cases as a **curated config corpus**, track a conformance **pass rate** and
**coverage** that grow over iterations (route C — dashboard, not day-one 100%), collect
`run()` **benchmark** metrics, run everything on a **daily scheduled GitHub Actions** job,
and publish the analysis on the **VitePress docs site**. Work branches from latest
`origin/main` (branch `cursor/test262-conformance-dashboard-bf4b`).

## Background / confirmed facts (from repo inspection)

- logic-render is a closed-NodeType JSON `FlowSpec` engine: `run(spec, { input, funcs, preview })`
  → `{ result, state }`. NodeTypes: `then/when/if/switch/while/for/tryCatch/callFunc/get/set/
  arrayMap/arrayFilter/arrayReduce/log/assert/sleep/constant/expr` (`packages/core/src/types.ts`).
  ExprAtoms: `$add/$sub/$mul/$div/$mod/$pow/$abs/$ceil/$floor/$round/$gt/$gte/$lt/$lte/$eq/
  $neq/$and/$or/$not/$len/$at/$concat/$pick/$omit/$merge/$lit` (`packages/core/src/expr.ts`).
- **It cannot execute arbitrary JS source** — test262 `.js` files cannot be run directly;
  each case is modeled as a `FlowSpec` config and rendered.
- Reuse pattern: `apps/docs/data/problems.ts` encodes `{ num, title, slug, category, spec,
  input, expected, pureProtocol }`; `apps/docs/.vitepress/theme/{OnlineRunner,ProblemView,
  LeetcodeIndex}.vue` render + live-run specs. Docs base path `/logic-render/`
  (`apps/docs/.vitepress/config.ts`).
- test262 is public over HTTPS/`gh`. `submodules/test262` is declared in `.gitmodules` with an
  SSH URL and is uninitialized; its pointer is commit `045bf6f9966ce3291b8fbc1e0403cd97b9201b00`.
- At that commit, `test/language` has **24,009** `.js` files (283 `_FIXTURE.js` helpers →
  ~23,726 real cases): `expressions` 11,164, `statements` 9,350, then a long tail. Most cases
  test JS semantics logic-render cannot express, so the expressible subset is inherently small.

## Requirements

- **R1 — Model (option A, curated config corpus).** Each corpus entry references one real
  test262 language case (`path`, `esid`, `category`) and provides a hand-authored `FlowSpec`
  + `expected`. Positive pass = `run(spec,input).result` deep-equals `expected`; negative pass
  = render throws per modeled `negative.phase/type`. Corpus starts small and grows. Reject the
  automated JS-subset adapter (option B) as too close to the declined transpiler routes.
- **R2 — Ingestion (pinned HTTPS submodule as source of truth).** Switch `.gitmodules` test262
  URL to HTTPS, keep it pinned at `045bf6f9…`. Fetch via
  `git submodule update --init --depth 1 submodules/test262`. Coverage denominator = count of
  `test/language/**/*.js` (excluding `_FIXTURE.js`) at the pinned commit.
- **R3 — Current-phase bar.** Deliver the end-to-end pipeline + a seed corpus of ~40–80
  entries (concentrated in `expressions/` arithmetic/relational/equality/logical and
  `statements/` if/for/while/switch/try, plus a few negative cases) + dashboard + benchmark +
  scheduled CI. No coverage-percentage promise; provide a clear "how to add a case" path so
  coverage can climb.
- **R4 — Benchmark + persistence.** Each run emits a JSON report: conformance (`total`,
  `passed`, `failed`, `passRate`, `coverage`), performance (per-case `run()` render time over
  repeated samples → `p50`/`p95`/`total` + throughput, with Node version + commit), and a
  failure list. CI writes `apps/docs/data/test262/latest.json` and appends a line to
  `apps/docs/data/test262/history.jsonl`; the scheduled job commits these back
  (`chore(test262): … [skip ci]`, isolated path) to drive docs trends with no external service.
- **R5 — Scheduled CI + failure policy.** `schedule` cron **daily** on `main` (full run →
  report → write-back → deploy docs); PRs touching `packages/**`/corpus/harness run
  validation only (no write-back). Any seed regression = red; coverage decrease = red; low
  coverage value is not red; perf is observed-only (not gated). Write-back uses `[skip ci]` +
  a `concurrency` group.
- **R6 — Docs presentation.** New VitePress page (top-nav entry) reading `latest.json` +
  `history.jsonl`: latest metric cards, trend lines (pass rate / coverage / perf), failure
  table, and an online-runnable case list reusing `OnlineRunner.vue`. Lightweight rendering,
  no heavy chart dependency (see `design.md`).

## Task map (parent owns integration; children are independently verifiable)

Ordering dependency 1 → 2 → 3, with 4 wiring the pipeline (written into each child's artifacts).

1. `09-22-test262-ingest` — HTTPS+pinned submodule; script to build the `test/language` index
   + frontmatter parse (coverage denominator).
2. `09-22-test262-harness` — corpus entry schema, `@logic-renderer/runner`-based executor,
   pass/fail + benchmark, report JSON emitter; ~40–80 seed entries.
3. `09-22-test262-docs` — VitePress dashboard page + components reading the report data.
4. `09-22-test262-ci` — daily-cron GitHub Actions workflow + PR validation + data write-back.

## Acceptance Criteria (parent / integration)

- [ ] `git submodule update --init --depth 1 submodules/test262` succeeds over HTTPS at the
      pinned commit; the index script reports 24,009 `test/language` `.js` (23,726 non-fixture).
- [ ] Harness command produces a report JSON; all seed entries pass (positive deep-equal,
      negative error-match); benchmark p50/p95/throughput present.
- [ ] `vp run -r build` builds the docs; the new page renders latest metrics + trend +
      failure table + at least one live-runnable case.
- [ ] Scheduled workflow validates locally (YAML lint + logic review), gates seed regression
      and coverage decrease, and write-back is isolated with `[skip ci]`.
- [ ] `vp run -r test` stays green; pre-existing repo formatting issues remain out of scope.

## Out of scope

- A full JS interpreter or general JS→FlowSpec transpiler (routes A/B declined).
- A coverage-percentage target for this phase; fixing pre-existing `vp check` formatting debt.
