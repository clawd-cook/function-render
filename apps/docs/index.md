---
layout: home
hero:
  name: Function Renderer
  text: 声明式函数执行引擎
  tagline: 封闭 NodeType + ExprAtom，业务只经 callFunc 注入 —— then / if / for / when / switch / arrayMap…
  actions:
    - theme: brand
      text: 快速开始
      link: /guide/overview
    - theme: alt
      text: LeetCode 在线运行
      link: /leetcode/
    - theme: alt
      text: GitHub
      link: https://github.com/clawd-cook/logic-render
features:
  - title: 三层身份
    details: Operator（封闭 type）/ ExprAtom（$add、$len…）/ Func（每次 run 注入）。项目不能 registerOperator。
  - title: 安全预览与补偿
    details: preview 永不调用 Func.run；sideEffect Func 成功后可逆序 rollback。
  - title: 浏览器在线运行
    details: 纯前端执行 @logic-renderer/runner，LeetCode 题解可改协议后直接跑。
  - title: 与框架无关
    details: 同一套逻辑在 Node、React、Vue 中一致 —— 逻辑在库，框架只是外壳。
---
