import { problems } from "@function-renderer/leetcode";

export default {
  paths() {
    return problems.map((problem) => ({
      params: { slug: problem.slug, num: problem.num, title: problem.title },
    }));
  },
};
