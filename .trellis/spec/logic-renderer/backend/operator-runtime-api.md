# Operator Runtime API

## Scenario: Hard-cut dialect + v1 settlement runtime

### 1. Scope / Trigger

- Trigger: `fr-operator-runtime` replaced the public Interface of `@logic-renderer/core` + `@logic-renderer/runner` and slimmed `@logic-renderer/catalog`.
- Cross-layer: hosts (`apps/node-service|react|vue|docs`) and fixtures must use the new dialect; no adapters.

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

**v1 NodeType**: `then` | `if` | `set` | `callFunc`  
**v1 ExprAtom**: `$add` | `$mul` | `$gt` | `$lit`

### 3. Contracts

| Field | Layer | Rules |
|-------|-------|-------|
| `funcs` | validate + run | Required value object (not global `register()`). Non-object / null → `TypeError`. |
| `input` | run | Cloned into `state.input` (`$.input` readonly). |
| `preview` | run | Default `false`. When `true`: never call `Func.run`; skip `sleep` if present; still validate `funcKey` + params schema. |
| Slot path | dialect | `$.path` or bare `tax` → `$.tax`. Reject writes under `$.input` at validate. |
| Expr string | dialect | Matching `/^\$\.[A-Za-z_][\w.]*$/` is Slot read; other strings are literals (no infix eval). |
| Catalog arithmetic | catalog | Must not export `add`/`sub`/`mul`/`div` as Func. Use ExprAtom. |

**Deleted Interface (do not revive)**: discriminant nodes (`call`/`seq`/…), `{ $state: "/ptr" }`, `run(spec, { catalog, initialState })`.

### 4. Validation & Error Matrix

| Condition | Error |
|-----------|-------|
| `options.funcs` missing / not object | `TypeError` |
| Zod NodeSpec fail / unknown `type` | `FunctionRenderError` `phase: "validate"` |
| Unknown `$atom` (except allowed v1 set) | `phase: "validate"` |
| `funcKey` ∉ `funcs` | `phase: "validate"`, `funcKey` set |
| Invalid / `$.input` write path (`set.path` / `outputTo`) | `phase: "validate"` |
| Expr type mismatch / `$div` zero (horizon) / Func throw | `phase: "run"` |
| Rollback hook throws | `phase: "rollback"`, `cause` = original; remaining frames still attempted |

### 5. Good / Base / Bad Cases

- **Good**: settlement `then` + `set` + `$mul`/`$add` + `callFunc: deductBalance` with `sideEffect` + `rollback`.
- **Base**: `preview: true` on same spec → Slot tax/total computed; `Func.run` never called; `callFunc` `outputTo` not written as `undefined`.
- **Bad**: `{ call: "add", args: … }` / `{ $state: "/input/x" }` / `"$.a + 1"` as arithmetic / registering `mul` as Func.

### 6. Tests Required

| Assertion | Where |
|-----------|--------|
| `orderAmount=2000` → tax 120, total 2120, `deductBalance` called | `packages/runner/tests/engine.test.ts` |
| `preview: true` → no `Func.run` | same |
| Successful sideEffect then later failure → `rollback` once | same |
| `callFunc.run` itself throws → no rollback frame | same |
| Unknown type / `$atom` / `funcKey` → `phase: "validate"` | `packages/core/tests/validate.test.ts` + runner |
| Infix string stays literal | `packages/core/tests/expr.test.ts` |
| Hosts/examples use `{ type, params }` + `funcs` | catalog examples + apps spot-check |

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

**Extensibility**: Horizon NodeTypes (`when`/`for`/`tryCatch`/…) and ExprAtoms (`$len`/`$at`/…) land in later engine versions, not via project `registerOperator`.

### Common Mistake: Expecting rollback when Func.run throws

**Symptom**: `deductBalance.run` throws → expect `rollback` to run.

**Cause**: Frames push only after successful `run` with `sideEffect: true`.

**Fix**: Test “later sibling fails after successful sideEffect” for rollback; test “run throws → no rollback”.
