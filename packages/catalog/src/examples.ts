// oxlint-disable unicorn/no-thenable -- `then` is an `if`-node spec field name in these fixtures
import type { Node } from "@function-renderer/core";

export interface ExampleSpec {
  description: string;
  spec: Node;
  initialState?: Record<string, unknown>;
}

/**
 * Shared example specs used by every demo app (node-service / react / vue) so
 * the three frameworks demonstrate identical behaviour. Each only references
 * functions in `standardCatalog`.
 */
export const examples = {
  "math-pipeline": {
    description: "Multiply two inputs then add a constant (seq + $state + out).",
    initialState: { a: 6, b: 7 },
    spec: {
      seq: [
        { call: "mul", args: { a: { $state: "/a" }, b: { $state: "/b" } }, out: "/product" },
        { call: "add", args: { a: { $state: "/product" }, b: 100 }, out: "/total" },
      ],
    },
  },
  greeting: {
    description: "Uppercase a name and build a greeting (string functions).",
    initialState: { name: "ada" },
    spec: {
      seq: [
        { call: "upper", args: { value: { $state: "/name" } }, out: "/upper" },
        {
          call: "concat",
          args: { values: ["Hello, ", { $state: "/upper" }, "!"] },
          out: "/greeting",
        },
      ],
    },
  },
  conditional: {
    description: "Branch on a score threshold (if / then / else).",
    initialState: { score: 75 },
    spec: {
      if: { $state: "/score", gte: 60 },
      then: { call: "concat", args: { values: ["pass"] } },
      else: { call: "concat", args: { values: ["fail"] } },
    },
  },
  "parallel-demo": {
    description: "Run two independent computations concurrently (parallel).",
    initialState: { x: 5 },
    spec: {
      parallel: [
        { call: "mul", args: { a: { $state: "/x" }, b: 2 } },
        { call: "add", args: { a: { $state: "/x" }, b: 10 } },
      ],
    },
  },
} satisfies Record<string, ExampleSpec>;

export type ExampleName = keyof typeof examples;
