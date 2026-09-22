import type { CorpusEntry } from "../schema.ts";
import { expressionEntries } from "./expressions.ts";
import { negativeEntries } from "./negative.ts";
import { statementEntries } from "./statements.ts";

/** Full seed corpus (curated, expressible test262 language cases). */
export const corpus: CorpusEntry[] = [
  ...expressionEntries,
  ...statementEntries,
  ...negativeEntries,
];
