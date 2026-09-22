// oxlint-disable unicorn/no-thenable -- `then` is a NodeType in fixtures
import { expect, test } from "vite-plus/test";
import { z } from "zod";

import { FunctionRenderError, run, type FuncRegistry } from "../src/index.ts";

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
    await run({ type: "when", params: { nodes: [] } }, { input: {}, funcs });
    throw new Error("expected throw");
  } catch (err) {
    expect((err as FunctionRenderError).phase).toBe("validate");
  }

  try {
    await run(
      { type: "set", params: { path: "$.x", value: { $pow: [2, 3] } } },
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
