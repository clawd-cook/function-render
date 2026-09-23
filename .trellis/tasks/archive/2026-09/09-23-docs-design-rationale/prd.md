# docs: design rationale & theory page

Lightweight docs task (PRD-only). Branch `cursor/docs-design-rationale-bf4b` from `main`.

## Goal

Add one VitePress page that explains, for each major design decision in logic-render, both the
**intent (用意)** and the **theoretical basis (理论依据)**, cross-linking to overview/operators.

## Requirements

- New page `apps/docs/guide/rationale.md` covering: three-layer identity (NodeType/ExprAtom/Func),
  closed-vs-open boundary, layered packages, control-flow set (Böhm–Jacopini), no-goto tree
  (structured programming), bounded iteration (total FP / giving up Turing-completeness),
  array folds (catamorphism), closed value algebra, Slot model, program-as-data + interpreter
  (initial algebra / free monad; preview as alternate interpretation), validate-first,
  error phases + rollback (Saga/compensation), influences (json-render, LiteFlow).
- Register in `apps/docs/.vitepress/config.ts`: guide sidebar entry + a nav item.
- Content must match the actual engine (closed NodeType/ExprAtom sets, `maxIter`, preview,
  rollback) — no invented capabilities.

## Acceptance Criteria

- [ ] `vp run -F docs docs:build` (or vitepress build) succeeds; page renders at `/guide/rationale`.
- [ ] Nav + sidebar link present; content maps each decision → intent + theory.

## Out of scope

- Code/engine changes; interactive components (prose page only).
