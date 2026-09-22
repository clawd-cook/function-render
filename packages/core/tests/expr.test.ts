import { expect, test } from "vite-plus/test";

import { evaluate, evaluateCondition, resolveArgs, type ExprContext } from "../src/expr.ts";
import { getByPath } from "../src/state.ts";

function ctxFor(state: Record<string, unknown>): ExprContext {
  return { get: (pointer) => getByPath(state, pointer) };
}

test("resolveArgs resolves $state and recurses into objects/arrays", () => {
  const ctx = ctxFor({ x: 40, user: { id: 7 } });
  expect(resolveArgs({ a: { $state: "/x" }, b: 2 }, ctx)).toEqual({ a: 40, b: 2 });
  expect(resolveArgs({ list: [{ $state: "/user/id" }, "lit"] }, ctx)).toEqual({ list: [7, "lit"] });
});

test("evaluate handles arithmetic operators", () => {
  const ctx = ctxFor({ x: 10, y: 3 });
  expect(evaluate({ $add: [{ $state: "/x" }, { $state: "/y" }, 2] }, ctx)).toBe(15);
  expect(evaluate({ $sub: [{ $state: "/x" }, 4] }, ctx)).toBe(6);
  expect(evaluate({ $mul: [2, 3, 4] }, ctx)).toBe(24);
  expect(evaluate({ $div: [{ $state: "/x" }, { $state: "/y" }] }, ctx)).toBe(10 / 3);
  expect(evaluate({ $mod: [{ $state: "/x" }, { $state: "/y" }] }, ctx)).toBe(1);
  expect(evaluate({ $neg: { $state: "/x" } }, ctx)).toBe(-10);
});

test("evaluate handles comparison and logic operators", () => {
  const ctx = ctxFor({ x: 10 });
  expect(evaluate({ $eq: [{ $state: "/x" }, 10] }, ctx)).toBe(true);
  expect(evaluate({ $ne: [{ $state: "/x" }, 10] }, ctx)).toBe(false);
  expect(evaluate({ $lt: [{ $state: "/x" }, 20] }, ctx)).toBe(true);
  expect(evaluate({ $ge: [{ $state: "/x" }, 10] }, ctx)).toBe(true);
  expect(evaluate({ $and: [true, { $gt: [{ $state: "/x" }, 5] }] }, ctx)).toBe(true);
  expect(evaluate({ $or: [false, false] }, ctx)).toBe(false);
  expect(evaluate({ $not: false }, ctx)).toBe(true);
});

test("evaluate handles collection operators", () => {
  const ctx = ctxFor({ arr: [10, 20, 30] });
  expect(evaluate({ $len: { $state: "/arr" } }, ctx)).toBe(3);
  expect(evaluate({ $at: [{ $state: "/arr" }, 1] }, ctx)).toBe(20);
  expect(evaluate({ $slice: [{ $state: "/arr" }, 1] }, ctx)).toEqual([20, 30]);
  expect(evaluate({ $concat: [{ $state: "/arr" }, [40]] }, ctx)).toEqual([10, 20, 30, 40]);
  expect(evaluate({ $push: [{ $state: "/arr" }, 40] }, ctx)).toEqual([10, 20, 30, 40]);
  expect(evaluate({ $min: [3, 1, 2] }, ctx)).toBe(1);
  expect(evaluate({ $max: [3, 1, 2] }, ctx)).toBe(3);
});

test("$if evaluates lazily (untaken branch is not evaluated)", () => {
  const ctx = ctxFor({ flag: true });
  // The else branch divides by an array -> would throw if evaluated.
  expect(evaluate({ $if: [{ $state: "/flag" }, "yes", { $div: [1, [1]] }] }, ctx)).toBe("yes");
});

test("evaluateCondition supports operators and the legacy condition form", () => {
  const ctx = ctxFor({ a: true, b: false, count: 3, name: "Ada" });
  expect(evaluateCondition({ $state: "/a" }, ctx)).toBe(true);
  expect(evaluateCondition({ $and: [{ $state: "/a" }, { $state: "/b" }] }, ctx)).toBe(false);
  expect(evaluateCondition({ $or: [{ $state: "/a" }, { $state: "/b" }] }, ctx)).toBe(true);
  // legacy forms (still supported)
  expect(evaluateCondition({ $state: "/name", eq: "Ada" }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/count", gt: 2 }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/a", not: true }, ctx)).toBe(false);
  expect(evaluateCondition({ $state: "/missing" }, ctx)).toBe(false);
});

test("evaluate throws on invalid operator usage", () => {
  const ctx = ctxFor({ x: "not-a-number" });
  expect(() => evaluate({ $add: [{ $state: "/x" }, 1] }, ctx)).toThrow();
  expect(() => evaluate({ $at: [42, 0] }, ctx)).toThrow();
});
