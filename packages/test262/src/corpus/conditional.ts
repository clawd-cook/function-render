import type { CorpusEntry } from "../schema.ts";
import { specCase } from "./helpers.ts";

const P = "test/language/expressions/conditional";
const CAT = "expressions";

/** Ternary `cond ? a : b` modeled with the `if` NodeType (branch value = result). */
export const conditionalEntries: CorpusEntry[] = [
  specCase({
    id: "expressions-conditional-S11.12_A1",
    path: `${P}/S11.12_A1.js`,
    esid: "sec-conditional-operator",
    category: CAT,
    description: "true ? 'T' : 'F' === 'T'",
    spec: {
      type: "if",
      params: {
        condition: true,
        trueBranch: { type: "constant", params: { value: "T" } },
        falseBranch: { type: "constant", params: { value: "F" } },
      },
    },
    expectation: { kind: "value", expected: "T" },
  }),
  specCase({
    id: "expressions-conditional-S11.12_A2.1_T1",
    path: `${P}/S11.12_A2.1_T1.js`,
    category: CAT,
    description: "false ? 'T' : 'F' === 'F'",
    spec: {
      type: "if",
      params: {
        condition: false,
        trueBranch: { type: "constant", params: { value: "T" } },
        falseBranch: { type: "constant", params: { value: "F" } },
      },
    },
    expectation: { kind: "value", expected: "F" },
  }),
  specCase({
    id: "expressions-conditional-S11.12_A2.1_T2",
    path: `${P}/S11.12_A2.1_T2.js`,
    category: CAT,
    description: "(5 > 3) ? 10 : 20 === 10",
    spec: {
      type: "if",
      params: {
        condition: { $gt: [5, 3] },
        trueBranch: { type: "constant", params: { value: 10 } },
        falseBranch: { type: "constant", params: { value: 20 } },
      },
    },
    expectation: { kind: "value", expected: 10 },
  }),
  specCase({
    id: "expressions-conditional-S11.12_A2.1_T3",
    path: `${P}/S11.12_A2.1_T3.js`,
    category: CAT,
    description: "(5 < 3) ? 10 : 20 === 20",
    spec: {
      type: "if",
      params: {
        condition: { $lt: [5, 3] },
        trueBranch: { type: "constant", params: { value: 10 } },
        falseBranch: { type: "constant", params: { value: 20 } },
      },
    },
    expectation: { kind: "value", expected: 20 },
  }),
  specCase({
    id: "expressions-conditional-S11.12_A2.1_T4",
    path: `${P}/S11.12_A2.1_T4.js`,
    category: CAT,
    description: "nested ternary (1>0) ? ((2>1)?'a':'b') : 'c' === 'a'",
    spec: {
      type: "if",
      params: {
        condition: { $gt: [1, 0] },
        trueBranch: {
          type: "if",
          params: {
            condition: { $gt: [2, 1] },
            trueBranch: { type: "constant", params: { value: "a" } },
            falseBranch: { type: "constant", params: { value: "b" } },
          },
        },
        falseBranch: { type: "constant", params: { value: "c" } },
      },
    },
    expectation: { kind: "value", expected: "a" },
  }),
  specCase({
    id: "expressions-conditional-S11.12_A2.1_T5",
    path: `${P}/S11.12_A2.1_T5.js`,
    category: CAT,
    description: "(2 == 2) ? 'yes' : 'no' === 'yes'",
    spec: {
      type: "if",
      params: {
        condition: { $eq: [2, 2] },
        trueBranch: { type: "constant", params: { value: "yes" } },
        falseBranch: { type: "constant", params: { value: "no" } },
      },
    },
    expectation: { kind: "value", expected: "yes" },
  }),
];
