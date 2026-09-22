import { existsSync } from "node:fs";
import { join } from "node:path";

import type { CorpusEntry } from "./schema.ts";

/**
 * Return corpus paths that do not exist under the test262 checkout.
 * `test262Root` is the `submodules/test262` directory; entry paths start with
 * "test/language/". A non-empty result means the corpus drifted from the pin.
 */
export function findMissingPaths(entries: readonly CorpusEntry[], test262Root: string): string[] {
  return entries
    .filter((e) => !existsSync(join(test262Root, e.test262Path)))
    .map((e) => e.test262Path);
}
