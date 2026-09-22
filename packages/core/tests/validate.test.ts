import { expect, test } from "vite-plus/test";

import { FunctionRenderError } from "../src/errors.ts";
import { validate } from "../src/validate.ts";

const catalog = ["add", "fetchUser"];

test("validate accepts a well-formed nested spec", () => {
  const spec = {
    seq: [
      { call: "fetchUser", args: { id: { $state: "/input/id" } }, out: "/user" },
      {
        if: { $state: "/user/active" },
        // oxlint-disable-next-line unicorn/no-thenable -- `then` is a spec field name here
        then: { parallel: [{ call: "add", args: { a: 1, b: 2 } }] },
      },
    ],
  };
  expect(validate(spec, catalog)).toEqual(spec);
});

test("validate rejects an unknown function with a locating path", () => {
  try {
    validate({ seq: [{ call: "nope" }] }, catalog);
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    const e = err as FunctionRenderError;
    expect(e.kind).toBe("validation");
    expect(e.fnName).toBe("nope");
    expect(e.path).toBe("/seq/0");
  }
});

test("validate rejects a node with two discriminant keys", () => {
  expect(() => validate({ call: "add", seq: [] }, catalog)).toThrow(FunctionRenderError);
});

test("validate rejects an invalid JSON Pointer in out", () => {
  expect(() => validate({ call: "add", out: "bad" }, catalog)).toThrow(FunctionRenderError);
});

test("validate rejects an if without then", () => {
  expect(() => validate({ if: true } as unknown, catalog)).toThrow(FunctionRenderError);
});
