import { expect, test } from "vite-plus/test";
import { z } from "zod";

import { defineFunction, standardCatalog } from "../src/index.ts";

test("standard catalog has no arithmetic funcs (ExprAtom owns them)", () => {
  expect("add" in standardCatalog).toBe(false);
  expect("sub" in standardCatalog).toBe(false);
  expect("mul" in standardCatalog).toBe(false);
  expect("div" in standardCatalog).toBe(false);
  expect("delay" in standardCatalog).toBe(false);
});

test("standard string functions compute correctly", () => {
  const concat = standardCatalog.concat as {
    run: (args: { values: string[] }) => string;
  };
  const upper = standardCatalog.upper as { run: (args: { value: string }) => string };
  const lower = standardCatalog.lower as { run: (args: { value: string }) => string };
  const length = standardCatalog.length as {
    run: (args: { value: string | unknown[] }) => number;
  };
  expect(concat.run({ values: ["a", "b", "c"] })).toBe("abc");
  expect(upper.run({ value: "ada" })).toBe("ADA");
  expect(lower.run({ value: "ADA" })).toBe("ada");
  expect(length.run({ value: "abcd" })).toBe(4);
  expect(length.run({ value: [1, 2, 3] })).toBe(3);
});

test("sort returns a sorted copy (asc and desc)", () => {
  const sort = standardCatalog.sort as {
    run: (args: { items: number[]; order?: "asc" | "desc" }) => number[];
  };
  expect(sort.run({ items: [3, 1, 2] })).toEqual([1, 2, 3]);
  expect(sort.run({ items: [3, 1, 2], order: "desc" })).toEqual([3, 2, 1]);
});

test("deductBalance is a sideEffect func with rollback", () => {
  const fn = standardCatalog.deductBalance as {
    sideEffect?: boolean;
    run: (args: { merchantId: string; amount: number }) => unknown;
    rollback?: (args: { merchantId: string; amount: number }, result: unknown) => unknown;
  };
  expect(fn.sideEffect).toBe(true);
  expect(fn.run({ merchantId: "m1", amount: 10 })).toEqual({
    merchantId: "m1",
    amount: 10,
    status: "debited",
  });
  expect(fn.rollback?.({ merchantId: "m1", amount: 10 }, null)).toEqual({
    merchantId: "m1",
    amount: 10,
    status: "credited",
  });
});

test("defineFunction infers args from the params schema", () => {
  const triple = defineFunction({
    params: z.object({ n: z.number() }),
    run: ({ n }) => n * 3,
  }) as { run: (args: { n: number }) => number };
  expect(triple.run({ n: 4 })).toBe(12);
});
