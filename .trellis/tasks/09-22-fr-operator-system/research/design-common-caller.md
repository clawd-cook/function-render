# Design — Common Caller: `run(spec, { input, funcs })`

Stance: the Module *is* the host one-liner. A FlowSpec is a json-render tree of `{ type, params }`. Slot, rollback, dry-run, Operator dispatch are Implementation. **Math is not a NodeType.**

## 1. Interface

**Module**: Func-Render operator engine (`packages/core` + `packages/runner`, evolved — not a green field).

**Entry** (default is one; second is AI-only):

- `run(spec, { input, funcs, preview? }): Promise<{ state, result }>`
- `validate(spec, { funcs }): FlowSpec` — reject a spec without touching Funcs. `run` always validates first.

**What the common caller learns**:

| Name | Shape |
|------|--------|
| `spec` | FlowSpec = `NodeSpec \| NodeSpec[]` (array = implicit `then`) |
| NodeSpec | `{ type: NodeType, params, outputTo? }` |
| `input` | JSON object, bound as Slot `input` |
| `funcs` | FuncRegistry as `{ [funcKey]: Func }` for this call only |
| Func | `(args) => unknown` **or** `{ run, params?, sideEffect?, rollback? }` |
| `preview` | default `false`. Omit it. |

Bare Func = pure. `sideEffect` / `rollback` exist only on the host's debit-like Funcs.

**NodeTypes the default case writes**: `then` (or omit via array), `if`, `callFunc`, `set`. The Operator Catalog also has the rest of Control / Data / Utility (`when`, `switch`, `while`, `for`, `tryCatch`, `get`, `object`, `array*`, `merge`, `pick`, `omit`, `log`, `assert`, `sleep`, `constant`, `expr`). **R3 Math/compare/logic are not NodeTypes** — they are in-process expressions inside `params` (`$add`, `$mul`, `$gte`, …). `expr` is the single-line escape hatch. `callFunc` is the only Invocation NodeType.

**Slot is a string convention, not a type.** In any params value, a string matching `/^\$[A-Za-z_]/` is a Slot read (`$input.amount`, `$tax`). `outputTo: "receipt"` writes Slot `receipt`. A literal that must start with `$` uses `{ "$lit": "…" }`. Callers never import Slot.

**Invariants**

1. Only `callFunc` invokes a Func. `type` is never a funcKey.
2. Unknown NodeType, missing params, loop without `maxIter`, `callFunc.func` missing from `funcs` → validate fails; no run; no rollback.
3. `$…` / `expr` cannot call a Func or do I/O.
4. Pure NodeTypes and Funcs without `sideEffect: true` never enter the rollback stack. `sleep` is the other side-effect NodeType; preview skips it.
5. `input` is cloned into `state.input`. Writes go through `set` / `outputTo`, not by mutating `input`.
6. `preview: true` still validates `callFunc` args and runs pure nodes; it does not run `sideEffect` Func bodies.

**Call order** (host never drives it): `validate → run (or preview skip) → on throw, reverse rollback of sideEffect callFunc only → { state, result }`.

**Error mode**: throw `FunctionRenderError` `{ phase: "validate" \| "run" \| "rollback", path, message, funcKey? }`. Fail-fast. A run-phase throw rolls back, then rethrows; a failing rollback hook becomes `phase: "rollback"` with `cause` = original. `parallel` first rejection wins.

**Performance the caller must know**: validate is a sync tree walk (O(nodes + expr leaves)). Expressions are sync in-process. `run` is async only because a Func or `sleep` may be. One cloned `state` object per `run`. rollback replays N committed sideEffect `callFunc`s (usually 0–few). Operator Catalog dispatch is a closed in-process table — no lookup across a Seam.

## 2. Usage

```ts
const { state, result } = await run(spec, {
  input: { amount: 200, rate: 0.06, userId: "u1" },
  funcs: {
    deductBalance: {
      sideEffect: true,
      run: ({ userId, amount }) => db.debit(userId, amount),
      rollback: ({ userId, amount }) => db.credit(userId, amount),
    },
  },
});
// host renders state.tax / state.total / result
```

