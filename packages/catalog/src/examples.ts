// oxlint-disable unicorn/no-thenable -- `then` is a NodeType in these fixtures
import type { FlowSpec } from "@logic-renderer/core";

export interface ExampleSpec {
  description: string;
  spec: FlowSpec;
  /** Becomes `options.input` for `run`. */
  input?: unknown;
}

/**
 * Shared example specs for demo apps. Arithmetic uses ExprAtom; business
 * calls use `callFunc`. Includes horizon NodeTypes (`for` / `when` / `switch` / `arrayMap`).
 */
export const examples = {
  "math-pipeline": {
    description: "Multiply two inputs then add a constant (then + $mul/$add + set).",
    input: { a: 6, b: 7 },
    spec: {
      type: "then",
      params: {
        nodes: [
          {
            type: "set",
            params: { path: "$.product", value: { $mul: ["$.input.a", "$.input.b"] } },
          },
          {
            type: "set",
            params: { path: "$.total", value: { $add: ["$.product", 100] } },
          },
        ],
      },
    },
  },
  greeting: {
    description: "Uppercase a name and build a greeting (callFunc).",
    input: { name: "ada" },
    spec: {
      type: "then",
      params: {
        nodes: [
          {
            type: "callFunc",
            params: { funcKey: "upper", args: { value: "$.input.name" } },
            outputTo: "$.upper",
          },
          {
            type: "callFunc",
            params: {
              funcKey: "concat",
              args: { values: ["Hello, ", "$.upper", "!"] },
            },
            outputTo: "$.greeting",
          },
        ],
      },
    },
  },
  conditional: {
    description: "Branch on a score threshold (if + $gt).",
    input: { score: 75 },
    spec: {
      type: "if",
      params: {
        condition: { $gt: ["$.input.score", 59] },
        trueBranch: {
          type: "callFunc",
          params: { funcKey: "concat", args: { values: ["pass"] } },
        },
        falseBranch: {
          type: "callFunc",
          params: { funcKey: "concat", args: { values: ["fail"] } },
        },
      },
    },
  },
  settlement: {
    description: "Tax + total + conditional deductBalance (settlement demo).",
    input: { orderAmount: 2000, merchantId: "m1" },
    spec: {
      type: "then",
      params: {
        nodes: [
          {
            type: "set",
            params: {
              path: "$.tax",
              value: { $mul: ["$.input.orderAmount", 0.06] },
            },
          },
          {
            type: "set",
            params: {
              path: "$.totalAmount",
              value: { $add: ["$.input.orderAmount", "$.tax"] },
            },
          },
          {
            type: "if",
            params: {
              condition: { $gt: ["$.totalAmount", 1000] },
              trueBranch: {
                type: "callFunc",
                params: {
                  funcKey: "deductBalance",
                  args: {
                    merchantId: "$.input.merchantId",
                    amount: "$.totalAmount",
                  },
                },
                outputTo: "$.receipt",
              },
            },
          },
        ],
      },
    },
  },
  "sum-for": {
    description: "Sum an array with for + itemKey binding.",
    input: { nums: [1, 2, 3, 4] },
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "for",
            params: {
              items: "$.input.nums",
              itemKey: "n",
              maxIter: 100,
              body: {
                type: "set",
                params: { path: "$.sum", value: { $add: ["$.sum", "$.n"] } },
              },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
  },
  "parallel-when": {
    description: "Run two constant/expr nodes in parallel with when.",
    input: {},
    spec: {
      type: "when",
      params: {
        nodes: [
          { type: "constant", params: { value: "left" } },
          { type: "expr", params: { value: { $add: [10, 20] } } },
        ],
      },
    },
  },
  "status-switch": {
    description: "Dispatch on a status code with switch.",
    input: { status: 200 },
    spec: {
      type: "switch",
      params: {
        input: "$.input.status",
        cases: [
          { match: 200, node: { type: "constant", params: { value: "ok" } } },
          { match: 404, node: { type: "constant", params: { value: "missing" } } },
        ],
        default: { type: "constant", params: { value: "other" } },
      },
    },
  },
  "double-arrayMap": {
    description: "Double each number with arrayMap + $mul.",
    input: { nums: [1, 2, 3] },
    spec: {
      type: "arrayMap",
      params: {
        items: "$.input.nums",
        itemKey: "n",
        body: { type: "expr", params: { value: { $mul: ["$.n", 2] } } },
      },
    },
  },
} satisfies Record<string, ExampleSpec>;

export type ExampleName = keyof typeof examples;
