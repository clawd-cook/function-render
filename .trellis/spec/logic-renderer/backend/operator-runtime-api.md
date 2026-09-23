# Operator Runtime API

## Scenario: Closed dialect + settlement + horizon catalog

### 1. Scope / Trigger

- Trigger: `fr-operator-runtime` replaced the public Interface; `fr-operator-horizon` expanded the sealed Operator / Expr catalogs.
- Cross-layer: hosts (`apps/node-service|react|vue|docs`) and fixtures use `{ type, params }` + `funcs`; no adapters / no `registerOperator`.

### 2. Signatures

```ts
// @logic-renderer/core
function validate(spec: unknown, options: { funcs: FuncRegistry }): FlowSpec;

// @logic-renderer/runner
function run(
  spec: unknown,
  options: { input: unknown; funcs: FuncRegistry; preview?: boolean },
): Promise<{ state: SlotSpace; result: unknown }>;
```

```ts
type NodeSpec = { type: NodeType; params: Record<string, unknown>; outputTo?: string };
type FlowSpec = NodeSpec; // root is one node; sequences use type: "then"
type FuncRegistry = Readonly<Record<string, Func>>;
type Func =
  | ((args: Record<string, unknown>) => unknown)
  | {
      run: (args: Record<string, unknown>) => unknown;
      params?: ZodType;
      sideEffect?: boolean; // default false
      rollback?: (args: Record<string, unknown>, result: unknown) => unknown;
    };
```

**NodeType (engine closed set)** — tiers in [complexity-tiers.md](./complexity-tiers.md) / `NODE_COMPLEXITY`

| Group | types | Tier |
|-------|--------|------|
| Control | `then` `if` | L0 |
| Control | `switch` `tryCatch` | L1 |
| Control | `while` `for` | L2 |
| Control | `when` | L5 |
| Invocation | `callFunc` | L0 |
| Data | `get` `set` | L0 |
| Data | `arrayMap` `arrayFilter` `arrayReduce` | L4 |
| Utility | `log` `assert` `sleep` `constant` `expr` | L5 |

**ExprAtom (engine closed set)** — `EXPR_COMPLEXITY`

