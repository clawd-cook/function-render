import type { z } from "zod";

/** Shared Slot space: `{ input, …outputTo }`. */
export type SlotSpace = Record<string, unknown>;

/** @deprecated Use {@link SlotSpace}. */
export type StateModel = SlotSpace;

/**
 * A business function injected via FuncRegistry.
 * Bare functions are pure. Object form may declare params, sideEffect, rollback.
 */
export type Func =
  | ((args: Record<string, unknown>) => unknown)
  | {
      run: (args: Record<string, unknown>) => unknown;
      params?: z.ZodType;
      sideEffect?: boolean;
      rollback?: (args: Record<string, unknown>, result: unknown) => unknown;
    };

/** Per-`run` / `validate` value — not a global register(). */
export type FuncRegistry = Readonly<Record<string, Func>>;

/** Normalized Func used by the runner. */
export interface NormalizedFunc {
  run: (args: Record<string, unknown>) => unknown;
  params?: z.ZodType;
  sideEffect: boolean;
  rollback?: (args: Record<string, unknown>, result: unknown) => unknown;
}

export function normalizeFunc(fn: Func): NormalizedFunc {
  if (typeof fn === "function") {
    return { run: fn, sideEffect: false };
  }
  return {
    run: fn.run,
    params: fn.params,
    sideEffect: fn.sideEffect === true,
    rollback: fn.rollback,
  };
}

/** v1 NodeTypes (settlement subset). Horizon types are rejected until batch 2. */
export type NodeType = "then" | "if" | "set" | "callFunc";

export interface NodeSpec {
  type: NodeType;
  params: Record<string, unknown>;
  outputTo?: string;
}

/** Root must be a single node; sequences use `type: "then"`. */
export type FlowSpec = NodeSpec;

export interface RunResult {
  state: SlotSpace;
  result: unknown;
}

/** @deprecated Prefer {@link Func}. */
export type FunctionDef = Extract<Func, { run: unknown }>;

/** @deprecated Prefer bare Func. */
export type FnImpl = (args: Record<string, unknown>) => unknown;

/** @deprecated Prefer {@link FuncRegistry}. */
export type Catalog = FuncRegistry;
