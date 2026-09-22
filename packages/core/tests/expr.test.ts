import { expect, test } from "vite-plus/test";

import { FunctionRenderError } from "../src/errors.ts";
import { evaluate, evaluateCondition, resolveArgs, type ExprContext } from "../src/expr.ts";

function ctxFor(state: Record<string, unknown>): ExprContext {
  return { state };
}

test("resolveArgs resolves $.path and recurses into objects/arrays", () => {
  const ctx = ctxFor({ input: { id: 7 }, x: 40 });
  expect(resolveArgs({ a: "$.x", b: 2 }, ctx)).toEqual({ a: 40, b: 2 });
  expect(resolveArgs({ list: ["$.input.id", "lit"] }, ctx)).toEqual({ list: [7, "lit"] });
});

test("evaluate handles arithmetic ExprAtoms", () => {
  const ctx = ctxFor({ input: { orderAmount: 2000 }, tax: 120 });
  expect(evaluate({ $mul: ["$.input.orderAmount", 0.06] }, ctx)).toBe(120);
  expect(evaluate({ $add: ["$.input.orderAmount", "$.tax"] }, ctx)).toBe(2120);
  expect(evaluate({ $sub: [10, 3] }, ctx)).toBe(7);
  expect(evaluate({ $div: [10, 2] }, ctx)).toBe(5);
  expect(evaluate({ $mod: [10, 3] }, ctx)).toBe(1);
  expect(evaluate({ $pow: [2, 3] }, ctx)).toBe(8);
  expect(evaluate({ $abs: -3.5 }, ctx)).toBe(3.5);
  expect(evaluate({ $ceil: 1.2 }, ctx)).toBe(2);
  expect(evaluate({ $floor: 1.8 }, ctx)).toBe(1);
  expect(evaluate({ $round: 1.5 }, ctx)).toBe(2);
});

test("$div division by zero is run-phase error", () => {
  const ctx = ctxFor({});
  try {
    evaluate({ $div: [1, 0] }, ctx);
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("run");
    expect((err as FunctionRenderError).message).toMatch(/zero/);
  }
});

test("evaluate handles comparison and logic ExprAtoms", () => {
  const ctx = ctxFor({ score: 75 });
  expect(evaluate({ $gt: ["$.score", 100] }, ctx)).toBe(false);
  expect(evaluate({ $gte: [5, 5] }, ctx)).toBe(true);
  expect(evaluate({ $lt: [1, 2] }, ctx)).toBe(true);
  expect(evaluate({ $lte: [2, 2] }, ctx)).toBe(true);
  expect(evaluate({ $eq: [{ a: 1 }, { a: 1 }] }, ctx)).toBe(true);
  expect(evaluate({ $neq: [1, 2] }, ctx)).toBe(true);
  expect(evaluate({ $and: [true, 1, "x"] }, ctx)).toBe(true);
  expect(evaluate({ $or: [false, 0, "yes"] }, ctx)).toBe(true);
  expect(evaluate({ $not: false }, ctx)).toBe(true);
});

test("evaluate handles first-order data ExprAtoms", () => {
  const ctx = ctxFor({
    nums: [10, 20, 30],
    word: "hi",
    obj: { a: 1, b: 2, c: 3 },
  });
  expect(evaluate({ $len: "$.nums" }, ctx)).toBe(3);
  expect(evaluate({ $len: "$.word" }, ctx)).toBe(2);
  expect(evaluate({ $at: ["$.nums", 1] }, ctx)).toBe(20);
  expect(evaluate({ $concat: ["hel", "lo"] }, ctx)).toBe("hello");
  expect(evaluate({ $concat: [["a"], ["b", "c"]] }, ctx)).toEqual(["a", "b", "c"]);
  expect(evaluate({ $pick: ["$.obj", ["a", "c"]] }, ctx)).toEqual({ a: 1, c: 3 });
  expect(evaluate({ $omit: ["$.obj", ["b"]] }, ctx)).toEqual({ a: 1, c: 3 });
  expect(evaluate({ $merge: [{ a: 1 }, { b: 2 }, { a: 9 }] }, ctx)).toEqual({ a: 9, b: 2 });
});

test("infix-looking strings are literals, not computed", () => {
  const ctx = ctxFor({ a: 1 });
  expect(evaluate("$.a + 1", ctx)).toBe("$.a + 1");
});

test("unknown ExprAtom fails at validate phase", () => {
  const ctx = ctxFor({});
  try {
    evaluate({ $map: [1, 2] }, ctx);
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).message).toMatch(/unknown ExprAtom/);
  }
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
