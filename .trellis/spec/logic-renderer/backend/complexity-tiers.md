# Progressive complexity tiers (L0–L5)

## Scenario: JS-aligned DSL learning & catalog growth

### 1. Scope / Trigger

- Docs Guide chapters, engine catalog expansion, and `NODE_COMPLEXITY` / `EXPR_COMPLEXITY` in `@logic-renderer/core` share one ladder.
- Trigger: adding a NodeType / ExprAtom, rewriting Guide order, or explaining “what to learn first”.

### 2. Ladder

| Tier | Blurb | NodeType | ExprAtom |
|------|-------|----------|----------|
| **L0** | 基础可运行 | `then` `if` `set` `get` `callFunc` | `$add` `$mul` `$gt` `$lit` |
| **L1** | 控制流补全 | `switch` `tryCatch` | — |
| **L2** | 有界循环 | `while` `for` | — |
| **L3** | 表达式加宽 | — | remaining closed ExprAtoms |
| **L4** | 索引集合高阶 | `arrayMap` `arrayFilter` `arrayReduce` | — |
| **L5** | 并发与工具 | `when` `log` `assert` `sleep` `constant` `expr` | — |

Source of truth in code: `packages/core/src/complexity.ts` (`NODE_COMPLEXITY`, `EXPR_COMPLEXITY`, `COMPLEXITY_TIER_BLURB`).

### 3. Contracts

| Rule | Detail |
|------|--------|
| Lower does not depend on higher | L0 settlement demo must not require L4/L5 nodes |
| Docs Guide order | Grammar → Control → Loops → Functions → Expressions → Collections mirrors L0→L4 |
| Catalog growth | Engine versions may add rows only by assigning a tier; projects never `registerOperator` |
| `$map` | Never an ExprAtom (would break L3 purity); use L4 `arrayMap` |

### 4. Wrong vs Correct

#### Wrong

Treat every closed NodeType as equally “basic”; put `arrayMap` before `if` in onboarding.

#### Correct

Teach L0 first (`then`/`if`/`set`/`callFunc` + `$mul`/`$add`/`$gt`); introduce loops and collections after.

### 5. Related

- Runtime API: [operator-runtime-api.md](./operator-runtime-api.md)
- Docs: `apps/docs/guide/rationale.md`, `apps/docs/reference/`
