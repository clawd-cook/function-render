import type { CorpusEntry } from "../schema.ts";
import { exprCase } from "./helpers.ts";

const P = "test/language/expressions";
const CAT = "expressions";

/** Grouping/precedence, exponentiation, and unary-plus modeled with ExprAtoms. */
export const expressionsExtraEntries: CorpusEntry[] = [
  // grouping / operator precedence (nested atoms)
  exprCase({
    id: "expressions-grouping-S11.1.6_A1",
    path: `${P}/grouping/S11.1.6_A1.js`,
    esid: "sec-grouping-operator",
    category: CAT,
    description: "(1 + 2) * 3 === 9",
    value: { $mul: [{ $add: [1, 2] }, 3] },
    expected: 9,
  }),
  exprCase({
    id: "expressions-grouping-S11.1.6_A2_T1",
    path: `${P}/grouping/S11.1.6_A2_T1.js`,
    category: CAT,
    description: "2 * (3 + 4) === 14",
    value: { $mul: [2, { $add: [3, 4] }] },
    expected: 14,
  }),
  exprCase({
    id: "expressions-grouping-S11.1.6_A2_T2",
    path: `${P}/grouping/S11.1.6_A2_T2.js`,
    category: CAT,
    description: "(2 + 3) * (4 - 1) === 15",
    value: { $mul: [{ $add: [2, 3] }, { $sub: [4, 1] }] },
    expected: 15,
  }),
  exprCase({
    id: "expressions-grouping-S11.1.6_A3_T1",
    path: `${P}/grouping/S11.1.6_A3_T1.js`,
    category: CAT,
    description: "(10 - 2) / 4 === 2",
    value: { $div: [{ $sub: [10, 2] }, 4] },
    expected: 2,
  }),
  exprCase({
    id: "expressions-grouping-S11.1.6_A3_T2",
    path: `${P}/grouping/S11.1.6_A3_T2.js`,
    category: CAT,
    description: "(1 + 1) * (2 + 2) === 8",
    value: { $mul: [{ $add: [1, 1] }, { $add: [2, 2] }] },
    expected: 8,
  }),
  exprCase({
    id: "expressions-grouping-S11.1.6_A3_T3",
    path: `${P}/grouping/S11.1.6_A3_T3.js`,
    category: CAT,
    description: "1 + 2 * 3 === 7 (mul before add)",
    value: { $add: [1, { $mul: [2, 3] }] },
    expected: 7,
  }),
  // exponentiation ($pow)
  exprCase({
    id: "expressions-exponentiation-A10",
    path: `${P}/exponentiation/applying-the-exp-operator_A10.js`,
    esid: "sec-exp-operator",
    category: CAT,
    description: "2 ** 3 === 8",
    value: { $pow: [2, 3] },
    expected: 8,
  }),
  exprCase({
    id: "expressions-exponentiation-A11",
    path: `${P}/exponentiation/applying-the-exp-operator_A11.js`,
    category: CAT,
    description: "3 ** 2 === 9",
    value: { $pow: [3, 2] },
    expected: 9,
  }),
  exprCase({
    id: "expressions-exponentiation-A12",
    path: `${P}/exponentiation/applying-the-exp-operator_A12.js`,
    category: CAT,
    description: "5 ** 0 === 1",
    value: { $pow: [5, 0] },
    expected: 1,
  }),
  exprCase({
    id: "expressions-exponentiation-A13",
    path: `${P}/exponentiation/applying-the-exp-operator_A13.js`,
    category: CAT,
    description: "2 ** 10 === 1024",
    value: { $pow: [2, 10] },
    expected: 1024,
  }),
  // unary plus (numeric identity, modeled as 0 + x)
  exprCase({
    id: "expressions-unary-plus-S11.4.6_A1",
    path: `${P}/unary-plus/S11.4.6_A1.js`,
    esid: "sec-unary-plus-operator",
    category: CAT,
    description: "+5 === 5",
    value: { $add: [0, 5] },
    expected: 5,
    notes: "unary plus modeled as 0 + x",
  }),
  exprCase({
    id: "expressions-unary-plus-S11.4.6_A2.1_T1",
    path: `${P}/unary-plus/S11.4.6_A2.1_T1.js`,
    category: CAT,
    description: "+(-3) === -3",
    value: { $add: [0, -3] },
    expected: -3,
    notes: "unary plus modeled as 0 + x",
  }),
  exprCase({
    id: "expressions-unary-plus-S11.4.6_A2.2_T1",
    path: `${P}/unary-plus/S11.4.6_A2.2_T1.js`,
    category: CAT,
    description: "+0 === 0",
    value: { $add: [0, 0] },
    expected: 0,
    notes: "unary plus modeled as 0 + x",
  }),
];
