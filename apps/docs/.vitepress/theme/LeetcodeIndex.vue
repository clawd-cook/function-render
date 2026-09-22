<script setup lang="ts">
import { withBase } from "vitepress";

import { categories } from "../../data/problems.ts";
</script>

<template>
  <div class="lc-index">
    <div v-for="category in categories" :key="category.name" class="group">
      <h3>{{ category.name }}</h3>
      <table>
        <thead>
          <tr>
            <th>题号</th>
            <th>题目</th>
            <th>难度</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="problem in category.problems" :key="problem.slug">
            <td>{{ problem.num }}</td>
            <td>
              <a :href="withBase(`/leetcode/${problem.slug}`)">{{ problem.title }}</a>
            </td>
            <td>{{ problem.difficulty }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.group {
  margin-bottom: 1.5rem;
}
table {
  width: 100%;
}
</style>
