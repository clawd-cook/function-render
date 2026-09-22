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
 * calls use `callFunc`. All use v1 NodeTypes only.
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
    description: "Tax + total + conditional deductBalance (v1 settlement demo).",
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
} satisfies Record<string, ExampleSpec>;

export type ExampleName = keyof typeof examples;
