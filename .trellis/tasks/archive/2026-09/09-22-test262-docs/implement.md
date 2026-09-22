# Implement — docs dashboard

Design: parent `design.md`. Depends on harness report shape.

## Files

- `apps/docs/data/test262/` — ensure `latest.json` (from harness) + `history.jsonl` +
  `language-index.json` exist; add a committed placeholder if a build must succeed pre-CI.
- `apps/docs/.vitepress/theme/Test262Dashboard.vue` — cards + inline-SVG trends + failure
  table + corpus case list embedding `OnlineRunner`.
- `apps/docs/.vitepress/theme/index.ts` — register the component (like Leetcode components).
- `apps/docs/test262/index.md` — page shell mounting `<Test262Dashboard/>`.
- `apps/docs/.vitepress/config.ts` — add nav item + optional sidebar.

## Modeling notes

- Import JSON via `import data from "../data/test262/latest.json"` (VitePress/Vite supports
  JSON import); parse `history.jsonl` via raw import + split, or precompute an array module.
- Inline SVG polyline: map history points to a viewBox; no external deps.
- Guard for empty data → friendly empty state.

## Validation

```bash
vp run -r build
# inspect apps/docs/dist for the test262 page; manual browser check via docs dev server
```

## Rollback

Remove the page/component, nav line, and theme registration.
