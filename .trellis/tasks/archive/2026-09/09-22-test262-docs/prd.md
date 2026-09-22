# Child: docs conformance dashboard page

Parent: `09-22-test262-conformance-dashboard`. Design: parent `design.md` §"Docs rendering".

## Goal

A VitePress page on the docs site that presents the conformance + benchmark analysis and its
trend over time, reusing the existing online-run pattern.

## Requirements

- `apps/docs/test262/index.md` + theme component `Test262Dashboard.vue` registered in
  `apps/docs/.vitepress/theme/index.ts`; top-nav entry in `.vitepress/config.ts`.
- Reads `apps/docs/data/test262/{latest.json, history.jsonl, language-index.json}`.
- Shows: latest metric cards (passRate, covered/denominator coverage, p50/p95, total),
  trend lines (passRate / coverage / p50) as inline SVG (no new chart dependency), a failure
  table (path + reason), and a live-runnable case list reusing `OnlineRunner.vue`.
- Degrades gracefully when data files are empty/absent (shows "no data yet").

## Acceptance Criteria

- [ ] `vp run -F docs docs:build` (or `vp run -r build`) builds without error.
- [ ] Page renders metric cards + trend SVG + failure table; at least one case runs live via
      `OnlineRunner` producing its result.
- [ ] Nav entry links to `/logic-render/test262/`.

## Out of scope

- Adding heavy chart libraries; server-side data fetching.
