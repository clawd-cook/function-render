// oxlint-disable unicorn/no-thenable -- `then` is a NodeType in fixtures
import { expect, test } from "vite-plus/test";
import { z } from "zod";

import { FunctionRenderError, run, setLogSink, type FuncRegistry } from "../src/index.ts";

const settlementSpec = {
  type: "then",
  params: {
    nodes: [
      {
        type: "set",
        params: {
          path: "$.tax",
          value: { $mul: ["$.input.orderAmount", 0.06] },
        },
      },
      {
        type: "set",
        params: {
          path: "$.totalAmount",
          value: { $add: ["$.input.orderAmount", "$.tax"] },
        },
      },
      {
        type: "if",
        params: {
          condition: { $gt: ["$.totalAmount", 1000] },
          trueBranch: {
            type: "callFunc",
            params: {
              funcKey: "deductBalance",
              args: {
                merchantId: "$.input.merchantId",
                amount: "$.totalAmount",
              },
            },
            outputTo: "$.receipt",
          },
        },
      },
    ],
  },
};

test("AC2 settlement demo: tax 120, total 2120, calls deductBalance", async () => {
  let called = false;
  const funcs: FuncRegistry = {
    deductBalance: {
      sideEffect: true,
      params: z.object({ merchantId: z.string(), amount: z.number() }),
      run: (args: Record<string, unknown>) => {
        called = true;
        return { ...args, status: "debited" };
      },
      rollback: () => undefined,
    },
  };
  const { state, result } = await run(settlementSpec, {
    input: { orderAmount: 2000, merchantId: "m1" },
    funcs,
  });
  expect(called).toBe(true);
  expect(state.tax).toBe(120);
  expect(state.totalAmount).toBe(2120);
  expect(result).toEqual({ merchantId: "m1", amount: 2120, status: "debited" });
  expect(state.receipt).toEqual(result);
});

test("AC3 preview: same Slot paths, never calls Func.run", async () => {
  let called = false;
  const funcs: FuncRegistry = {
    deductBalance: {
      sideEffect: true,
      params: z.object({ merchantId: z.string(), amount: z.number() }),
      run: () => {
        called = true;
        return { status: "debited" };
      },
    },
  };
  const { state } = await run(settlementSpec, {
    input: { orderAmount: 2000, merchantId: "m1" },
    funcs,
    preview: true,
  });
  expect(called).toBe(false);
  expect(state.tax).toBe(120);
  expect(state.totalAmount).toBe(2120);
  expect(state.receipt).toBeUndefined();
  expect("receipt" in state).toBe(false);
});

test("AC4: successful deductBalance then later failure → rollback once", async () => {
  let rollbacks = 0;
  const funcs: FuncRegistry = {
    deductBalance: {
      sideEffect: true,
      params: z.object({ merchantId: z.string(), amount: z.number() }),
      run: (args: Record<string, unknown>) => ({ ...args, status: "debited" }),
      rollback: () => {
        rollbacks += 1;
      },
    },
    boom: () => {
      throw new Error("downstream failed");
    },
  };
  await expect(
    run(
      {
        type: "then",
        params: {
          nodes: [
            {
              type: "callFunc",
              params: {
                funcKey: "deductBalance",
                args: { merchantId: "m1", amount: 10 },
              },
            },
            { type: "callFunc", params: { funcKey: "boom", args: {} } },
          ],
        },
      },
      { input: {}, funcs },
    ),
  ).rejects.toMatchObject({ phase: "run" });
  expect(rollbacks).toBe(1);
});

test("deductBalance.run itself throwing pushes no frame (no rollback)", async () => {
  let rollbacks = 0;
  await expect(
    run(settlementSpec, {
      input: { orderAmount: 2000, merchantId: "m1" },
      funcs: {
        deductBalance: {
          sideEffect: true,
          params: z.object({ merchantId: z.string(), amount: z.number() }),
          run: () => {
            throw new Error("insufficient funds");
          },
          rollback: () => {
            rollbacks += 1;
          },
        },
      },
    }),
  ).rejects.toBeInstanceOf(FunctionRenderError);
  expect(rollbacks).toBe(0);
});

