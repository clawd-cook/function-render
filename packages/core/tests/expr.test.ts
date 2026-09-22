import { expect, test } from "vite-plus/test";

import { evaluate, evaluateCondition, resolveArgs, type ExprContext } from "../src/expr.ts";

function ctxFor(state: Record<string, unknown>): ExprContext {
  return { state };
}

test("resolveArgs resolves $.path and recurses into objects/arrays", () => {
  const ctx = ctxFor({ input: { id: 7 }, x: 40 });
  expect(resolveArgs({ a: "$.x", b: 2 }, ctx)).toEqual({ a: 40, b: 2 });
  expect(resolveArgs({ list: ["$.input.id", "lit"] }, ctx)).toEqual({ list: [7, "lit"] });
});

test("evaluate handles v1 arithmetic and comparison", () => {
  const ctx = ctxFor({ input: { orderAmount: 2000 }, tax: 120 });
  expect(evaluate({ $mul: ["$.input.orderAmount", 0.06] }, ctx)).toBe(120);
  expect(evaluate({ $add: ["$.input.orderAmount", "$.tax"] }, ctx)).toBe(2120);
  expect(evaluate({ $gt: ["$.tax", 100] }, ctx)).toBe(true);
  expect(evaluate({ $gt: [1, 2] }, ctx)).toBe(false);
});

test("infix-looking strings are literals, not computed", () => {
  const ctx = ctxFor({ a: 1 });
  expect(evaluate("$.a + 1", ctx)).toBe("$.a + 1");
});

test("$lit forces a literal that looks like a Slot path", () => {
  const ctx = ctxFor({ x: 1 });
  expect(evaluate({ $lit: "$.x" }, ctx)).toBe("$.x");
});

test("evaluateCondition uses ExprAtom booleans", () => {
  const ctx = ctxFor({ score: 75 });
  expect(evaluateCondition({ $gt: ["$.score", 59] }, ctx)).toBe(true);
  expect(evaluateCondition({ $gt: ["$.score", 100] }, ctx)).toBe(false);
});

test("evaluate throws on type mismatch at run phase", () => {
  const ctx = ctxFor({ x: "not-a-number" });
  expect(() => evaluate({ $add: ["$.x", 1] }, ctx)).toThrow();
});
