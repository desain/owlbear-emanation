import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
    rollupOptions: {
      input: {
        background: resolve(__dirname, "/background.html"),
        contextmenu: resolve(__dirname, "/emanation/contextmenu.html"),
        action: resolve(__dirname, "/emanation/action.html"),
      },
    },
  },
});
