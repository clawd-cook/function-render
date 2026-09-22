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

test("switch selects a matching case, else the default", async () => {
  const spec = {
    switch: { $state: "/op" },
    cases: {
      double: { call: "add", args: { a: { $state: "/x" }, b: { $state: "/x" } } },
    },
    default: { call: "add", args: { a: 0, b: 0 } },
  };
  expect(
    (await run(spec, { catalog: baseCatalog, initialState: { op: "double", x: 4 } })).result,
  ).toBe(8);
  expect(
    (await run(spec, { catalog: baseCatalog, initialState: { op: "other", x: 4 } })).result,
  ).toBe(0);
});

test("switch without a matching case and no default returns undefined", async () => {
  const spec = { switch: { $state: "/op" }, cases: { a: { call: "add", args: { a: 1, b: 1 } } } };
  expect(
    (await run(spec, { catalog: baseCatalog, initialState: { op: "z" } })).result,
  ).toBeUndefined();
});

test("for iterates an array, writes as/indexAs, and collects results", async () => {
  const spec = {
    for: { $state: "/items" },
    as: "/n",
    indexAs: "/i",
    body: { call: "add", args: { a: { $state: "/n" }, b: { $state: "/i" } } },
  };
  const { state, result } = await run(spec, {
    catalog: baseCatalog,
    initialState: { items: [10, 20, 30] },
  });
  expect(result).toEqual([10, 21, 32]);
  expect(state.n).toBe(30);
  expect(state.i).toBe(2);
});

test("for accepts a number as a range", async () => {
  const spec = {
    for: 3,
    as: "/n",
    body: { call: "add", args: { a: { $state: "/n" }, b: 1 } },
  };
  expect((await run(spec, { catalog: baseCatalog })).result).toEqual([1, 2, 3]);
});

test("for is fail-fast when a body iteration throws", async () => {
  const spec = { for: [1, 2], as: "/n", body: { call: "boom" } };
  await expect(run(spec, { catalog: baseCatalog })).rejects.toBeInstanceOf(FunctionRenderError);
});

test("set node assigns evaluated value to state and returns it", async () => {
  const spec = {
    seq: [
      { set: "/a", value: 40 },
      { set: "/b", value: { $add: [{ $state: "/a" }, 2] } },
    ],
  };
  const { state, result } = await run(spec, { catalog: {} });
  expect(state).toEqual({ a: 40, b: 42 });
  expect(result).toBe(42);
});

test("pure-protocol two-sum runs with only atomic operators (no solution function)", async () => {
  const spec = {
    seq: [
      { set: "/result", value: null },
      {
        for: { $state: "/nums" },
        as: "/x",
        indexAs: "/i",
        body: {
          for: { $state: "/nums" },
          as: "/y",
          indexAs: "/j",
          body: {
            if: {
              $and: [
                { $gt: [{ $state: "/j" }, { $state: "/i" }] },
                { $not: { $state: "/result" } },
                {
                  $eq: [
                    {
                      $add: [
                        { $at: [{ $state: "/nums" }, { $state: "/i" }] },
                        { $at: [{ $state: "/nums" }, { $state: "/j" }] },
                      ],
                    },
                    { $state: "/target" },
                  ],
                },
              ],
            },
            then: { set: "/result", value: [{ $state: "/i" }, { $state: "/j" }] },
          },
        },
      },
      { set: "/result", value: { $state: "/result" } },
    ],
  };
  const { result } = await run(spec, {
    catalog: {},
    initialState: { nums: [2, 7, 11, 15], target: 9 },
  });
  expect(result).toEqual([0, 1]);
});
