import type { RunContext } from "@logic-renderer/core";
import { expect, test } from "vite-plus/test";
import { z } from "zod";

import { defineFunction, standardCatalog } from "../src/index.ts";

const ctx: RunContext = { state: {}, get: () => undefined, set: () => {} };

test("standard math functions compute correctly", () => {
  expect(standardCatalog.add.run({ a: 2, b: 3 }, ctx)).toBe(5);
  expect(standardCatalog.sub.run({ a: 5, b: 3 }, ctx)).toBe(2);
  expect(standardCatalog.mul.run({ a: 6, b: 7 }, ctx)).toBe(42);
  expect(standardCatalog.div.run({ a: 9, b: 3 }, ctx)).toBe(3);
});

test("standard string functions compute correctly", () => {
  expect(standardCatalog.concat.run({ values: ["a", "b", "c"] }, ctx)).toBe("abc");
  expect(standardCatalog.upper.run({ value: "ada" }, ctx)).toBe("ADA");
  expect(standardCatalog.lower.run({ value: "ADA" }, ctx)).toBe("ada");
  expect(standardCatalog.length.run({ value: "abcd" }, ctx)).toBe(4);
  expect(standardCatalog.length.run({ value: [1, 2, 3] }, ctx)).toBe(3);
});

test("delay resolves to its value asynchronously", async () => {
  const result = await standardCatalog.delay.run({ ms: 1, value: "done" }, ctx);
  expect(result).toBe("done");
});

test("sort returns a sorted copy (asc and desc)", () => {
  expect(standardCatalog.sort.run({ items: [3, 1, 2] }, ctx)).toEqual([1, 2, 3]);
  expect(standardCatalog.sort.run({ items: [3, 1, 2], order: "desc" }, ctx)).toEqual([3, 2, 1]);
});

test("defineFunction infers args from the params schema", () => {
  const triple = defineFunction({
    params: z.object({ n: z.number() }),
    run: ({ n }) => n * 3,
  });
  expect(triple.run({ n: 4 }, ctx)).toBe(12);
});
