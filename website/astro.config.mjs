import { defineConfig } from "astro/config";

// https://astro.build/config
export default defineConfig({
  site: "https://alexcatdad.github.io",
  base: "/the-whisker-shogunate/",
  build: {
    format: "directory",
  },
  markdown: {
    shikiConfig: {
      theme: "github-light",
    },
  },
});
