import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite-plus";
import { lazyPlugins } from "vite-plus";

// https://vite.dev/config/
export default defineConfig({
  plugins: lazyPlugins(() => [vue()]),
});
