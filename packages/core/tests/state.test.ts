import { expect, test } from "vite-plus/test";

import { getByPath, parsePointer, setByPath } from "../src/state.ts";

test("parsePointer decodes tokens and empty pointer", () => {
  expect(parsePointer("")).toEqual([]);
  expect(parsePointer("/a/b")).toEqual(["a", "b"]);
  expect(parsePointer("/a~1b/c~0d")).toEqual(["a/b", "c~d"]);
});

test("getByPath reads nested objects and arrays", () => {
  const state = { user: { name: "Ada", tags: ["x", "y"] } };
  expect(getByPath(state, "")).toBe(state);
  expect(getByPath(state, "/user/name")).toBe("Ada");
  expect(getByPath(state, "/user/tags/1")).toBe("y");
  expect(getByPath(state, "/user/missing")).toBeUndefined();
  expect(getByPath(state, "/user/name/nope")).toBeUndefined();
});

test("setByPath writes in place and creates missing containers", () => {
  const state: Record<string, unknown> = {};
  setByPath(state, "/a/b", 1);
  expect(state).toEqual({ a: { b: 1 } });

  setByPath(state, "/list/0", "first");
  expect((state as any).list).toEqual(["first"]);

  setByPath(state, "/list/-", "second");
  expect((state as any).list).toEqual(["first", "second"]);
});

test("setByPath rejects the root pointer", () => {
  expect(() => setByPath({}, "", 1)).toThrow();
});
