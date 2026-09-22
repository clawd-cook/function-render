import type { CorpusEntry } from "../schema.ts";
import { specCase } from "./helpers.ts";

const P = "test/language/statements";
const CAT = "statements";

/** Control-flow statement semantics modeled with logic-render control NodeTypes. */
export const statementEntries: CorpusEntry[] = [
  specCase({
    id: "statements-if-cptn-else-false-nrml",
    path: `${P}/if/cptn-else-false-nrml.js`,
    esid: "sec-if-statement",
    category: CAT,
    description: "if (x > 0) → 'pos' else 'neg'; x=5 selects the true branch",
    input: { x: 5 },
    spec: {
      type: "if",
      params: {
        condition: { $gt: ["$.input.x", 0] },
        trueBranch: { type: "constant", params: { value: "pos" } },
        falseBranch: { type: "constant", params: { value: "neg" } },
      },
    },
    expectation: { kind: "value", expected: "pos" },
  }),
  specCase({
    id: "statements-if-cptn-else-true-abrupt-empty",
    path: `${P}/if/cptn-else-true-abrupt-empty.js`,
    category: CAT,
    description: "if (x > 0) → 'pos' else 'neg'; x=-1 selects the else branch",
    input: { x: -1 },
    spec: {
      type: "if",
      params: {
        condition: { $gt: ["$.input.x", 0] },
        trueBranch: { type: "constant", params: { value: "pos" } },
        falseBranch: { type: "constant", params: { value: "neg" } },
      },
    },
    expectation: { kind: "value", expected: "neg" },
  }),
  specCase({
    id: "statements-for-12.6.3_2-3-a-ii-10",
    path: `${P}/for/12.6.3_2-3-a-ii-10.js`,
    esid: "sec-for-statement",
    category: CAT,
    description: "for-loop accumulation: sum([1,2,3,4]) === 10",
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
              maxIter: 1000,
              body: { type: "set", params: { path: "$.sum", value: { $add: ["$.sum", "$.n"] } } },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 10 },
  }),
  specCase({
    id: "statements-for-12.6.3_2-3-a-ii-11",
    path: `${P}/for/12.6.3_2-3-a-ii-11.js`,
    category: CAT,
    description: "for-loop accumulation: sum([2,3,5]) === 10",
    input: { nums: [2, 3, 5] },
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
              maxIter: 1000,
              body: { type: "set", params: { path: "$.sum", value: { $add: ["$.sum", "$.n"] } } },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 10 },
  }),
  specCase({
    id: "statements-while-cptn-iter",
    path: `${P}/while/cptn-iter.js`,
    esid: "sec-while-statement",
    category: CAT,
    description: "while (i < 3) { sum += i; i++ } → sum === 3",
    input: {},
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.i", value: 0 } },
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "while",
            params: {
              condition: { $lt: ["$.i", 3] },
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
    expectation: { kind: "value", expected: 3 },
  }),
  specCase({
    id: "statements-while-cptn-no-iter",
    path: `${P}/while/cptn-no-iter.js`,
    category: CAT,
    description: "while (false) never runs the body → sum stays 0",
    input: {},
    spec: {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "while",
            params: {
              condition: { $lt: [1, 0] },
              maxIter: 100,
              body: { type: "set", params: { path: "$.sum", value: 999 } },
            },
          },
          { type: "get", params: { path: "$.sum" } },
        ],
      },
    },
    expectation: { kind: "value", expected: 0 },
  }),
  specCase({
    id: "statements-switch-cptn-abrupt-empty",
    path: `${P}/switch/cptn-abrupt-empty.js`,
    esid: "sec-switch-statement",
    category: CAT,
    description: "switch(status) matches case 200 → 'ok'",
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
    expectation: { kind: "value", expected: "ok" },
  }),
  specCase({
    id: "statements-switch-cptn-a-fall-thru-abrupt-empty",
    path: `${P}/switch/cptn-a-fall-thru-abrupt-empty.js`,
    category: CAT,
    description: "switch(status) with no matching case → default 'other'",
    input: { status: 999 },
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
    expectation: { kind: "value", expected: "other" },
  }),
  specCase({
    id: "statements-try-12.14-10",
    path: `${P}/try/12.14-10.js`,
    esid: "sec-try-statement",
    category: CAT,
    description: "try throws (assert false) → catch yields 'caught'",
    input: {},
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "assert", params: { condition: { $lt: [1, 0] }, message: "boom" } },
        catch: { type: "constant", params: { value: "caught" } },
      },
    },
    expectation: { kind: "value", expected: "caught" },
  }),
  specCase({
    id: "statements-try-12.14-11",
    path: `${P}/try/12.14-11.js`,
    category: CAT,
    description: "try body succeeds → 'ok' (catch not taken)",
    input: {},
    spec: {
      type: "tryCatch",
      params: {
        body: { type: "constant", params: { value: "ok" } },
        catch: { type: "constant", params: { value: "err" } },
      },
    },
    expectation: { kind: "value", expected: "ok" },
  }),
];
