# Implement — parent integration plan

Execution order 1 → 2 → 3 → 4. Each child has its own `implement.md`; this file owns the
cross-child sequence, integration checks, and rollback points.

## Sequence

1. **ingest** (`09-22-test262-ingest`)
   - `.gitmodules`: test262 URL → HTTPS (done in-tree); keep pinned `045bf6f9…`.
   - `scripts/test262/build-index.ts`: walk `submodules/test262/test/language/**/*.js`, parse
     `/*--- ... ---*/` YAML frontmatter, exclude `*_FIXTURE.js` from `nonFixtureTotal`, write
     `apps/docs/data/test262/language-index.json`.
   - Validate: `total=24009`, `nonFixtureTotal=23726`, `byCategory.expressions=11164`.

2. **harness** (`09-22-test262-harness`) — depends on ingest index
   - New package `packages/test262` (`@logic-renderer/test262`).
   - `src/schema.ts` CorpusEntry (see design), `src/run-corpus.ts` executor + benchmark,
     `src/report.ts` writer (latest.json + append history.jsonl), `src/corpus/*.ts` (~40–80
     seed entries), `src/index.ts` exports, `bin/run.ts` CLI.
   - Every entry's `test262Path` must exist in `language-index.json` (guard).
   - Validate: `vp run test` green; CLI emits report; all seed pass; negatives error-match.

3. **docs** (`09-22-test262-docs`) — depends on harness report shape
   - `apps/docs/test262/index.md` + `theme/Test262Dashboard.vue` (registered in theme index),
     nav entry in `.vitepress/config.ts`; inline-SVG trends; reuse `OnlineRunner.vue`.
   - Validate: `vp run -r build` builds docs; page renders metrics/trend/failures/live run.

4. **ci** (`09-22-test262-ci`) — wires the pipeline
   - `.github/workflows/test262.yml`: daily cron + `workflow_dispatch` + PR(paths) validate;
     Node 22.22 + corepack pnpm 12.5.1 + local vp; `submodules: recursive`; run index+corpus;
     write-back `apps/docs/data/test262/**` with `[skip ci]` + `concurrency`; gate seed
     regression + coverage decrease.
   - Validate: `actionlint`/YAML parse; logic review against R5.

## Integration acceptance (parent)

- Fresh `git submodule update --init --depth 1 submodules/test262` → index script → harness
  CLI → report → docs build, all succeed locally in one pass.
- `vp run -r test` and the harness tests are green; docs build green.

## Validation commands

```bash
git submodule update --init --depth 1 submodules/test262
node --experimental-strip-types scripts/test262/build-index.ts
vp run -F @logic-renderer/test262 test
node --experimental-strip-types packages/test262/bin/run.ts   # emits report
vp run -r build
```

## Rollback points

- ingest: pure generator; delete generated JSON to revert.
- harness: isolated new package; removing it doesn't touch core/runner/catalog.
- docs: additive page/component + one nav line + theme registration.
- ci: additive workflow file.
