# Docs pure-protocol demos

## Goal

让 docs 题尽可能用 **视界封闭表纯协议** 表达解法，少靠算法 Func，体现「协议可执行」；仅在放置规则要求时保留 `callFunc`。

## Background

- 视界 Catalog 已交付（`for`/`if`/`$at`/`$add`/`$gt`/…）。
- 现状四题：`maximum-subarray` 已 `pureProtocol: true`；`two-sum` / `move-zeroes` / `sort-an-array` 仍 `callFunc`。
- catalog 仍导出 `twoSum` / `moveZeroes` / `maxSubarray` / `sort`。

## Confirmed facts

- `pureProtocol` 字段已存在；OnlineRunner 跑 `run(spec,{input,funcs})`。
- 无 Map/对象可变算子时，twoSum 可用双重 `for` + `$eq`（O(n²)）纯协议表达。
- moveZeroes 可用 `for` + `$concat` / `arrayReduce` 拼非零与零。
- 原地原地交换式排序没有通用 swap 原子时，bubble/sort 纯协议很丑；`sort` 作 Func 符合「复杂算法 → Func」。

## Requirements

（待定：本轮改写哪些题 — 见 Open Q1）

## Acceptance Criteria

（随切片收敛）

## Out of Scope

- Hot100 扩题到 100；可视化编辑器；新 NodeType/ExprAtom（除非发现缺口阻塞纯协议）。
- 宿主 UI 大改（属建议项 2）。

## Open Questions

1. 本轮改写范围与是否删除算法 Func。
