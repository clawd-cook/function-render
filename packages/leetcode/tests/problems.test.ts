import { run } from "@function-renderer/runner";
import { expect, test } from "vite-plus/test";

import { categories, getProblem, problems } from "../src/index.ts";

test("every problem's ported solution returns the expected sample output", () => {
  for (const problem of problems) {
    expect(problem.solution(problem.sample.input), `${problem.slug} solution`).toEqual(
      problem.sample.expected,
    );
  }
});

test("every problem's spec runs via the runner to the expected output", async () => {
  for (const problem of problems) {
    const { result } = await run(problem.spec, {
      catalog: problem.catalog,
      initialState: problem.sample.input,
    });
    expect(result, `${problem.slug} spec`).toEqual(problem.sample.expected);
  }
});

test("problems are grouped into categories and findable by slug", () => {
  expect(problems.length).toBeGreaterThanOrEqual(6);
  expect(categories.length).toBeGreaterThan(0);
  expect(getProblem("two-sum")?.num).toBe(1);
  expect(getProblem("nope")).toBeUndefined();
});
