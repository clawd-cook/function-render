import { problems } from "../data/problems.ts";

export default {
  paths() {
    return problems.map((problem) => ({
      params: { slug: problem.slug, num: problem.num, title: problem.title },
    }));
  },
};
