import type { Func, FuncRegistry } from "@logic-renderer/core";
import type { z } from "zod";

/**
 * Define a typed Func whose argument type is inferred from its zod schema.
 */
export function defineFunction<S extends z.ZodType>(def: {
  params: S;
  run: (args: z.infer<S>) => unknown;
  sideEffect?: boolean;
  rollback?: (args: z.infer<S>, result: unknown) => unknown;
}): Func {
  return def as unknown as Func;
}

/** Identity helper that preserves the literal registry type (key autocomplete). */
export function defineCatalog<C extends FuncRegistry>(catalog: C): C {
  return catalog;
}
