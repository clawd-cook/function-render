import { expect, test } from "vite-plus/test";

import { getSlot, normalizeSlotPath, parseSlotSegments, setSlot } from "../src/state.ts";

test("normalizeSlotPath accepts $.path and shorthand", () => {
  expect(normalizeSlotPath("$.tax")).toBe("$.tax");
  expect(normalizeSlotPath("tax")).toBe("$.tax");
  expect(normalizeSlotPath("a.b")).toBe("$.a.b");
});

test("parseSlotSegments splits dotted paths", () => {
  expect(parseSlotSegments("$.a.b")).toEqual(["a", "b"]);
  expect(parseSlotSegments("input.orderAmount")).toEqual(["input", "orderAmount"]);
});

test("getSlot reads nested objects", () => {
  const state = { input: { name: "Ada" }, tax: 120 };
  expect(getSlot(state, "$.input.name")).toBe("Ada");
  expect(getSlot(state, "$.tax")).toBe(120);
  expect(getSlot(state, "$.missing")).toBeUndefined();
});

test("setSlot writes and creates intermediate objects", () => {
  const state: Record<string, unknown> = { input: {} };
  setSlot(state, "$.a.b", 1);
  expect(state).toEqual({ input: {}, a: { b: 1 } });
});

test("setSlot rejects writes under $.input", () => {
  expect(() => setSlot({ input: {} }, "$.input.x", 1)).toThrow(/readonly/);
});
