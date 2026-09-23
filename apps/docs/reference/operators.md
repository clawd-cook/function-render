# 运算符（ExprAtom）

出现在 `condition` / `value` / `args` 等处。键必须在封闭 **Expr Catalog** 内。渐进说明见 [表达式与运算符](/guide/expressions)。

## L0 最少集

| 原子 | 要点 |
|------|------|
| [`$add`](/reference/operators/add) | 多目加 |
| [`$mul`](/reference/operators/mul) | 多目乘 |
| [`$gt`](/reference/operators/gt) | 大于 |
| [`$lit`](/reference/operators/lit) | 强制字面量 |

## 算术（L3）

| 原子 | 要点 |
|------|------|
| [`$sub`](/reference/operators/sub) | 减 |
| [`$div`](/reference/operators/div) | 除；除零 → run |
| [`$mod`](/reference/operators/mod) | 取模 |
| [`$pow`](/reference/operators/pow) | 幂 |
| [`$abs`](/reference/operators/abs) | 绝对值 |
| [`$ceil`](/reference/operators/ceil) / [`$floor`](/reference/operators/floor) / [`$round`](/reference/operators/round) | 取整 |

## 比较 / 逻辑（L3）

| 原子 | 要点 |
|------|------|
| [`$gte`](/reference/operators/gte) [`$lt`](/reference/operators/lt) [`$lte`](/reference/operators/lte) | 比较 |
| [`$eq`](/reference/operators/eq) [`$neq`](/reference/operators/neq) | 深度相等 / 不等 |
| [`$and`](/reference/operators/and) [`$or`](/reference/operators/or) [`$not`](/reference/operators/not) | 逻辑 |

## 一阶数据（L3）

| 原子 | 要点 |
|------|------|
| [`$len`](/reference/operators/len) | 长度 |
| [`$at`](/reference/operators/at) | 下标 |
| [`$concat`](/reference/operators/concat) | 拼接 |
| [`$pick`](/reference/operators/pick) / [`$omit`](/reference/operators/omit) | 字段挑选 / 剔除 |
| [`$merge`](/reference/operators/merge) | 浅合并 |

## 规则

- 字符串匹配 `/^\$\.[A-Za-z_][\w.]*$/` 才是 Slot 读；中缀如 `"$.a + 1"` 是普通字符串。
- `$map` **永不**进 Expr；用 NodeType [`arrayMap`](/reference/statements/arrayMap)。
- 未知 `$atom` → `phase: "validate"`。
