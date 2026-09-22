import { FunctionRenderError } from "./errors.ts";

/** Minimal context the expression evaluator needs: read shared state by pointer. */
export interface ExprContext {
  get(pointer: string): unknown;
}

const OPERATORS = new Set([
  "$state",
  "$get",
  "$add",
  "$sub",
  "$mul",
  "$div",
  "$mod",
  "$neg",
  "$eq",
  "$ne",
  "$lt",
  "$le",
  "$gt",
  "$ge",
  "$and",
  "$or",
  "$not",
  "$len",
  "$at",
  "$slice",
  "$concat",
  "$push",
  "$min",
  "$max",
  "$if",
]);

const LEGACY_CMP = new Set(["eq", "neq", "gt", "gte", "lt", "lte", "not"]);

function fail(message: string): never {
  throw new FunctionRenderError("validation", "", message);
}

function asNumber(value: unknown, op: string): number {
  if (typeof value !== "number") fail(`${op} expects numbers, got ${typeof value}`);
  return value;
}

function asArray(value: unknown, op: string): unknown[] {
  if (!Array.isArray(value)) fail(`${op} expects an array`);
  return value;
}

function looseEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (a !== null && b !== null && typeof a === "object" && typeof b === "object") {
    return JSON.stringify(a) === JSON.stringify(b);
  }
  return false;
}

function evalLegacyCondition(obj: Record<string, unknown>, ctx: ExprContext): boolean {
  const value = ctx.get(obj["$state"] as string);
  if (obj["not"] === true) return !value;
  if ("eq" in obj) return looseEqual(value, obj["eq"]);
  if ("neq" in obj) return !looseEqual(value, obj["neq"]);
  if (obj["gt"] !== undefined) return typeof value === "number" && value > (obj["gt"] as number);
  if (obj["gte"] !== undefined) return typeof value === "number" && value >= (obj["gte"] as number);
  if (obj["lt"] !== undefined) return typeof value === "number" && value < (obj["lt"] as number);
  if (obj["lte"] !== undefined) return typeof value === "number" && value <= (obj["lte"] as number);
  return Boolean(value);
}

function applyOperator(op: string, operand: unknown, ctx: ExprContext): unknown {
  if (op === "$state" || op === "$get") {
    if (typeof operand !== "string") fail(`${op} expects a JSON Pointer string`);
    return ctx.get(operand);
  }
  if (op === "$if") {
    const parts = asArray(operand, "$if");
    return evaluate(parts[0], ctx) ? evaluate(parts[1], ctx) : evaluate(parts[2], ctx);
  }
  if (op === "$neg") return -asNumber(evaluate(operand, ctx), "$neg");
  if (op === "$not") return !evaluate(operand, ctx);
  if (op === "$len") {
    const v = evaluate(operand, ctx);
    if (typeof v === "string" || Array.isArray(v)) return v.length;
    return fail("$len expects a string or array");
  }

  const args = asArray(operand, op).map((e) => evaluate(e, ctx));
  switch (op) {
    case "$add":
      return args.reduce<number>((sum, x) => sum + asNumber(x, "$add"), 0);
    case "$mul":
      return args.reduce<number>((product, x) => product * asNumber(x, "$mul"), 1);
    case "$sub":
      return asNumber(args[0], "$sub") - asNumber(args[1], "$sub");
    case "$div":
      return asNumber(args[0], "$div") / asNumber(args[1], "$div");
    case "$mod":
      return asNumber(args[0], "$mod") % asNumber(args[1], "$mod");
    case "$eq":
      return looseEqual(args[0], args[1]);
    case "$ne":
      return !looseEqual(args[0], args[1]);
    case "$lt":
      return asNumber(args[0], "$lt") < asNumber(args[1], "$lt");
    case "$le":
      return asNumber(args[0], "$le") <= asNumber(args[1], "$le");
    case "$gt":
      return asNumber(args[0], "$gt") > asNumber(args[1], "$gt");
    case "$ge":
      return asNumber(args[0], "$ge") >= asNumber(args[1], "$ge");
    case "$and":
      return args.every(Boolean);
    case "$or":
      return args.some(Boolean);
    case "$min":
      return Math.min(...args.map((x) => asNumber(x, "$min")));
    case "$max":
      return Math.max(...args.map((x) => asNumber(x, "$max")));
    case "$at":
      return asArray(args[0], "$at")[asNumber(args[1], "$at")];
    case "$slice":
      return asArray(args[0], "$slice").slice(
        asNumber(args[1], "$slice"),
        args[2] === undefined ? undefined : asNumber(args[2], "$slice"),
      );
    case "$concat":
      return args.reduce<unknown[]>((acc, x) => acc.concat(asArray(x, "$concat")), []);
    case "$push":
      return [...asArray(args[0], "$push"), args[1]];
    default:
      return fail(`unknown operator ${op}`);
  }
}

/**
 * Evaluate a value expression against the shared state. Supports atomic
 * computation operators (`$add`, `$lt`, `$at`, …), state reads (`$state`),
 * the legacy `{ $state, gt: … }` condition form, arrays, and literal objects.
 */
export function evaluate(expr: unknown, ctx: ExprContext): unknown {
  if (Array.isArray(expr)) return expr.map((e) => evaluate(e, ctx));
  if (expr === null || typeof expr !== "object") return expr;

  const obj = expr as Record<string, unknown>;
  const keys = Object.keys(obj);

  if (keys.length === 1 && OPERATORS.has(keys[0]!)) {
    return applyOperator(keys[0]!, obj[keys[0]!], ctx);
  }

  if ("$state" in obj && keys.every((k) => k === "$state" || LEGACY_CMP.has(k))) {
    return evalLegacyCondition(obj, ctx);
  }

  const out: Record<string, unknown> = {};
  for (const key of keys) out[key] = evaluate(obj[key], ctx);
  return out;
}

/** Resolve a `call` node's argument object by evaluating each value. */
export function resolveArgs(args: unknown, ctx: ExprContext): Record<string, unknown> {
  return evaluate(args ?? {}, ctx) as Record<string, unknown>;
}

/** Evaluate an expression and coerce it to a boolean (used by if/switch/for). */
export function evaluateCondition(expr: unknown, ctx: ExprContext): boolean {
  return Boolean(evaluate(expr, ctx));
}
