# Max-Flexibility Interface — Plan / Enact / Host

Thesis: this Module is not `run(spec)`. Callers **compile** any dialect of FlowSpec into a closed-Operator **Plan**, then a **Host enacts** that Plan under policies. Dialect, mode, rollback, `when` failure, and transport are knobs outside the Catalog. Operator Catalog is never a seam.

## 1. Interface

**Module**: `OperatorEngine` (takes over `packages/runner`; Plan replaces today's discriminant `Node`).

**Three entries** — no fourth sugar; order must stay visible:

- `compile(spec, { dialect, funcs? })` — sync, no I/O, O(nodes). Optional `funcs` rejects unknown `callFunc.funcKey`. AI validate-only stops here + `inspect`.
- `inspect(plan, { funcs? })` — sync. Slot read/write graph, sideEffect ledger, missing `maxIter`. Never touches Host.
- `enact(plan, EnactRequest)` — async. Same Plan, replay under another Host / mode / rollback / `whenUnmet`.

```ts
type Mode = "live" | "dry-run";
type Rollback = "compensate" | "snapshot-slots" | "none";
type WhenUnmet = "skip" | "fail" | "continue";

interface EnactRequest {
  host: Host;
  funcs: FuncRegistry;
  input: unknown;       // sealed into $.input
  mode: Mode;
  rollback: Rollback;
  whenUnmet: WhenUnmet; // default; NodeSpec.params.onUnmet overrides
}

interface Enactment {
  slots: Record<string, unknown>;
  result: unknown;
  effects: EffectLedger; // ran vs dry-run-skipped sideEffect rows
  rolledBack: boolean;
}

type Plan; // opaque + JSON-serializable closed IR. Callers do not mutate it.
```

**Invariants**

- Plan NodeType ⊆ closed Operator Catalog. Unknown `type` dies in compile; enact never re-parses dialect.
- Business Func is never a NodeType. Sole invocation Operator: `callFunc` + `params.funcKey`.
- Math / compare / logic are **not** NodeTypes. They are ExprDialect atoms. `expr` / `when` / `if` conditions evaluate through the dialect, so a new dialect does not grow the Catalog. (Revises PRD R3: math nodes are a closed-set trap once dialects matter.)
- Pure Operators have no sideEffect. The effect rail is only `callFunc` (Func.`sideEffect: true`) and `sleep`.
- `compile` / `inspect` never call Func `run` or `rollback`.
- dry-run runs every pure Operator and writes Slots; sideEffect `callFunc` / `sleep` only schema-check args and ledger `skipped`.
- live failure: pop the effect stack **reverse-order** per `rollback`. `none` = today's fail-fast.
- `for` / `while` / `arrayReduce` without `maxIter` → compile fail.
- `when` cond false → `whenUnmet`: skip body / fail / continue to next sibling.

**Error modes** (discriminated; callers must branch)

- `CompileFailure` — illegal NodeType, dialect parse, missing params/`maxIter`, bad Slot literal.
- `EnactError.validation` — `callFunc` args fail Func schema (dry-run too).
- `EnactError.unregistered` — `funcKey` absent from FuncRegistry.
- `EnactError.func` — Func.run threw.
- `EnactError.whenUnmet` — strategy `fail`.
- `EnactError.compensate` — rollback hook failed; original error on `cause`.
- `EnactError.host` — HttpHost transport.

**Performance the caller must budget**

- Plan is serializable IR. HttpHost sends **one round-trip for the whole graph**. Per-node HTTP is forbidden (it would shred locality).
- live latency ≈ Σ sideEffect `callFunc`. dry-run / inspect are CPU.
- `snapshot-slots` clones Slots at each effect node: memory O(effects × Slot size).
- `compensate` pays Func.rollback latency once more.
- `arrayMap` / `arrayReduce` nest a full subtree; cost is the iteration product. compile does not unroll.

**Refused entries**: no `registerOperator`. no per-Operator port.

## 2. Usage

Checkout: tax → total → threshold `when` → `callFunc deductBalance`.

```ts
const plan = compile(spec, { dialect: slotExpr, funcs });
inspect(plan, { funcs }); // AI: effect ledger + Slot graph, no Host
await enact(plan, { host: inProcess, funcs, input, mode: "dry-run", rollback: "none", whenUnmet: "skip" });
await enact(plan, { host: httpHost, funcs, input, mode: "live", rollback: "compensate", whenUnmet: "fail" });
```

```json
{
  "type": "then",
  "params": { "steps": [
    { "type": "expr", "params": { "eval": { "$mul": ["$.input.amount", "$.input.rate"] } }, "outputTo": "tax" },
    { "type": "expr", "params": { "eval": { "$add": ["$.input.amount", "$.tax"] } }, "outputTo": "total" },
    { "type": "when", "params": {
      "cond": { "$gt": ["$.total", "$.input.threshold"] },
      "onUnmet": "fail",
      "body": {
        "type": "callFunc",
        "params": {
          "funcKey": "deductBalance",
          "args": { "accountId": "$.input.accountId", "amount": "$.total" }
        }
      }
    }}
  ]}
}
```

Same Plan under `LegacyExpr` can keep today's `$add` / `$state` / JSON Pointer in `eval`/`cond`. NodeType does not change.

## 3. Implementation 藏什么

- **Operator dispatch**: closed table (`then`/`when`/`if`/…/`callFunc`/`expr`/`sleep`). Callers only see Plan.
- **Dialect eval**: compile lowers SlotExpr or LegacyExpr to Slot reads + atoms on the IR. enact never parses `$add` or `/pointer`.
- **dry-run short-circuit**: Host checks Func.`sideEffect` and `sleep` before `run`; validate + ledger only; no rollback push.
- **rollback stack**: private to enact. sideEffect `callFunc` stores `{ funcKey, args, rollback }`; `sleep` stores a no-op compensate. `snapshot-slots` stores a Slot clone. Reverse pop on live failure only.
- **Legacy discriminant nodes** (`call`/`seq`/`if`): lifted to Plan inside the LegacyExpr adapter — not a second Catalog.

## 4. Seam / Adapter

**Operator Catalog is not a seam.** One closed table. A second “custom Operator adapter” = open NodeType = breaks enumerable Operators. Tests that want a subset pass `compile(..., { allowTypes })` — a filter on the same table, not adapter two.

Real seams (two adapters each, or do not open):

1. **FuncRegistry** (true external)  
   - Production: `ProjectFuncRegistry` (real deduct / DB).  
   - Test: `MemoryFuncRegistry` (fake `deductBalance` + assertable rollback).  
   Engine sees only `get` / `schema` / `sideEffect` / `run` / `rollback`.

2. **Host** (remote-but-owned)  
   - `InProcessHost` — evolve `packages/runner`.  
   - `HttpHost` — POST `{ plan, input, policies }`; peer is still InProcessHost.  
   Two adapters make this a real seam: in-suite vs HTTP worker, one enact Implementation.

3. **ExprDialect** (compile-time; two dialects already exist)  
   - `SlotExpr` — `$.path` + light atoms (proposal).  
   - `LegacyExpr` — current `packages/core/src/expr.ts` (`$add` / `$state` / JSON Pointer).  
   Verdict on Q1/Q2: coexist at compile; no dual stack at enact.

`rollback` / `whenUnmet` / `mode` are **enact policy enums**, not adapters. Do not invent a Rollback port.

## 5. Trade-offs

**Leverage high**: one Plan covers live, dry-run, AI inspect, HTTP preview, three rollbacks, three `when` policies. Checkout needs zero new NodeTypes. Delete this Module and every caller rewrites compile, effect ledger, reverse compensate, dialect lifting.

**Leverage thin**: three entries + policy enums are heavier than one `run()`. Callers must treat Plan as opaque and compile first. Misusing HttpHost per-node would flatten depth — the Interface forbids it.

**Locality**: dialect bugs stay in compile adapters; sideEffect / rollback / dry-run stay in Host enact; business stays in FuncRegistry. Catalog does not grow with Funcs.

**Versus repo**: discriminant `Node` + `$add` **adapt as LegacyExpr**, not a hard cutover. `packages/catalog` `add`/`sub` drop out of Func and become dialect atoms (kills the expr↔catalog leak); `delay` → `sleep`; the rest enter FuncRegistry. `runner.run` becomes a thin InProcessHost wrapper defaulting `rollback: "none"` so fail-fast survives until a caller opts into compensate. JSON Pointer lives only inside LegacyExpr; new FlowSpec uses Slot.

**Depth**: callers learn 3 entries + 2 runtime seams + 3 policy enums, and get a closed Catalog, swappable dialects, a replayable Plan, and AI that never needs a Host. That is the deepest shape flexibility can buy. An Operator plugin bus would only make the Module shallow.
