import type { Catalog, FunctionDef, RunContext } from "@logic-renderer/core";
import type { z } from "zod";

/**
 * Define a typed function whose argument type is inferred from its zod schema.
 * Prefer this over a bare `{ params, run }` literal so `run`'s `args` are typed
 * (a plain `Catalog` annotation widens `args` to `unknown`).
 */
export function defineFunction<S extends z.ZodType>(def: {
  params: S;
  run: (args: z.infer<S>, ctx: RunContext) => unknown;
}): FunctionDef<S> {
  return def;
}

/** Identity helper that preserves the literal catalog type (key autocomplete). */
export function defineCatalog<C extends Catalog>(catalog: C): C {
  return catalog;
}
