import type { FlowSpec } from "@logic-renderer/runner";

import type { CorpusEntry, Expectation } from "../schema.ts";

/** Build an ExprAtom value case: render a single `expr` node and compare `result`. */
export function exprCase(args: {
  id: string;
  path: string;
  esid?: string;
  category: string;
  description: string;
  value: unknown;
  expected: unknown;
  notes?: string;
}): CorpusEntry {
  return {
    id: args.id,
    test262Path: args.path,
    esid: args.esid,
    category: args.category,
    description: args.description,
    spec: { type: "expr", params: { value: args.value } },
    input: {},
    expectation: { kind: "value", expected: args.expected },
    notes: args.notes,
  };
}

/** Build a generic case with an explicit FlowSpec + input + expectation. */
export function specCase(args: {
  id: string;
  path: string;
  esid?: string;
  category: string;
  description: string;
  spec: FlowSpec;
  input?: unknown;
  expectation: Expectation;
  notes?: string;
}): CorpusEntry {
  return {
    id: args.id,
    test262Path: args.path,
    esid: args.esid,
    category: args.category,
    description: args.description,
    spec: args.spec,
    input: args.input ?? {},
    expectation: args.expectation,
    notes: args.notes,
  };
}
