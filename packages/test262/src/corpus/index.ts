import type { CorpusEntry } from "../schema.ts";
import { conditionalEntries } from "./conditional.ts";
import { expressionsExtraEntries } from "./expressions-extra.ts";
import { expressionsMoreEntries } from "./expressions-more.ts";
import { expressionEntries } from "./expressions.ts";
import { negativeEntries } from "./negative.ts";
import { statementsExtraEntries } from "./statements-extra.ts";
import { statementsMoreEntries } from "./statements-more.ts";
import { statementEntries } from "./statements.ts";

/** Full seed corpus (curated, expressible test262 language cases). */
export const corpus: CorpusEntry[] = [
  ...expressionEntries,
  ...expressionsMoreEntries,
  ...expressionsExtraEntries,
  ...conditionalEntries,
  ...statementEntries,
  ...statementsMoreEntries,
  ...statementsExtraEntries,
  ...negativeEntries,
];
