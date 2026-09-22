# @function-renderer/leetcode

LeetCode Hot 100 solutions ported to TypeScript and exposed as
function-renderer catalogs and specs, so each can run in the browser through
`@function-renderer/runner`.

Each `Problem` bundles the statement, the original Python solution, the ported
TypeScript `solution`, a `catalog` registering it, a function-renderer `spec`
that runs it, and a `sample` input/expected pair.

```ts
import { problems, getProblem } from "@function-renderer/leetcode";
import { run } from "@function-renderer/runner";

const p = getProblem("two-sum")!;
const { result } = await run(p.spec, { catalog: p.catalog, initialState: p.sample.input });
// result -> [0, 1]
```

## Attribution

Solutions are ported from the public study repository
[realnghon/LeetCode_Hot100_Python](https://github.com/realnghon/LeetCode_Hot100_Python).
The original Python is preserved on each problem as `python` for reference.
