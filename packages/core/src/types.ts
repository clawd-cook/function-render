import type { z } from "zod";

/** The shared, mutable state model addressed by JSON Pointer. */
export type StateModel = Record<string, unknown>;

/**
 * Runtime handle passed to function implementations and used by the engine to
 * read/write the shared state. `state` is the same object the pointers address.
 */
export interface RunContext {
  get(pointer: string): unknown;
  set(pointer: string, value: unknown): void;
  state: StateModel;
}

/** Result of executing a spec: the final shared state and the root result. */
export interface RunResult {
  state: StateModel;
  result: unknown;
}

/**
 * A registered function. When `params` is provided, the engine validates the
 * resolved arguments with it before calling `run`, and the `args` type is
 * inferred from the schema.
 */
export interface FunctionDef<S extends z.ZodType = z.ZodType> {
  params?: S;
  run: (args: z.infer<S>, ctx: RunContext) => unknown;
}

/** Bare function implementation (no argument schema, no validation). */
export type FnImpl = (args: any, ctx: RunContext) => unknown;

/** A catalog maps function names to a {@link FunctionDef} or bare {@link FnImpl}. */
export type Catalog = Record<string, FunctionDef | FnImpl>;