```json
[
  { "type": "set", "params": { "path": "tax", "value": { "$mul": ["$input.amount", "$input.rate"] } } },
  { "type": "set", "params": { "path": "total", "value": { "$add": ["$input.amount", "$tax"] } } },
  {
    "type": "if",
    "params": {
      "when": { "$gte": ["$total", 100] },
      "then": {
        "type": "callFunc",
        "params": { "func": "deductBalance", "args": { "userId": "$input.userId", "amount": "$total" } },
        "outputTo": "receipt"
      }
    }
  }
]
```

No Engine, no Catalog, no Slot constructor, no dry-run flag. Settlement is three NodeSpecs and one Func.

## 3. Implementation 藏什么

Behind `run` / `validate`:

- Closed Operator Catalog + NodeType dispatch (not injectable).
- Implicit `then` wrap of a FlowSpec array.
- Slot bind: `$input` / `$tax` → internal pointer on `state`; `outputTo` names → writes. Evolve today's `expr.ts` so `$name.path` strings replace `{ "$state": "/ptr" }`.
- rollback stack: push `{ funcKey, args, hook }` only when `callFunc` hits `sideEffect: true`; reverse on catch.
- dry-run short-circuit: `preview` skips those bodies and `sleep`, still `resolveArgs`.
- Zod NodeSpec check (evolve `schema.ts` discriminants → `{ type, params }`).
- Internal throwaway Adapter `fromLegacy` (`call`/`seq`/`if` + JSON Pointer → NodeSpec + `$path`).

Tests assert `{ state, result }` and Func mock calls — not these.

## 4. Seam / Adapter

**True Seam**: FuncRegistry — the `funcs` bag. True-external Funcs (DB/RPC) vs local-substitutable in-memory mocks. Same Interface, different object. Two Adapters ⇒ real Seam.

**Not a Seam**: Operator Catalog (one production table). parse / expr / math / data / control are in-process — deepen inside the Module. Do not port each Operator.

- **Production Adapter**: host Funcs; debit-like ones set `sideEffect` + `rollback`.
- **Test Adapter**: `{ deductBalance: { sideEffect: true, run: fn, rollback: fn } }`.
- **Throwaway Adapter**: `fromLegacy`. One release, then delete. Common caller never imports it.

## 5. Trade-offs

**Leverage (high)**: one `run` + json-render NodeSpec. Author learns four NodeTypes for the default case and gets validate, Slot, rollback, preview, dispatch. Deletion test: remove the Module and every host rewrites control flow, expr, rollback, dry-run.

**Leverage (Q2)**: math-as-expression is the depth move for this caller. `type: "add"` per arithmetic step makes the Interface as wide as the Implementation and makes settlement un-boring. Expressions stay DEEPENING cat. 1 (in-process). `add` leaves `standardCatalog` — that dual `add` / `$add` pollution dies.

**Shallow spots**: `validate` duplicates the first step of `run` (kept for AI authors who must reject without calling Funcs). `preview` is a flag; default-off so it does not fatten the common path.

**Locality**: execution + rollback + Slot bind in `packages/runner`. Expression evaluation stays in `packages/core/src/expr.ts`. Func bodies stay in the host. Operator Catalog sits next to the dispatcher — not in `packages/catalog`.

**vs status quo — replace, do not dual-dialect.** `run(spec, { catalog, initialState })` becomes `run(spec, { input, funcs })`. Discriminant `call`/`seq` die at the Interface. JSON Pointer dies at the Interface (`/input/id` → `$input.id`; Implementation may keep pointers). `$add` / `$gte` stay and become the blessed math layer. `standardCatalog.add` is removed. `delay` is either `sleep` or a `sideEffect` Func — not both.

**Refuses**: Engine class, injectable Operator Catalog, public Slot type, public rollback stack, Math NodeTypes, two live spec dialects.
