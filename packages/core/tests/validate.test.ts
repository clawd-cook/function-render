import { expect, test } from "vite-plus/test";

import { FunctionRenderError } from "../src/errors.ts";
import { validate } from "../src/validate.ts";

const funcs = {
  fetchUser: () => ({}),
  greet: () => "hi",
  debit: {
    sideEffect: true as const,
    run: () => ({ ok: true }),
  },
  pure: () => 1,
};

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
  expect(() => validate({ type: "notARealType", params: {} } as unknown, { funcs })).toThrow(
    FunctionRenderError,
  );
});

test("validate rejects an unknown ExprAtom", () => {
  try {
    validate({ type: "set", params: { path: "$.x", value: { $map: [1, 2] } } }, { funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).message).toMatch(/unknown ExprAtom/);
  }
});

test("validate rejects while/for without maxIter", () => {
  try {
    validate(
      {
        type: "while",
        params: {
          condition: true,
          body: { type: "constant", params: { value: 1 } },
        },
      } as unknown,
      { funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
  }

  try {
    validate(
      {
        type: "for",
        params: {
          items: [1],
          itemKey: "n",
          body: { type: "constant", params: { value: 1 } },
        },
      } as unknown,
      { funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
  }
});

test("validate rejects tryCatch.body sideEffect callFunc", () => {
  try {
    validate(
      {
        type: "tryCatch",
        params: {
          body: {
            type: "callFunc",
            params: { funcKey: "debit", args: {} },
          },
          catch: { type: "constant", params: { value: "caught" } },
        },
      },
      { funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).message).toMatch(/sideEffect/);
  }
});

test("validate allows tryCatch.body pure callFunc and catch sideEffect", () => {
  const spec = {
    type: "tryCatch",
    params: {
      body: { type: "callFunc", params: { funcKey: "pure", args: {} } },
      catch: { type: "callFunc", params: { funcKey: "debit", args: {} } },
    },
  };
  expect(validate(spec, { funcs })).toEqual(spec);
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

test("validate accepts horizon NodeTypes with required params", () => {
  const spec = {
    type: "then",
    params: {
      nodes: [
        {
          type: "for",
          params: {
            items: [1, 2],
            itemKey: "n",
            maxIter: 10,
            body: { type: "get", params: { path: "$.n" } },
          },
        },
        {
          type: "when",
          params: {
            nodes: [
              { type: "constant", params: { value: 1 } },
              { type: "expr", params: { value: { $add: [1, 2] } } },
            ],
          },
        },
        {
          type: "switch",
          params: {
            input: 1,
            cases: [{ match: 1, node: { type: "constant", params: { value: "one" } } }],
          },
        },
        {
          type: "arrayMap",
          params: {
            items: [1],
            itemKey: "x",
            body: { type: "expr", params: { value: { $mul: ["$.x", 2] } } },
          },
        },
      ],
    },
  };
  expect(validate(spec, { funcs })).toEqual(spec);
});
