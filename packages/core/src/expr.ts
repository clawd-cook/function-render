import { FunctionRenderError } from "./errors.ts";
import { EXPR_ATOMS } from "./schema.ts";
import { getSlot, isSlotPath } from "./state.ts";
import type { SlotSpace } from "./types.ts";

/** Context for expression evaluation: read Slot by `$.path`. */
export interface ExprContext {
  state: SlotSpace;
}

function failRun(path: string, message: string): never {
  throw new FunctionRenderError({ phase: "run", path, message });
}

function failValidate(path: string, message: string): never {
  throw new FunctionRenderError({ phase: "validate", path, message });
}

function asNumber(value: unknown, op: string, path: string): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    failRun(path, `${op} expects numbers, got ${typeof value}`);
  }
  return value;
}

function asArray(value: unknown, op: string, path: string): unknown[] {
  if (!Array.isArray(value)) failRun(path, `${op} expects an array operand`);
  return value;
}

function evalList(operand: unknown, op: string, ctx: ExprContext, path: string): unknown[] {
  const args = asArray(operand, op, path);
  return args.map((e: unknown, i: number) => evaluate(e, ctx, `${path}/${op}/${i}`));
}

function evalPair(
  operand: unknown,
  op: string,
  ctx: ExprContext,
  path: string,
): [unknown, unknown] {
  const args = asArray(operand, op, path);
  if (args.length !== 2) failRun(path, `${op} expects exactly 2 operands`);
  return [evaluate(args[0], ctx, `${path}/${op}/0`), evaluate(args[1], ctx, `${path}/${op}/1`)];
}

/** Stable deep equality via JSON (key order not guaranteed for objects). */
function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (a === null || b === null) return a === b;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object") return false;
  try {
    return JSON.stringify(a) === JSON.stringify(b);
  } catch {
    return false;
  }
}

function asStringKeys(value: unknown, op: string, path: string): string[] {
  if (!Array.isArray(value) || !value.every((k: unknown) => typeof k === "string")) {
    failRun(path, `${op} expects an array of string keys`);
  }
  return value as string[];
}

function asRecord(value: unknown, op: string, path: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    failRun(path, `${op} expects an object`);
  }
  return value as Record<string, unknown>;
}

function applyAtom(op: string, operand: unknown, ctx: ExprContext, path: string): unknown {
  if (op === "$lit") return operand;

  if (op === "$add") {
    return evalList(operand, op, ctx, path).reduce<number>(
      (sum: number, x: unknown) => sum + asNumber(x, op, path),
      0,
    );
  }
  if (op === "$mul") {
    return evalList(operand, op, ctx, path).reduce<number>(
      (product: number, x: unknown) => product * asNumber(x, op, path),
      1,
    );
  }
  if (op === "$sub") {
    const [a, b] = evalPair(operand, op, ctx, path);
    return asNumber(a, op, path) - asNumber(b, op, path);
  }
  if (op === "$div") {
    const [a, b] = evalPair(operand, op, ctx, path);
    const divisor = asNumber(b, op, path);
    if (divisor === 0) failRun(path, "$div division by zero");
    return asNumber(a, op, path) / divisor;
  }
  if (op === "$mod") {
    const [a, b] = evalPair(operand, op, ctx, path);
    return asNumber(a, op, path) % asNumber(b, op, path);
  }
  if (op === "$pow") {
    const [a, b] = evalPair(operand, op, ctx, path);
    return asNumber(a, op, path) ** asNumber(b, op, path);
  }

  if (op === "$abs" || op === "$ceil" || op === "$floor" || op === "$round") {
    const value = evaluate(operand, ctx, `${path}/${op}`);
    const n = asNumber(value, op, path);
    if (op === "$abs") return Math.abs(n);
    if (op === "$ceil") return Math.ceil(n);
    if (op === "$floor") return Math.floor(n);
    return Math.round(n);
  }

  if (op === "$gt" || op === "$gte" || op === "$lt" || op === "$lte") {
    const [a, b] = evalPair(operand, op, ctx, path);
    const left = asNumber(a, op, path);
    const right = asNumber(b, op, path);
    if (op === "$gt") return left > right;
    if (op === "$gte") return left >= right;
    if (op === "$lt") return left < right;
    return left <= right;
  }

  if (op === "$eq") {
    const [a, b] = evalPair(operand, op, ctx, path);
    return deepEqual(a, b);
  }
  if (op === "$neq") {
    const [a, b] = evalPair(operand, op, ctx, path);
    return !deepEqual(a, b);
  }

  if (op === "$and") {
    return evalList(operand, op, ctx, path).every((x: unknown) => Boolean(x));
  }
  if (op === "$or") {
    return evalList(operand, op, ctx, path).some((x: unknown) => Boolean(x));
  }
  if (op === "$not") {
    return !evaluate(operand, ctx, `${path}/$not`);
  }

  if (op === "$len") {
    const value = evaluate(operand, ctx, `${path}/$len`);
    if (typeof value === "string" || Array.isArray(value)) return value.length;
    failRun(path, "$len expects a string or array");
  }

  if (op === "$at") {
    const [collection, index] = evalPair(operand, op, ctx, path);
    const i = asNumber(index, op, path);
    if (typeof collection === "string") return collection[i];
    if (Array.isArray(collection)) return collection[i];
    failRun(path, "$at expects a string or array");
  }

  if (op === "$concat") {
    const parts = evalList(operand, op, ctx, path);
    if (parts.length === 0) return [];
    if (parts.every((p: unknown) => typeof p === "string")) {
      return (parts as string[]).join("");
    }
    if (parts.every((p: unknown) => Array.isArray(p))) {
      return (parts as unknown[][]).flat();
    }
    failRun(path, "$concat expects all strings or all arrays");
  }

  if (op === "$pick") {
    const [obj, keysRaw] = evalPair(operand, op, ctx, path);
    const record = asRecord(obj, op, path);
    const keys = asStringKeys(keysRaw, op, path);
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      if (key in record) out[key] = record[key];
    }
    return out;
  }

  if (op === "$omit") {
    const [obj, keysRaw] = evalPair(operand, op, ctx, path);
    const record = asRecord(obj, op, path);
    const keys = new Set(asStringKeys(keysRaw, op, path));
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(record)) {
      if (!keys.has(key)) out[key] = record[key];
    }
    return out;
  }

  if (op === "$merge") {
    const parts = evalList(operand, op, ctx, path);
    const out: Record<string, unknown> = {};
    for (const part of parts) {
      Object.assign(out, asRecord(part, op, path));
    }
    return out;
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
    if (!EXPR_ATOMS.has(op)) {
      // Spec: unknown $atom → validate (defense in depth if validate was skipped)
      failValidate(path, `unknown ExprAtom: ${op}`);
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
