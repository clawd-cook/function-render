import { FunctionRenderError } from "./errors.ts";
import { V1_EXPR_ATOMS } from "./schema.ts";
import { getSlot, isSlotPath } from "./state.ts";
import type { SlotSpace } from "./types.ts";

/** Context for expression evaluation: read Slot by `$.path`. */
export interface ExprContext {
  state: SlotSpace;
}

function failRun(path: string, message: string): never {
  throw new FunctionRenderError({ phase: "run", path, message });
}

function asNumber(value: unknown, op: string, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    failRun(path, `${op} expects numbers, got ${typeof value}`);
  }
  return value;
}

function applyAtom(op: string, operand: unknown, ctx: ExprContext, path: string): unknown {
  if (op === "$lit") return operand;

  if (op === "$add") {
    const args = Array.isArray(operand) ? operand : failRun(path, "$add expects an array");
    return args
      .map((e: unknown, i: number) => evaluate(e, ctx, `${path}/$add/${i}`))
      .reduce<number>((sum: number, x: unknown) => sum + asNumber(x, "$add", path), 0);
  }

  if (op === "$mul") {
    const args = Array.isArray(operand) ? operand : failRun(path, "$mul expects an array");
    return args
      .map((e: unknown, i: number) => evaluate(e, ctx, `${path}/$mul/${i}`))
      .reduce<number>((product: number, x: unknown) => product * asNumber(x, "$mul", path), 1);
  }

  if (op === "$gt") {
    const args = Array.isArray(operand) ? operand : failRun(path, "$gt expects an array");
    if (args.length !== 2) failRun(path, "$gt expects exactly 2 operands");
    const a = evaluate(args[0], ctx, `${path}/$gt/0`);
    const b = evaluate(args[1], ctx, `${path}/$gt/1`);
    return asNumber(a, "$gt", path) > asNumber(b, "$gt", path);
  }

  failRun(path, `unknown ExprAtom ${op}`);
}

/**
 * Evaluate an Expr against Slot space.
 * - Slot strings (`$.path`) read state
 * - Other strings / numbers / bools / null are literals (no infix)
 * - Single-key `$atom` objects apply ExprAtom
 * - Other objects recurse field-wise
 */
export function evaluate(expr: unknown, ctx: ExprContext, path = ""): unknown {
  if (typeof expr === "string") {
    if (isSlotPath(expr)) return getSlot(ctx.state, expr);
    return expr;
  }
  if (expr === null || typeof expr !== "object") return expr;
  if (Array.isArray(expr)) {
    return expr.map((e: unknown, i: number) => evaluate(e, ctx, `${path}/${i}`));
  }

  const obj = expr as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 1 && keys[0]!.startsWith("$")) {
    const op = keys[0]!;
    if (!V1_EXPR_ATOMS.has(op)) {
      failRun(path, `unknown ExprAtom ${op}`);
    }
    return applyAtom(op, obj[op], ctx, path);
  }

  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = evaluate(obj[key], ctx, `${path}/${key}`);
  }
  return out;
}

/** Resolve a `callFunc` args object by evaluating each value. */
export function resolveArgs(
  args: Record<string, unknown> | undefined,
  ctx: ExprContext,
  path = "",
): Record<string, unknown> {
  return evaluate(args ?? {}, ctx, path) as Record<string, unknown>;
}

/** Evaluate and coerce to boolean (used by `if.condition`). */
export function evaluateCondition(expr: unknown, ctx: ExprContext, path = ""): boolean {
  return Boolean(evaluate(expr, ctx, path));
}
