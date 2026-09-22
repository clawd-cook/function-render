# @logic-renderer/catalog

Demo FuncRegistry helpers and shared example FlowSpecs.

```ts
import { examples, standardCatalog } from "@logic-renderer/catalog";
import { run } from "@logic-renderer/runner";

const { spec, input } = examples["math-pipeline"];
const { state, result } = await run(spec, { funcs: standardCatalog, input });
```

Arithmetic is **not** in the catalog — use ExprAtom `$add` / `$mul` / `$gt`.
`add` / `sub` / `mul` / `div` / `delay` were removed.
