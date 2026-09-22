# @logic-renderer/runner

Execution layer for the function renderer. Validates a JSON orchestration spec
(via `@logic-renderer/core`) and runs it against a catalog of functions,
maintaining a single shared state addressed by JSON Pointer.

## Usage

```ts
import { run } from "@logic-renderer/runner";
import { z } from "zod";

const catalog = {
  // Bare function (no argument schema)
  add: ({ a, b }: { a: number; b: number }) => a + b,
  // With a zod schema: args are validated before `run`
  greet: {
    params: z.object({ name: z.string() }),
    run: ({ name }) => `Hello, ${name}!`,
  },
};

const spec = {
  seq: [
    { call: "add", args: { a: { $state: "/x" }, b: 2 }, out: "/sum" },
    { call: "greet", args: { name: "Ada" }, out: "/greeting" },
  ],
};

const { state, result } = await run(spec, { catalog, initialState: { x: 40 } });
// state  => { x: 40, sum: 42, greeting: "Hello, Ada!" }
// result => "Hello, Ada!"  (last node of the top-level seq)
```

## Semantics

- `call` — resolve `args` (`$state` reads shared state), validate with `params`
  when present, invoke `run(args, ctx)`, optionally write the return value to
  `out`.
- `seq` — run children in order; result is the last child's.
- `parallel` — `Promise.all` over children; result is the array of results.
- `if` — evaluate the condition and run `then` / `else`.

**Fail-fast:** the first thrown function error aborts the run with a
`FunctionRenderError` (`kind: "call"`, with `path`, `fnName`, `cause`). A
`parallel` branch failure fails the whole run. Invalid `params` produce a
`FunctionRenderError` with `kind: "validation"`.