| Group | atoms | Tier |
|-------|--------|------|
| Arithmetic (min) | `$add` `$mul` | L0 |
| Compare (min) | `$gt` | L0 |
| Literal escape | `$lit` | L0 |
| Arithmetic (widen) | `$sub` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round` | L3 |
| Compare / logic | `$gte` `$lt` `$lte` `$eq` `$neq` `$and` `$or` `$not` | L3 |
| First-order data | `$len` `$at` `$concat` `$pick` `$omit` `$merge` | L3 |

### 3. Contracts

| Field | Layer | Rules |
|-------|-------|-------|
| `funcs` | validate + run | Required value object (not global `register()`). Non-object / null → `TypeError`. |
| `input` | run | Cloned into `state.input` (`$.input` readonly). |
| `preview` | run | Default `false`. When `true`: never call `Func.run`; skip `sleep`; still validate `funcKey` + params schema. |
| Slot path | dialect | `$.path` or bare `tax` → `$.tax`. Reject writes under `$.input` at validate. |
| Expr string | dialect | Matching `/^\$\.[A-Za-z_][\w.]*$/` is Slot read; other strings are literals (no infix eval). |
| Catalog arithmetic | catalog | Must not export `add`/`sub`/`mul`/`div` as Func. Use ExprAtom. |
| `while` / `for` | validate | Missing `maxIter` → `phase: "validate"`. |
| `for` / `arrayMap` / `arrayReduce` | run | `items.length > maxIter` → `phase: "run"` (`arrayMap`/`arrayReduce` default `maxIter = length`). |
| `tryCatch.body` | validate | Any `callFunc` whose Func has `sideEffect: true` → `phase: "validate"`. catch/finally may use sideEffect. |
| `itemKey` / `accumKey` | run | Bound before iteration body; previous Slot value restored after. |
| `$div` zero | run | `phase: "run"`. |
| `$map` | dialect | Never an ExprAtom; use NodeType `arrayMap`. |

**Deleted Interface (do not revive)**: discriminant nodes (`call`/`seq`/…), `{ $state: "/ptr" }`, `run(spec, { catalog, initialState })`, project-level `registerOperator`.

### 4. Validation & Error Matrix

| Condition | Error |
|-----------|-------|
| `options.funcs` missing / not object | `TypeError` |
| Zod NodeSpec fail / unknown `type` | `FunctionRenderError` `phase: "validate"` |
| Unknown `$atom` (except allowed closed set) | `phase: "validate"` |
| `funcKey` ∉ `funcs` | `phase: "validate"`, `funcKey` set |
| Invalid / `$.input` write path (`set.path` / `outputTo`) | `phase: "validate"` |
| Missing `maxIter` on `while`/`for` | `phase: "validate"` |
| `tryCatch.body` sideEffect `callFunc` | `phase: "validate"` |
| Expr type mismatch / `$div` zero / Func throw / loop maxIter | `phase: "run"` |
| Rollback hook throws | `phase: "rollback"`, `cause` = original; remaining frames still attempted |

### 5. Good / Base / Bad Cases

- **Good**: settlement `then` + `set` + `$mul`/`$add` + `callFunc: deductBalance` with `sideEffect` + `rollback`; horizon `for`/`when`/`switch`/`arrayMap`.
- **Base**: `preview: true` on same spec → Slot tax/total computed; `Func.run` never called; `sleep` skipped; `callFunc` `outputTo` not written as `undefined`.
- **Bad**: `{ call: "add", args: … }` / `{ $state: "/input/x" }` / `"$.a + 1"` as arithmetic / registering `mul` as Func / `$map` as ExprAtom.

### 6. Tests Required

| Assertion | Where |
|-----------|--------|
| `orderAmount=2000` → tax 120, total 2120, `deductBalance` called | `packages/runner/tests/engine.test.ts` |
| `preview: true` → no `Func.run`; sleep skipped | same |
| Successful sideEffect then later failure → `rollback` once | same |
| `callFunc.run` itself throws → no rollback frame | same |
| Control/Data/Utility main paths + tryCatch / maxIter | same |
| Unknown type / `$atom` / `funcKey` / tryCatch body sideEffect → `phase: "validate"` | `packages/core/tests/validate.test.ts` + runner |
| Horizon ExprAtoms (`$div` zero, `$eq`, `$len`/…) | `packages/core/tests/expr.test.ts` |
| Infix string stays literal | same |
| Hosts/examples use `{ type, params }` + `funcs`; examples cover for/when/switch/arrayMap | catalog examples + apps spot-check |

### 7. Wrong vs Correct

#### Wrong

```ts
await run(spec, { catalog: standardCatalog, initialState: { "/input": x } });
// Node: { call: "add", args: { a: 1, b: 2 }, out: "/sum" }
```

#### Correct

```ts
await run(spec, { input: x, funcs: { deductBalance }, preview: false });
// Node: { type: "set", params: { path: "$.tax", value: { "$mul": ["$.input.orderAmount", 0.06] } } }
```

### Design Decision: Three identities

**Context**: `add` lived as both ExprAtom and Catalog Func.

**Decision**: Operator Catalog + Expr Catalog sealed per engine version; only `FuncRegistry` is injectable per `run`. Placement: I/O or project semantics → Func; control/subgraph → NodeType; pure sync value→value → ExprAtom.

**Extensibility**: New NodeTypes / ExprAtoms land in later engine versions (changelog), not via project `registerOperator`. Horizon catalog is now in the closed set.

### Common Mistake: Expecting rollback when Func.run throws

**Symptom**: `deductBalance.run` throws → expect `rollback` to run.

**Cause**: Frames push only after successful `run` with `sideEffect: true`.

**Fix**: Test “later sibling fails after successful sideEffect” for rollback; test “run throws → no rollback”.

### Gotcha: `when` with `waitAll: false`

Loser branches may still mutate Slot / push rollback frames after the race winner settles. Prefer `waitAll: true` (default) when side effects or shared Slot writes matter. Implementation attaches `.catch()` on losers to avoid unhandled rejections; that does not make loser side effects disappear.
