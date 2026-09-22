import type { CorpusEntry } from "../schema.ts";
import { specCase } from "./helpers.ts";

const P = "test/language/statements";
const CAT = "statements";

const sumForSpec = (nums: string) => ({
  type: "then" as const,
  params: {
    nodes: [
      { type: "set", params: { path: "$.sum", value: 0 } },
      {
        type: "for",
        params: {
          items: nums,
          itemKey: "n",
          maxIter: 1000,
          body: { type: "set", params: { path: "$.sum", value: { $add: ["$.sum", "$.n"] } } },
        },
      },
      { type: "get", params: { path: "$.sum" } },
    ],
  },
});

const switchSpec = {
  type: "switch" as const,
  params: {
    input: "$.input.k",
    cases: [
      { match: 1, node: { type: "constant", params: { value: "one" } } },
      { match: 2, node: { type: "constant", params: { value: "two" } } },
    ],
    default: { type: "constant", params: { value: "other" } },
  },
};

/** More control-flow variants: block, for, while, switch, try/finally. */
export const statementsMoreEntries: CorpusEntry[] = [
  specCase({
    id: "statements-block-12.1-1",
    path: `${P}/block/12.1-1.js`,
    esid: "sec-block",
    category: CAT,
    description: "block { x=1; y=2; x+y } === 3 (modeled as then)",
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.x", value: 1 } },
          { type: "set", params: { path: "$.y", value: 2 } },
          { type: "expr", params: { value: { $add: ["$.x", "$.y"] } } },
        ],
      },
    },
    expectation: { kind: "value", expected: 3 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A10_T1",
    path: `${P}/for/S12.6.3_A10_T1.js`,
    category: CAT,
    description: "for sum([1,2,3]) === 6",
    input: { nums: [1, 2, 3] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 6 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A10_T2",
    path: `${P}/for/S12.6.3_A10_T2.js`,
    category: CAT,
    description: "for sum([10,20]) === 30",
    input: { nums: [10, 20] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 30 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A11.1_T1",
    path: `${P}/for/S12.6.3_A11.1_T1.js`,
    category: CAT,
    description: "for product([2,3,4]) === 24",
    input: { nums: [2, 3, 4] },
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.p", value: 1 } },
          {
            type: "for",
            params: {
              items: "$.input.nums",
              itemKey: "n",
              maxIter: 1000,
              body: { type: "set", params: { path: "$.p", value: { $mul: ["$.p", "$.n"] } } },
            },
          },
          { type: "get", params: { path: "$.p" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 24 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A11.1_T2",
    path: `${P}/for/S12.6.3_A11.1_T2.js`,
    category: CAT,
    description: "for sum([5,5,5]) === 15",
    input: { nums: [5, 5, 5] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 15 },
  }),
  specCase({
    id: "statements-while-S12.6.2_A1",
    path: `${P}/while/S12.6.2_A1.js`,
    esid: "sec-while-statement",
    category: CAT,
    description: "while (i<4) sum+=i → 6",
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.i", value: 0 } },
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "while",
            params: {
              condition: { $lt: ["$.i", 4] },
              maxIter: 100,
              body: {
                type: "then",
                params: {
                  nodes: [
                    { type: "set", params: { path: "$.sum", value: { $add: ["$.sum", "$.i"] } } },
                    { type: "set", params: { path: "$.i", value: { $add: ["$.i", 1] } } },
                  ],
                },
              },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 6 },
  }),
  specCase({
    id: "statements-while-S12.6.2_A2",
    path: `${P}/while/S12.6.2_A2.js`,
    category: CAT,
    description: "while (false) → sum stays 0",
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "while",
            params: {
              condition: false,
              maxIter: 10,
              body: { type: "set", params: { path: "$.sum", value: 1 } },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 0 },
  }),
  specCase({
    id: "statements-while-S12.6.2_A4_T1",
    path: `${P}/while/S12.6.2_A4_T1.js`,
    category: CAT,
    description: "while counts 5 iterations → c === 5",
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.i", value: 0 } },
          { type: "set", params: { path: "$.c", value: 0 } },
          {
            type: "while",
            params: {
              condition: { $lt: ["$.i", 5] },
              maxIter: 100,
              body: {
                type: "then",
                params: {
                  nodes: [
                    { type: "set", params: { path: "$.c", value: { $add: ["$.c", 1] } } },
                    { type: "set", params: { path: "$.i", value: { $add: ["$.i", 1] } } },
                  ],
                },
              },
            },
          },
          { type: "get", params: { path: "$.c" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 5 },
  }),
  specCase({
    id: "statements-switch-S12.11_A1_T1",
    path: `${P}/switch/S12.11_A1_T1.js`,
    esid: "sec-switch-statement",
    category: CAT,
    description: "switch(1) → 'one'",
    input: { k: 1 },
    spec: switchSpec,
    expectation: { kind: "value", expected: "one" },
  }),
  specCase({
    id: "statements-switch-S12.11_A1_T2",
    path: `${P}/switch/S12.11_A1_T2.js`,
    category: CAT,
    description: "switch(2) → 'two'",
    input: { k: 2 },
    spec: switchSpec,
    expectation: { kind: "value", expected: "two" },
  }),
  specCase({
    id: "statements-switch-S12.11_A1_T3",
    path: `${P}/switch/S12.11_A1_T3.js`,
    category: CAT,
    description: "switch(3) → default 'other'",
    input: { k: 3 },
    spec: switchSpec,
    expectation: { kind: "value", expected: "other" },
  }),
  specCase({
    id: "statements-switch-S12.11_A2_T1",
    path: `${P}/switch/S12.11_A2_T1.js`,
    category: CAT,
    description: "switch on string 'a' → 'A'",
    input: { k: "a" },
    spec: {
      type: "switch",
      params: {
        input: "$.input.k",
        cases: [
          { match: "a", node: { type: "constant", params: { value: "A" } } },
          { match: "b", node: { type: "constant", params: { value: "B" } } },
        ],
        default: { type: "constant", params: { value: "?" } },
      },
    },
    expectation: { kind: "value", expected: "A" },
  }),
  specCase({
    id: "statements-switch-S12.11_A3_T1",
    path: `${P}/switch/S12.11_A3_T1.js`,
    category: CAT,
    description: "switch(99) with no match → default",
    input: { k: 99 },
    spec: switchSpec,
    expectation: { kind: "value", expected: "other" },
  }),
  specCase({
    id: "statements-switch-S12.11_A3_T2",
    path: `${P}/switch/S12.11_A3_T2.js`,
    category: CAT,
    description: "switch(2) hits case 'two'",
    input: { k: 2 },
    spec: switchSpec,
    expectation: { kind: "value", expected: "two" },
  }),
  specCase({
    id: "statements-try-S12.14_A10_T1",
    path: `${P}/try/S12.14_A10_T1.js`,
    esid: "sec-try-statement",
    category: CAT,
    description: "try throws → catch 'recovered', finally runs",
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "assert", params: { condition: false, message: "x" } },
        catch: { type: "constant", params: { value: "recovered" } },
        finally: { type: "set", params: { path: "$.done", value: true } },
      },
    },
    expectation: { kind: "value", expected: "recovered" },
  }),
  specCase({
    id: "statements-try-S12.14_A10_T2",
    path: `${P}/try/S12.14_A10_T2.js`,
    category: CAT,
    description: "try succeeds → 'ok' (catch skipped)",
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "constant", params: { value: "ok" } },
        catch: { type: "constant", params: { value: "err" } },
      },
    },
    expectation: { kind: "value", expected: "ok" },
  }),
  specCase({
    id: "statements-try-S12.14_A10_T3",
    path: `${P}/try/S12.14_A10_T3.js`,
    category: CAT,
    description: "nested try: inner throws → inner catch 'inner'",
    spec: {
      type: "tryCatch",
      params: {
        body: {
          type: "tryCatch",
          params: {
            body: { type: "assert", params: { condition: false, message: "x" } },
            catch: { type: "constant", params: { value: "inner" } },
          },
        },
        catch: { type: "constant", params: { value: "outer" } },
      },
    },
    expectation: { kind: "value", expected: "inner" },
  }),
  specCase({
    id: "statements-try-S12.14_A11_T1",
    path: `${P}/try/S12.14_A11_T1.js`,
    category: CAT,
    description: "try throws → catch yields numeric 42",
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "assert", params: { condition: { $lt: [1, 0] }, message: "x" } },
        catch: { type: "constant", params: { value: 42 } },
      },
    },
    expectation: { kind: "value", expected: 42 },
  }),
  specCase({
    id: "statements-try-S12.14_A11_T2",
    path: `${P}/try/S12.14_A11_T2.js`,
    category: CAT,
    description: "try succeeds → 'done'; finally side effect only",
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "constant", params: { value: "done" } },
        catch: { type: "constant", params: { value: "err" } },
        finally: { type: "set", params: { path: "$.flag", value: 1 } },
      },
    },
    expectation: { kind: "value", expected: "done" },
  }),
];
