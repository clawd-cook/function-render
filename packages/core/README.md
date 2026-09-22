# @function-renderer/core

Parsing layer for the function renderer. Framework-agnostic, pure logic — no
execution engine and no UI. It provides the shared building blocks consumed by
`@function-renderer/runner`, `@function-renderer/catalog`, and the demo apps.

## What's inside

- **Schema & types** (`schema.ts`) — zod schemas and inferred types for the
  orchestration spec: `DynamicValue`, `Condition`, and `Node`
  (`call` / `seq` / `parallel` / `if`).
- **State** (`state.ts`) — a single shared, mutable state addressed by JSON
  Pointer: `getByPath`, `setByPath`, `parsePointer`, `isJsonPointer`.
- **Expressions** (`expr.ts`) — `resolveArgs` (resolves `{ $state }` inside
  call arguments) and `evaluateCondition` (`$state` + comparisons, `$and`,
  `$or`, implicit AND).
- **Validation** (`validate.ts`) — `validate(spec, fnNames?)` checks the spec
  structure and (optionally) that every `call` targets a known function.
- **Errors** (`errors.ts`) — `FunctionRenderError` with `kind`, `path`, `fnName`.

## Spec at a glance

```jsonc
{
  "seq": [
    { "call": "fetchUser", "args": { "id": { "$state": "/input/id" } }, "out": "/user" },
    {
      "if": { "$state": "/user/active" },
      "then": {
        "parallel": [
          { "call": "loadOrders", "args": { "uid": { "$state": "/user/id" } } },
          { "call": "loadProfile", "args": { "uid": { "$state": "/user/id" } } },
        ],
      },
    },
  ],
}
```

## Example

```ts
import { validate, resolveArgs, getByPath, setByPath } from "@function-renderer/core";

const node = validate({ call: "add", args: { a: { $state: "/x" }, b: 2 } }, ["add"]);

const state = { x: 40 };
const ctx = { get: (p: string) => getByPath(state, p) };
resolveArgs((node as { args: any }).args, ctx); // { a: 40, b: 2 }
```

Execution (running a validated `Node` against a catalog) lives in
`@function-renderer/runner`.
