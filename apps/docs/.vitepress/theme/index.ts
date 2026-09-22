import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme";

import LeetcodeIndex from "./LeetcodeIndex.vue";
import OnlineRunner from "./OnlineRunner.vue";
import ProblemView from "./ProblemView.vue";
import Test262Dashboard from "./Test262Dashboard.vue";

export default {
  extends: DefaultTheme,
  enhanceApp({ app }) {
    app.component("OnlineRunner", OnlineRunner);
    app.component("ProblemView", ProblemView);
    app.component("LeetcodeIndex", LeetcodeIndex);
    app.component("Test262Dashboard", Test262Dashboard);
  },
} satisfies Theme;
