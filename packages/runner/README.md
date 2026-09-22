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

- Validates via `@logic-renderer/core`, then walks the closed NodeType set (control / data / utility + `callFunc`).
- `preview: true` never calls `Func.run` and skips `sleep` (safety guarantee).
- Successful `sideEffect` callFuncs push rollback frames; on failure they run in reverse order.
