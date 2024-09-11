import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        background: resolve(__dirname, "background.html"),
      },
    },
  },
});
