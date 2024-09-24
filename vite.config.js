import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
    rollupOptions: {
      input: {
        contextmenu: resolve(__dirname, "/emanation/contextmenu.html"),
        background: resolve(__dirname, "/background.html"),
        action: resolve(__dirname, "/emanation/action.html"),
      },
    },
  },
});
