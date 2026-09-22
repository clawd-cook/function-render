# @logic-renderer/core

Parsing / validation layer for the function renderer.

## Surface

- **Schema** — `{ type, params, outputTo? }` NodeSpec; ExprAtom objects; Slot `$.path`
- **Slot** — `getSlot` / `setSlot`; `$.input` is readonly
- **Expressions** — `evaluate` / `resolveArgs` / `evaluateCondition` (v1: `$add` `$mul` `$gt` `$lit`)
- **Validation** — `validate(spec, { funcs })` (does not execute Funcs)
- **Errors** — `FunctionRenderError` with `phase: "validate" | "run" | "rollback"`

```ts
import { validate } from "@logic-renderer/core";

const flow = validate(spec, { funcs: { deductBalance } });
```
