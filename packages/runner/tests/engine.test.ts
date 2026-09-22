// oxlint-disable unicorn/no-thenable -- `then` is an `if`-node spec field name in fixtures
import { expect, test } from "vite-plus/test";
import { z } from "zod";

import { FunctionRenderError, run, type Catalog } from "../src/index.ts";

const baseCatalog: Catalog = {
  add: ({ a, b }: { a: number; b: number }) => a + b,
  asyncDouble: async ({ n }: { n: number }) => {
    await Promise.resolve();
    return n * 2;
  },
  boom: () => {
    throw new Error("kaboom");
  },
};

test("happy path: async call, $state args, out write-back", async () => {
  const spec = {
    seq: [
      { call: "asyncDouble", args: { n: { $state: "/x" } }, out: "/doubled" },
      { call: "add", args: { a: { $state: "/doubled" }, b: 1 }, out: "/sum" },
    ],
  };
  const { state, result } = await run(spec, { catalog: baseCatalog, initialState: { x: 20 } });
  expect(state).toEqual({ x: 20, doubled: 40, sum: 41 });
  expect(result).toBe(41);
});

test("seq returns last result; parallel returns an array", async () => {
  const seqResult = await run(
    {
      seq: [
        { call: "add", args: { a: 1, b: 1 } },
        { call: "add", args: { a: 2, b: 3 } },
      ],
    },
    { catalog: baseCatalog },
  );
  expect(seqResult.result).toBe(5);

  const parResult = await run(
    {
      parallel: [
        { call: "add", args: { a: 1, b: 1 } },
        { call: "asyncDouble", args: { n: 5 } },
      ],
    },
    { catalog: baseCatalog },
  );
  expect(parResult.result).toEqual([2, 10]);
});

test("if selects then/else and returns undefined when unmatched without else", async () => {
  const spec = {
    if: { $state: "/flag" },
    then: { call: "add", args: { a: 1, b: 1 } },
    else: { call: "add", args: { a: 9, b: 9 } },
  };
  expect((await run(spec, { catalog: baseCatalog, initialState: { flag: true } })).result).toBe(2);
  expect((await run(spec, { catalog: baseCatalog, initialState: { flag: false } })).result).toBe(
    18,
  );

  const noElse = { if: false as const, then: { call: "add", args: { a: 1, b: 1 } } };
  expect((await run(noElse, { catalog: baseCatalog })).result).toBeUndefined();
});

test("nested composition executes correctly", async () => {
  const spec = {
    seq: [
      { call: "add", args: { a: { $state: "/x" }, b: 0 }, out: "/x" },
      {
        if: { $state: "/x", gt: 10 },
        then: {
          parallel: [
            { call: "asyncDouble", args: { n: { $state: "/x" } }, out: "/d" },
            { call: "add", args: { a: { $state: "/x" }, b: 100 }, out: "/p" },
          ],
        },
      },
    ],
  };
  const { state } = await run(spec, { catalog: baseCatalog, initialState: { x: 20 } });
  expect(state.d).toBe(40);
  expect(state.p).toBe(120);
});

test("fail-fast: a throwing function yields FunctionRenderError(kind=call)", async () => {
  try {
    await run(
      { seq: [{ call: "add", args: { a: 1, b: 1 } }, { call: "boom" }] },
      {
        catalog: baseCatalog,
      },
    );
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    const e = err as FunctionRenderError;
    expect(e.kind).toBe("call");
    expect(e.fnName).toBe("boom");
    expect(e.path).toBe("/seq/1");
    expect((e.cause as Error).message).toBe("kaboom");
  }
});

test("parallel fails when any branch fails", async () => {
  await expect(
    run(
      { parallel: [{ call: "add", args: { a: 1, b: 1 } }, { call: "boom" }] },
      {
        catalog: baseCatalog,
      },
    ),
  ).rejects.toBeInstanceOf(FunctionRenderError);
});

test("params validation rejects invalid args with kind=validation", async () => {
  const catalog: Catalog = {
    strict: {
      params: z.object({ a: z.number() }),
      run: (args) => (args as { a: number }).a + 1,
    },
  };
  try {
    await run({ call: "strict", args: { a: "not-a-number" } }, { catalog });
    throw new Error("expected throw");
  } catch (err) {
    expect(err).toBeInstanceOf(FunctionRenderError);
    expect((err as FunctionRenderError).kind).toBe("validation");
    expect((err as FunctionRenderError).fnName).toBe("strict");
  }
});

test("unknown function is rejected during validation", async () => {
  await expect(run({ call: "nope" }, { catalog: baseCatalog })).rejects.toBeInstanceOf(
    FunctionRenderError,
  );
});
