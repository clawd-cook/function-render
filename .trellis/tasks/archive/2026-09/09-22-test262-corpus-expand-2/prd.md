# Expand test262 corpus coverage — round 2

Incremental follow-up (same branch, PR #8). Lightweight/PRD-only.

## Goal

Add more expressible `test/language` entries: grouping/precedence, exponentiation (`$pow`),
unary-plus (identity), and more `if`/`for` variants. Keep all gates green.

## Acceptance Criteria

- [ ] Corpus grows to ~105+; `vp run -F @logic-renderer/test262 test` green; CLI `passed==total`.
- [ ] New categories present: `expressions/grouping`, `expressions/exponentiation`,
      `expressions/unary-plus`; more `statements/if` + `statements/for`.
- [ ] Coverage `covered` increases vs 85; docs build green.

## Out of scope

- Non-expressible categories; coverage % target.
