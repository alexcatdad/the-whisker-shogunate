import { defineConfig } from "astro/config";
import node from "@astrojs/node";

// https://astro.build/config
// Last lore sync: 2026-01-29 (added fantasy ingredients)
export default defineConfig({
  site: "https://alexcatdad.github.io",
  base: "/the-whisker-shogunate/",
  output: "server", // Enable SSR for dev
  adapter: node({
    mode: "standalone",
  }),
  build: {
    format: "directory",
  },
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
