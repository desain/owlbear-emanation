import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), glsl()],
    server: {
        cors: true, // Enable CORS
    },
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
