import type { FuncRegistry } from "@logic-renderer/core";
import { z } from "zod";

import { defineFunction } from "./define.ts";

const oneString = z.object({ value: z.string() });

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

export const now = defineFunction({ params: z.object({}), run: () => Date.now() });

export const sort = defineFunction({
  params: z.object({ items: z.array(z.number()), order: z.enum(["asc", "desc"]).optional() }),
  run: ({ items, order }) => {
    const sorted = [...items].sort((a, b) => a - b);
    return order === "desc" ? sorted.reverse() : sorted;
  },
});

/** Docs / demo algorithmic Funcs (horizon NodeTypes like `for` are not in v1). */
export const twoSum = defineFunction({
  params: z.object({ nums: z.array(z.number()), target: z.number() }),
  run: ({ nums, target }) => {
    const seen = new Map<number, number>();
    for (let i = 0; i < nums.length; i++) {
      const need = target - nums[i]!;
      if (seen.has(need)) return [seen.get(need)!, i];
      seen.set(nums[i]!, i);
    }
    return null;
  },
});

export const moveZeroes = defineFunction({
  params: z.object({ nums: z.array(z.number()) }),
  run: ({ nums }) => {
    const nonZero = nums.filter((n: number) => n !== 0);
    return [...nonZero, ...Array.from({ length: nums.length - nonZero.length }, () => 0)];
  },
});

export const maxSubarray = defineFunction({
  params: z.object({ nums: z.array(z.number()) }),
  run: ({ nums }) => {
    let best = nums[0] ?? 0;
    let cur = best;
    for (let i = 1; i < nums.length; i++) {
      cur = Math.max(nums[i]!, cur + nums[i]!);
      best = Math.max(best, cur);
    }
    return best;
  },
});

/**
 * Settlement demo mock: debit a merchant. Hosts may replace with a real DB.
 * Marked sideEffect so live runs push a rollback frame.
 */
export const deductBalance = defineFunction({
  params: z.object({ merchantId: z.string(), amount: z.number() }),
  sideEffect: true,
  run: ({ merchantId, amount }) => ({
    merchantId,
    amount,
    status: "debited" as const,
  }),
  rollback: ({ merchantId, amount }) => ({
    merchantId,
    amount,
    status: "credited" as const,
  }),
});

/**
 * Demo FuncRegistry. Arithmetic is ExprAtom (`$add`/`$mul`), not catalog entries.
 * `add`/`sub`/`mul`/`div`/`delay` are intentionally absent.
 */
export const standardCatalog = {
  concat,
  upper,
  lower,
  length,
  now,
  sort,
  twoSum,
  moveZeroes,
  maxSubarray,
  deductBalance,
} satisfies FuncRegistry;
