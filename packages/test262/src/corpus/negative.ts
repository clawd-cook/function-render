import type { CorpusEntry } from "../schema.ts";
import { specCase } from "./helpers.ts";

const P = "test/language/statements";
const CAT = "statements";

/**
 * Negative cases. test262 marks these `negative: { phase: parse, type: SyntaxError }`
 * — the program is structurally invalid and must be rejected before execution.
 * logic-render's analog is `validate`-phase rejection of a structurally invalid
 * FlowSpec (run() validates before walking). We model that correspondence.
 */
export const negativeEntries: CorpusEntry[] = [
  specCase({
    id: "statements-for-S12.6.3_A8_T2-invalid",
    path: `${P}/for/S12.6.3_A8_T2.js`,
    esid: "sec-for-statement",
    category: CAT,
    description: "structurally invalid `for` (missing items/body) is rejected at validate",
    spec: { type: "for", params: { itemKey: "n", maxIter: 10 } },
    input: {},
    expectation: { kind: "throws", phase: "validate" },
    notes: "maps a parse-phase SyntaxError (invalid for-head) to validate-phase FlowSpec rejection",
  }),
  specCase({
    id: "statements-for-S12.6.3_A7.1_T2-unknown-node",
    path: `${P}/for/S12.6.3_A7.1_T2.js`,
    category: CAT,
    description: "unknown NodeType is rejected at validate (analog of a parse SyntaxError)",
    // @ts-expect-error intentionally invalid FlowSpec: unknown NodeType.
    spec: { type: "bogusNodeType", params: {} },
    input: {},
    expectation: { kind: "throws", phase: "validate" },
    notes: "maps a parse-phase SyntaxError to validate-phase rejection of an unknown NodeType",
  }),
];
