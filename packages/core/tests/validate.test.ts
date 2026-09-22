import { expect, test } from "vite-plus/test";

import { FunctionRenderError } from "../src/errors.ts";
import { validate } from "../src/validate.ts";

const funcs = { fetchUser: () => ({}), greet: () => "hi" };

test("validate accepts a well-formed nested FlowSpec", () => {
  const spec = {
    type: "then",
    params: {
      nodes: [
        {
          type: "callFunc",
          params: { funcKey: "fetchUser", args: { id: "$.input.id" } },
          outputTo: "$.user",
        },
        {
          type: "if",
          params: {
            condition: "$.user",
            trueBranch: {
              type: "set",
              params: { path: "$.ok", value: { $add: [1, 2] } },
            },
          },
        },
      ],
    },
  };
  expect(validate(spec, { funcs })).toEqual(spec);
});

test("validate rejects an unknown funcKey with phase validate", () => {
  try {
    validate(
      {
        type: "then",
        params: { nodes: [{ type: "callFunc", params: { funcKey: "nope", args: {} } }] },
      },
      { funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    const e = err as FunctionRenderError;
    expect(e.phase).toBe("validate");
    expect(e.funcKey).toBe("nope");
  }
});

test("validate rejects an unknown NodeType", () => {
  expect(() =>
    validate({ type: "while", params: { condition: true, body: {}, maxIter: 1 } }, { funcs }),
  ).toThrow(FunctionRenderError);
});

test("validate rejects an unknown ExprAtom", () => {
  try {
    validate({ type: "set", params: { path: "$.x", value: { $len: [1, 2] } } }, { funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).message).toMatch(/unknown ExprAtom/);
  }
});

test("validate rejects an if without trueBranch", () => {
  expect(() => validate({ type: "if", params: { condition: true } } as unknown, { funcs })).toThrow(
    FunctionRenderError,
  );
});

test("validate does not execute funcs", () => {
  let ran = false;
  validate(
    { type: "callFunc", params: { funcKey: "boom", args: {} } },
    {
      funcs: {
        boom: () => {
          ran = true;
          return 1;
        },
      },
    },
  );
  expect(ran).toBe(false);
});

test("validate rejects invalid Slot paths and $.input writes", () => {
  try {
    validate({ type: "set", params: { path: "$.a + 1", value: 1 } }, { funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
  }

  try {
    validate({ type: "set", params: { path: "$.input.x", value: 1 } }, { funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).message).toMatch(/readonly/);
  }
});

test("validate rejects non-object funcs with TypeError", () => {
  expect(() =>
    validate({ type: "set", params: { path: "$.x", value: 1 } }, { funcs: null as never }),
  ).toThrow(TypeError);
});
