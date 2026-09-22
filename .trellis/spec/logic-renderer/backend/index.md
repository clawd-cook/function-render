# Backend — logic-renderer (core / runner / catalog)

> Executable contracts for `@logic-renderer/core`, `@logic-renderer/runner`, and `@logic-renderer/catalog`.

## Pre-Development Checklist

- [ ] Read [operator-runtime-api.md](./operator-runtime-api.md) before changing `validate` / `run`, NodeSpec, ExprAtom, Slot, preview, or rollback
- [ ] Do not restore old dialect (`call`/`seq`/`$state`/JSON Pointer/`initialState`/`catalog` option)
- [ ] Arithmetic / first-order data belong in ExprAtom, never as Func or NodeType
- [ ] New NodeType / ExprAtom = engine version bump + changelog; projects inject only `funcs`

## Quality Check

- [ ] Public tests only call `validate` / `run` (no Engine internals)
- [ ] Unknown `type` / `$atom` / missing `funcKey` → `phase: "validate"`
- [ ] `preview: true` never invokes any `Func.run`
- [ ] Rollback frames only after successful sideEffect `callFunc` (not when `run` itself throws)
- [ ] `vp check packages/core packages/runner packages/catalog` + package tests green

## Guidelines Index

| Guide | Description | Status |
|-------|-------------|--------|
| [Operator Runtime API](./operator-runtime-api.md) | `validate`/`run` signatures, dialect, preview, rollback, horizon catalog | Filled (2026-09-22) |
