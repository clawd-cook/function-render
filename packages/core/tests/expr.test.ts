import { expect, test } from "vite-plus/test";

import { evaluateCondition, resolveArgs, type ExprContext } from "../src/expr.ts";
import { getByPath } from "../src/state.ts";

function ctxFor(state: Record<string, unknown>): ExprContext {
  return { get: (pointer) => getByPath(state, pointer) };
}

test("resolveArgs resolves $state and recurses into objects/arrays", () => {
  const ctx = ctxFor({ x: 40, user: { id: 7 } });
  expect(resolveArgs({ a: { $state: "/x" }, b: 2 }, ctx)).toEqual({ a: 40, b: 2 });
  expect(resolveArgs([{ $state: "/user/id" }, "lit"], ctx)).toEqual([7, "lit"]);
  expect(resolveArgs({ nested: { deep: { $state: "/x" } } }, ctx)).toEqual({
    nested: { deep: 40 },
  });
});

test("resolveArgs treats objects with extra keys as literals", () => {
  const ctx = ctxFor({ x: 1 });
  expect(resolveArgs({ $state: "/x", extra: 2 }, ctx)).toEqual({ $state: "/x", extra: 2 });
});

test("evaluateCondition handles truthiness and comparisons", () => {
  const ctx = ctxFor({ active: true, count: 3, name: "Ada", zero: 0 });
  expect(evaluateCondition(true, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/active" }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/zero" }, ctx)).toBe(false);
  expect(evaluateCondition({ $state: "/active", not: true }, ctx)).toBe(false);
  expect(evaluateCondition({ $state: "/name", eq: "Ada" }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/name", neq: "Bob" }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/count", gt: 2 }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/count", lte: 3 }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/count", gt: 5 }, ctx)).toBe(false);
});

test("evaluateCondition handles combinators and missing paths", () => {
  const ctx = ctxFor({ a: true, b: false });
  expect(evaluateCondition([{ $state: "/a" }, { $state: "/a" }], ctx)).toBe(true);
  expect(evaluateCondition([{ $state: "/a" }, { $state: "/b" }], ctx)).toBe(false);
  expect(evaluateCondition({ $and: [{ $state: "/a" }, { $state: "/b" }] }, ctx)).toBe(false);
  expect(evaluateCondition({ $or: [{ $state: "/a" }, { $state: "/b" }] }, ctx)).toBe(true);
  expect(evaluateCondition({ $state: "/missing" }, ctx)).toBe(false);
});
