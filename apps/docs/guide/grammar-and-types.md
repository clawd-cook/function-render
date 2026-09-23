# 语法与类型

> 对应 MDN：[Grammar and types](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types)。
> 复杂度：**L0**。学完即可读写 Slot、拼出合法节点树。

## FlowSpec / NodeSpec

每个节点形如：

```ts
{ type: string; params: object; outputTo?: string }
```

- `type`：封闭 NodeType 之一（见 [语句参考](/reference/statements)）。
- `params`：该类型的参数；子节点仍是 NodeSpec（树形，无 goto）。
- `outputTo`（可选）：把本节点返回值写入 Slot 路径（如 `$.receipt`）。

整份协议的根就是一个 NodeSpec（通常是 `then`）。

## Slot：共享上下文

| 路径 | 含义 |
| --- | --- |
| `$.input` | `run` 入参，**只读** |
| `$.foo` | 由 `set` / `outputTo` / 循环绑定写入 |

读写算子：

| type | 作用 |
| --- | --- |
| `get` | 读 Slot |
| `set` | 写 Slot；`path` + `value`（`value` 是 Expr） |

```json
{
  "type": "set",
  "params": {
    "path": "$.tax",
    "value": { "$mul": ["$.input.orderAmount", 0.06] }
  }
}
```

## Expr：字面量 · Slot 读 · ExprAtom

出现在 `condition`、`value`、`args` 等处的值统称 **Expr**：

1. **字面量**：`number` / `boolean` / `null` / 普通字符串 / 数组 / 对象（对象字段递归求值）。
2. **Slot 读**：字符串匹配 `/^\$\.[A-Za-z_][\w.]*$/` 才读上下文；`"$.a + 1"` **只是字符串**，不会做中缀运算。
3. **ExprAtom**：单键对象，键在封闭表内，如 `{ "$add": [1, 2] }`。

L0 最少原子：`$add` `$mul` `$gt` `$lit`。更多见 [表达式与运算符](/guide/expressions)。

## 校验

`run` 前先 `validate`：未知 `type` / 未知 `$atom` / 未注册 `funcKey` / `while|for` 缺 `maxIter` 等 → `phase: "validate"`，不执行。

下一章：[控制流](/guide/control-flow)。
