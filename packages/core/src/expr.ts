import type { Condition, DynamicValue } from "./schema.ts";

/** Minimal context the expression helpers need: read shared state by pointer. */
export interface ExprContext {
  get(pointer: string): unknown;
}

function isStateRef(value: object): value is { $state: string } {
  const keys = Object.keys(value);
  return keys.length === 1 && keys[0] === "$state";
}

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

/**
 * Recursively resolve a {@link DynamicValue}. `{ $state: "/ptr" }` reads from
 * the shared state; arrays and plain objects recurse; everything else is a
 * literal passed through unchanged.
 */
export function resolveArgs(value: DynamicValue, ctx: ExprContext): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => resolveArgs(item, ctx));
  }
  if (value !== null && typeof value === "object") {
    if (isStateRef(value)) return ctx.get(value.$state);
    const out: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value)) {
      out[key] = resolveArgs(item as DynamicValue, ctx);
    }
    return out;
  }
  return value;
}

/** Evaluate a {@link Condition} against the shared state. */
export function evaluateCondition(condition: Condition, ctx: ExprContext): boolean {
  if (typeof condition === "boolean") return condition;
  if (Array.isArray(condition)) {
    return condition.every((c: Condition) => evaluateCondition(c, ctx));
  }
  if ("$and" in condition) {
    return condition.$and.every((c: Condition) => evaluateCondition(c, ctx));
  }
  if ("$or" in condition) {
    return condition.$or.some((c: Condition) => evaluateCondition(c, ctx));
  }

  const value = ctx.get(condition.$state);
  if (condition.not === true) return !value;
  if ("eq" in condition) return looseEqual(value, condition.eq);
  if ("neq" in condition) return !looseEqual(value, condition.neq);
  if (condition.gt !== undefined) return typeof value === "number" && value > condition.gt;
  if (condition.gte !== undefined) return typeof value === "number" && value >= condition.gte;
  if (condition.lt !== undefined) return typeof value === "number" && value < condition.lt;
  if (condition.lte !== undefined) return typeof value === "number" && value <= condition.lte;
  return Boolean(value);
}
