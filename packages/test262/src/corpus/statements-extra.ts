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

/** More `if` (incl. else-if chain) and `for` accumulation variants. */
export const statementsExtraEntries: CorpusEntry[] = [
  specCase({
    id: "statements-if-S12.5_A1.1_T1",
    path: `${P}/if/S12.5_A1.1_T1.js`,
    esid: "sec-if-statement",
    category: CAT,
    description: "if (true) 1 else 2 === 1",
    spec: {
      type: "if",
      params: {
        condition: true,
        trueBranch: { type: "constant", params: { value: 1 } },
        falseBranch: { type: "constant", params: { value: 2 } },
      },
    },
    expectation: { kind: "value", expected: 1 },
  }),
  specCase({
    id: "statements-if-S12.5_A1.2_T1",
    path: `${P}/if/S12.5_A1.2_T1.js`,
    category: CAT,
    description: "if (false) 1 else 2 === 2",
    spec: {
      type: "if",
      params: {
        condition: false,
        trueBranch: { type: "constant", params: { value: 1 } },
        falseBranch: { type: "constant", params: { value: 2 } },
      },
    },
    expectation: { kind: "value", expected: 2 },
  }),
  specCase({
    id: "statements-if-S12.5_A10_T1",
    path: `${P}/if/S12.5_A10_T1.js`,
    category: CAT,
    description: "else-if chain: x=5 → 'small' (>10 big / >0 small / else neg)",
    input: { x: 5 },
    spec: {
      type: "if",
      params: {
        condition: { $gt: ["$.input.x", 10] },
        trueBranch: { type: "constant", params: { value: "big" } },
        falseBranch: {
          type: "if",
          params: {
            condition: { $gt: ["$.input.x", 0] },
            trueBranch: { type: "constant", params: { value: "small" } },
            falseBranch: { type: "constant", params: { value: "neg" } },
          },
        },
      },
    },
    expectation: { kind: "value", expected: "small" },
  }),
  specCase({
    id: "statements-for-S12.6.3_A11_T1",
    path: `${P}/for/S12.6.3_A11_T1.js`,
    category: CAT,
    description: "for sum([1,2,3,4,5]) === 15",
    input: { nums: [1, 2, 3, 4, 5] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 15 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A11_T2",
    path: `${P}/for/S12.6.3_A11_T2.js`,
    category: CAT,
    description: "for sum([2,4,6]) === 12",
    input: { nums: [2, 4, 6] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 12 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A11_T3",
    path: `${P}/for/S12.6.3_A11_T3.js`,
    category: CAT,
    description: "for sum([7]) === 7",
    input: { nums: [7] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 7 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A10.1_T1",
    path: `${P}/for/S12.6.3_A10.1_T1.js`,
    category: CAT,
    description: "for sum([0,0,0]) === 0",
    input: { nums: [0, 0, 0] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 0 },
  }),
  specCase({
    id: "statements-for-S12.6.3_A10.1_T2",
    path: `${P}/for/S12.6.3_A10.1_T2.js`,
    category: CAT,
    description: "for sum([100]) === 100",
    input: { nums: [100] },
    spec: sumForSpec("$.input.nums"),
    expectation: { kind: "value", expected: 100 },
  }),
];
