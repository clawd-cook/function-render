import type { Catalog } from "@function-renderer/core";
import { z } from "zod";

import { defineFunction } from "./define.ts";

const twoNumbers = z.object({ a: z.number(), b: z.number() });
const oneString = z.object({ value: z.string() });

export const add = defineFunction({ params: twoNumbers, run: ({ a, b }) => a + b });
export const sub = defineFunction({ params: twoNumbers, run: ({ a, b }) => a - b });
export const mul = defineFunction({ params: twoNumbers, run: ({ a, b }) => a * b });
export const div = defineFunction({ params: twoNumbers, run: ({ a, b }) => a / b });

export const concat = defineFunction({
  params: z.object({ values: z.array(z.string()) }),
  run: ({ values }) => values.join(""),
});
export const upper = defineFunction({ params: oneString, run: ({ value }) => value.toUpperCase() });
export const lower = defineFunction({ params: oneString, run: ({ value }) => value.toLowerCase() });

export const length = defineFunction({
  params: z.object({ value: z.union([z.string(), z.array(z.unknown())]) }),
  run: ({ value }) => value.length,
});

export const delay = defineFunction({
  params: z.object({ ms: z.number(), value: z.unknown().optional() }),
  run: async ({ ms, value }) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return value;
  },
});

export const now = defineFunction({ params: z.object({}), run: () => Date.now() });

export const sort = defineFunction({
  params: z.object({ items: z.array(z.number()), order: z.enum(["asc", "desc"]).optional() }),
  run: ({ items, order }) => {
    const sorted = [...items].sort((a, b) => a - b);
    return order === "desc" ? sorted.reverse() : sorted;
  },
});

/** A ready-to-use standard function library shared across the demo apps. */
export const standardCatalog = {
  add,
  sub,
  mul,
  div,
  concat,
  upper,
  lower,
  length,
  delay,
  now,
  sort,
} satisfies Catalog;
