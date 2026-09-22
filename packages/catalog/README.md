# @function-renderer/catalog

Catalog helpers, a standard function library, and shared example specs for the
function renderer. The demo apps (`node-service`, `react`, `vue`) all import the
same `standardCatalog` and `examples` so they behave identically.

## Helpers

- `defineFunction({ params, run })` — define a function whose `args` type is
  inferred from its zod `params` schema.
- `defineCatalog(catalog)` — identity helper that preserves the literal catalog
  type for key autocomplete.

## Standard functions (`standardCatalog`)

`add`, `sub`, `mul`, `div`, `concat`, `upper`, `lower`, `length`, `delay`, `now`
— each with a zod `params` schema.

## Examples

```ts
import { standardCatalog, examples } from "@function-renderer/catalog";
import { run } from "@function-renderer/runner";

const { spec, initialState } = examples["math-pipeline"];
const { state, result } = await run(spec, { catalog: standardCatalog, initialState });
// state.total === 142, result === 142
```

Available examples: `math-pipeline`, `greeting`, `conditional`, `parallel-demo`.
