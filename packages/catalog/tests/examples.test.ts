import { run } from "@logic-renderer/runner";
import { expect, test } from "vite-plus/test";

import { examples, standardCatalog } from "../src/index.ts";

test("every example runs against the standard catalog", async () => {
  for (const [name, example] of Object.entries(examples)) {
    const result = await run(example.spec, {
      funcs: standardCatalog,
      input: example.input,
    });
    expect(result, `${name} should produce a result`).toBeDefined();
  }
});

test("math-pipeline computes product and total via ExprAtom", async () => {
  const { spec, input } = examples["math-pipeline"];
  const { state, result } = await run(spec, { funcs: standardCatalog, input });
  expect(state.product).toBe(42);
  expect(state.total).toBe(142);
  expect(result).toBe(142);
});

test("greeting builds an uppercased greeting", async () => {
  const { spec, input } = examples.greeting;
  const { state, result } = await run(spec, { funcs: standardCatalog, input });
  expect(state.greeting).toBe("Hello, ADA!");
  expect(result).toBe("Hello, ADA!");
});

test("conditional picks the pass branch", async () => {
  const { spec, input } = examples.conditional;
  const { result } = await run(spec, { funcs: standardCatalog, input });
  expect(result).toBe("pass");
});

test("settlement demo taxes and deducts", async () => {
  const { spec, input } = examples.settlement;
  const { state, result } = await run(spec, { funcs: standardCatalog, input });
  expect(state.tax).toBe(120);
  expect(state.totalAmount).toBe(2120);
  expect(result).toEqual({ merchantId: "m1", amount: 2120, status: "debited" });
});
