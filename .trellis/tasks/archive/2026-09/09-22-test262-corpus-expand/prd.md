# Expand test262 corpus coverage

Incremental follow-up to the test262 conformance dashboard (PR #7). Same branch
`cursor/test262-conformance-dashboard-bf4b`. Lightweight (PRD-only).

## Goal

Raise corpus coverage by adding more curated, expressible `test/language` entries following
the established `packages/test262` pattern, keeping all gates green.

## Requirements

- Add a new expressible construct: **ternary** (`expressions/conditional` → `if` node).
- Add a **block** statement mapping (`statements/block` → `then`).
- Add more real data-point entries across arithmetic / relational / logical operators and
  more `for` / `while` / `switch` / `try` (incl. `finally`) variants. Each cites a distinct
  real test262 path (guard: path must exist under the pinned submodule).
- Regenerate `latest.json` / `history.jsonl` / `corpus.json`; rebuild docs.

## Acceptance Criteria

- [ ] Corpus grows to ~80+ entries; `vp run -F @logic-renderer/test262 test` green (all pass,
      path guard clean, negative modeling intact).
- [ ] CLI reports `passed==total`, coverage `covered` increased vs 44; docs build green.
- [ ] New categories present in `byCategory` (e.g. expressions ternary, statements block).

## Out of scope

- Non-expressible categories (variables/closures/prototypes/eval/modules); coverage % target.
