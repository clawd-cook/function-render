# @logic-renderer/runner

Execution layer: `run(spec, { input, funcs, preview? })`.

```ts
import { run } from "@logic-renderer/runner";

const { state, result } = await run(spec, {
  input: { orderAmount: 2000, merchantId: "m1" },
  funcs: { deductBalance },
  preview: false,
});
```

- Validates via `@logic-renderer/core`, then walks v1 NodeTypes (`then` / `if` / `set` / `callFunc`).
- `preview: true` never calls `Func.run` (safety guarantee).
- Successful `sideEffect` callFuncs push rollback frames; on failure they run in reverse order.
