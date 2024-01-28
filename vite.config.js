import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/main.js",
      userscript: {
        match: ["https://hentainexus.com/view/*"],
        description: "Allows users to download a gallery from HentaiNexus with it's metadata",
      },
    }),
  ],
});