test("AC5 unknown type / atom / funcKey → phase validate", async () => {
  const funcs: FuncRegistry = { ok: () => 1 };

  try {
    await run({ type: "notARealType", params: {} } as unknown, { input: {}, funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect((err as FunctionRenderError).phase).toBe("validate");
  }

  try {
    await run(
      { type: "set", params: { path: "$.x", value: { $map: [1, 2] } } },
      { input: {}, funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect((err as FunctionRenderError).phase).toBe("validate");
  }

  try {
    await run({ type: "callFunc", params: { funcKey: "missing", args: {} } }, { input: {}, funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect((err as FunctionRenderError).phase).toBe("validate");
    expect((err as FunctionRenderError).funcKey).toBe("missing");
  }
});

test("infix string is not evaluated as math", async () => {
  const { result } = await run(
    { type: "set", params: { path: "$.x", value: "$.input.a + 1" } },
    { input: { a: 10 }, funcs: {} },
  );
  expect(result).toBe("$.input.a + 1");
});

test("if selects trueBranch / falseBranch", async () => {
  const funcs: FuncRegistry = {
    yes: () => "yes",
    no: () => "no",
  };
  const spec = {
    type: "if",
    params: {
      condition: { $gt: ["$.input.n", 5] },
      trueBranch: { type: "callFunc", params: { funcKey: "yes", args: {} } },
      falseBranch: { type: "callFunc", params: { funcKey: "no", args: {} } },
    },
  };
  expect((await run(spec, { input: { n: 10 }, funcs })).result).toBe("yes");
  expect((await run(spec, { input: { n: 1 }, funcs })).result).toBe("no");
});

test("then returns last result; empty then → undefined", async () => {
  expect(
    (
      await run(
        {
          type: "then",
          params: {
            nodes: [
              { type: "set", params: { path: "$.a", value: 1 } },
              { type: "set", params: { path: "$.b", value: 2 } },
            ],
          },
        },
        { input: {}, funcs: {} },
      )
    ).result,
  ).toBe(2);

  expect(
    (await run({ type: "then", params: { nodes: [] } }, { input: {}, funcs: {} })).result,
  ).toBeUndefined();
});

test("params schema rejects invalid args at run phase", async () => {
  const funcs: FuncRegistry = {
    strict: {
      params: z.object({ a: z.number() }),
      run: (args: Record<string, unknown>) => (args as { a: number }).a + 1,
    },
  };
  try {
    await run(
      { type: "callFunc", params: { funcKey: "strict", args: { a: "nope" } } },
      { input: {}, funcs },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).phase).toBe("run");
    expect((err as FunctionRenderError).funcKey).toBe("strict");
  }
});

test("$.input is readonly", async () => {
  await expect(
    run({ type: "set", params: { path: "$.input.x", value: 1 } }, { input: {}, funcs: {} }),
  ).rejects.toMatchObject({ phase: "validate", message: expect.stringMatching(/readonly/) });
});

test("when runs nodes in parallel and returns results", async () => {
  const { result } = await run(
    {
      type: "when",
      params: {
        nodes: [
          { type: "constant", params: { value: "a" } },
          { type: "expr", params: { value: { $add: [1, 2] } } },
        ],
      },
    },
    { input: {}, funcs: {} },
  );
  expect(result).toEqual(["a", 3]);
});

test("switch matches with Object.is and uses default", async () => {
  const spec = {
    type: "switch",
    params: {
      input: "$.input.kind",
      cases: [
        { match: "a", node: { type: "constant", params: { value: 1 } } },
        { match: "b", node: { type: "constant", params: { value: 2 } } },
      ],
      default: { type: "constant", params: { value: 0 } },
    },
  };
  expect((await run(spec, { input: { kind: "b" }, funcs: {} })).result).toBe(2);
  expect((await run(spec, { input: { kind: "z" }, funcs: {} })).result).toBe(0);
});

test("while iterates until condition false", async () => {
  const { state, result } = await run(
    {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.n", value: 0 } },
          {
            type: "while",
            params: {
              condition: { $lt: ["$.n", 3] },
              maxIter: 10,
              body: {
                type: "set",
                params: { path: "$.n", value: { $add: ["$.n", 1] } },
              },
            },
          },
        ],
      },
    },
    { input: {}, funcs: {} },
  );
  expect(state.n).toBe(3);
  expect(result).toBe(3);
});

test("for binds itemKey and restores after loop", async () => {
  const { state, result } = await run(
    {
      type: "then",
      params: {
        nodes: [
          { type: "set", params: { path: "$.n", value: "keep" } },
          { type: "set", params: { path: "$.sum", value: 0 } },
          {
            type: "for",
            params: {
              items: "$.input.nums",
              itemKey: "n",
              maxIter: 10,
              body: {
                type: "set",
                params: { path: "$.sum", value: { $add: ["$.sum", "$.n"] } },
              },
            },
          },
        ],
      },
    },
    { input: { nums: [1, 2, 3] }, funcs: {} },
  );
  expect(result).toBe(6);
  expect(state.sum).toBe(6);
  expect(state.n).toBe("keep");
});

test("for exceeding maxIter fails at run phase", async () => {
  await expect(
    run(
      {
        type: "for",
        params: {
          items: [1, 2, 3],
          itemKey: "n",
          maxIter: 2,
          body: { type: "constant", params: { value: 1 } },
        },
      },
      { input: {}, funcs: {} },
    ),
  ).rejects.toMatchObject({ phase: "run", message: expect.stringMatching(/maxIter/) });
});

test("while exceeding maxIter fails at run phase", async () => {
  await expect(
    run(
      {
        type: "then",
        params: {
          nodes: [
            { type: "set", params: { path: "$.n", value: 0 } },
            {
              type: "while",
              params: {
                condition: true,
                maxIter: 2,
                body: {
                  type: "set",
                  params: { path: "$.n", value: { $add: ["$.n", 1] } },
                },
              },
            },
          ],
        },
      },
      { input: {}, funcs: {} },
    ),
  ).rejects.toMatchObject({ phase: "run", message: expect.stringMatching(/maxIter/) });
});

test("tryCatch finally runs after catch", async () => {
  const { state, result } = await run(
    {
      type: "tryCatch",
      params: {
        body: {
          type: "assert",
          params: { condition: false, message: "boom" },
        },
        catch: { type: "constant", params: { value: "caught" } },
        finally: { type: "set", params: { path: "$.done", value: true } },
      },
    },
    { input: {}, funcs: {} },
  );
  expect(result).toBe("caught");
  expect(state.done).toBe(true);
  expect(state.error).toBe("boom");
});

test("tryCatch writes $.error and runs catch", async () => {
  const { state, result } = await run(
    {
      type: "tryCatch",
      params: {
        body: {
          type: "assert",
          params: { condition: false, message: "boom" },
        },
        catch: { type: "get", params: { path: "$.error" } },
      },
    },
    { input: {}, funcs: {} },
  );
  expect(state.error).toBe("boom");
  expect(result).toBe("boom");
});

test("preview skips sleep and never calls Func.run", async () => {
  let called = false;
  const start = Date.now();
  await run(
    {
      type: "then",
      params: {
        nodes: [
          { type: "sleep", params: { ms: 200 } },
          {
            type: "callFunc",
            params: { funcKey: "side", args: {} },
          },
        ],
      },
    },
    {
      input: {},
      preview: true,
      funcs: {
        side: {
          sideEffect: true,
          run: () => {
            called = true;
            return 1;
          },
        },
      },
    },
  );
  expect(called).toBe(false);
  expect(Date.now() - start).toBeLessThan(150);
});

test("arrayMap / arrayFilter / arrayReduce", async () => {
  const mapResult = await run(
    {
      type: "arrayMap",
      params: {
        items: "$.input.nums",
        itemKey: "n",
        body: { type: "expr", params: { value: { $mul: ["$.n", 2] } } },
      },
    },
    { input: { nums: [1, 2, 3] }, funcs: {} },
  );
  expect(mapResult.result).toEqual([2, 4, 6]);

  const filterResult = await run(
    {
      type: "arrayFilter",
      params: {
        items: "$.input.nums",
        itemKey: "n",
        condition: { $gt: ["$.n", 1] },
      },
    },
    { input: { nums: [1, 2, 3] }, funcs: {} },
  );
  expect(filterResult.result).toEqual([2, 3]);

  const reduceResult = await run(
    {
      type: "arrayReduce",
      params: {
        items: "$.input.nums",
        itemKey: "n",
        accumKey: "acc",
        init: 0,
        body: { type: "expr", params: { value: { $add: ["$.acc", "$.n"] } } },
      },
    },
    { input: { nums: [1, 2, 3] }, funcs: {} },
  );
  expect(reduceResult.result).toBe(6);
  expect(reduceResult.state.n).toBeUndefined();
  expect(reduceResult.state.acc).toBeUndefined();
});

test("assert / constant / get / log", async () => {
  const logs: unknown[] = [];
  setLogSink((entry) => {
    logs.push(entry.message);
  });
  try {
    const { result, state } = await run(
      {
        type: "then",
        params: {
          nodes: [
            { type: "constant", params: { value: 42 }, outputTo: "$.answer" },
            { type: "log", params: { message: "$.answer" } },
            { type: "assert", params: { condition: { $eq: ["$.answer", 42] }, message: "bad" } },
            { type: "get", params: { path: "$.answer" } },
          ],
        },
      },
      { input: {}, funcs: {} },
    );
    expect(result).toBe(42);
    expect(state.answer).toBe(42);
    expect(logs).toEqual([42]);
  } finally {
    setLogSink(undefined);
  }
});
