# Child: test262 ingestion & language index

Parent: `09-22-test262-conformance-dashboard`. Design: parent `design.md` §"language-index.json".

## Goal

Make test262 fetchable over HTTPS (pinned) and produce a reproducible index of
`test/language` cases that serves as the coverage denominator and provenance source.

## Requirements

- `.gitmodules` test262 URL = `https://github.com/tc39/test262.git`, pinned at
  `045bf6f9966ce3291b8fbc1e0403cd97b9201b00`; fetch via
  `git submodule update --init --depth 1 submodules/test262`.
- `scripts/test262/build-index.ts` (run with `node --experimental-strip-types`) walks
  `submodules/test262/test/language/**/*.js`, parses `/*--- ... ---*/` YAML frontmatter
  (`esid`/`flags`/`negative`/`features`), excludes `*_FIXTURE.js` from `nonFixtureTotal`,
  and writes `apps/docs/data/test262/language-index.json` (shape in parent design).

## Acceptance Criteria

- [ ] Submodule inits over HTTPS at the pinned commit.
- [ ] `language-index.json` has `total=24009`, `nonFixtureTotal=23726`,
      `byCategory.expressions=11164`, `byCategory.statements=9350`.
- [ ] Every `files[].path` starts with `test/language/` and frontmatter fields are parsed
      (spot-check a negative case has `negative:{phase,type}`).

## Out of scope

- Vendoring test262 `.js` into repo history; parsing anything outside `test/language`.
