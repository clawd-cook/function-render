# 表达式与运算符

> 对应 MDN：[Expressions and operators](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Expressions_and_operators)。
> 复杂度：**L0** 最少集 → **L3** 加宽。全部是封闭、无副作用、同步的 **ExprAtom**。

## 写法

ExprAtom 是**单键**对象，键以 `$` 开头：

```json
{ "$mul": ["$.input.orderAmount", 0.06] }
{ "$gt": ["$.totalAmount", 1000] }
{ "$and": [{ "$gt": ["$.a", 0] }, { "$lt": ["$.a", 10] }] }
```

没有中缀。`"$.a + 1"` 是普通字符串字面量。

## L0 最少集

| 原子 | 含义 |
| --- | --- |
| [`$add`](/reference/operators/add) / [`$mul`](/reference/operators/mul) | 多目加减乘（加法/乘法） |
| [`$gt`](/reference/operators/gt) | 大于 |
| [`$lit`](/reference/operators/lit) | 强制字面量（阻止对字符串做 Slot 解析） |

## L3 加宽（当前引擎全表）

| 组 | 原子 |
| --- | --- |
| 算术 | `$add` `$mul` `$sub` `$div` `$mod` `$pow` `$abs` `$ceil` `$floor` `$round` |
| 比较/逻辑 | `$gt` `$gte` `$lt` `$lte` `$eq` `$neq` `$and` `$or` `$not` |
| 一阶数据 | `$len` `$at` `$concat` `$pick` `$omit` `$merge` |
| 字面量 | `$lit` |

- `$div` 除零 → `phase: "run"`。
- **`$map` 永不进 Expr**（需要子图）→ 用 `arrayMap`。

完整语义：[运算符参考](/reference/operators)。

下一章：[索引集合](/guide/collections)。
