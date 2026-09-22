# Implement — ingest

Design: parent `design.md`.

## Steps

1. Set `.gitmodules` `submodule.submodules/test262.url` to the HTTPS URL; `git submodule sync`.
2. `git submodule update --init --depth 1 submodules/test262`.
3. Write `scripts/test262/build-index.ts`:
   - Recursively list `submodules/test262/test/language/**/*.js`.
   - For each, read the head, extract the `/*--- ... ---*/` block, YAML-parse it (use a minimal
     hand parser or `js-yaml` if already available; prefer zero new deps — a tolerant regex/YAML
     subset parser is fine for `esid`, `flags: [..]`, `negative: {phase, type}`, `features: [..]`).
   - Classify category = path segment after `test/language/`.
   - Exclude `*_FIXTURE.js` from `nonFixtureTotal` (still list them with `fixture:true` optional).
   - Write `apps/docs/data/test262/language-index.json` sorted by path (stable diffs).
4. Add root/package script hook if useful (e.g. `scripts/test262/build-index.ts` invoked by CI).

## Validation

```bash
git submodule update --init --depth 1 submodules/test262
node --experimental-strip-types scripts/test262/build-index.ts
node -e 'const j=require("./apps/docs/data/test262/language-index.json");console.log(j.total,j.nonFixtureTotal,j.byCategory.expressions,j.byCategory.statements)'
# expect: 24009 23726 11164 9350
```

## Rollback

Delete `apps/docs/data/test262/language-index.json` and revert `.gitmodules`.
