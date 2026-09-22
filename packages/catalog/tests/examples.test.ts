import { run } from "@function-renderer/runner";
import { expect, test } from "vite-plus/test";

import { examples, standardCatalog } from "../src/index.ts";

test("every example runs against the standard catalog", async () => {
  for (const [name, example] of Object.entries(examples)) {
    const result = await run(example.spec, {
      catalog: standardCatalog,
      initialState: example.initialState,
    });
    expect(result, `${name} should produce a result`).toBeDefined();
  }
});

test("math-pipeline computes product and total", async () => {
  const { spec, initialState } = examples["math-pipeline"];
  const { state, result } = await run(spec, { catalog: standardCatalog, initialState });
  expect(state.product).toBe(42);
  expect(state.total).toBe(142);
  expect(result).toBe(142);
});

test("greeting builds an uppercased greeting", async () => {
  const { spec, initialState } = examples.greeting;
  const { state, result } = await run(spec, { catalog: standardCatalog, initialState });
  expect(state.greeting).toBe("Hello, ADA!");
  expect(result).toBe("Hello, ADA!");
});

test("conditional picks the pass branch", async () => {
  const { spec, initialState } = examples.conditional;
  const { result } = await run(spec, { catalog: standardCatalog, initialState });
  expect(result).toBe("pass");
});

test("parallel-demo returns both results", async () => {
  const { spec, initialState } = examples["parallel-demo"];
  const { result } = await run(spec, { catalog: standardCatalog, initialState });
  expect(result).toEqual([10, 15]);
});
