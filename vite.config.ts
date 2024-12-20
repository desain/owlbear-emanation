import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

export default defineConfig({
    plugins: [react(), glsl()],
    build: {
        assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
        rollupOptions: {
            input: {
                // must have a 'main' entry point
                contextmenu: resolve(__dirname, "/contextmenu.html"),
                action: resolve(__dirname, "/action.html"),
            },
        },
    },
});
