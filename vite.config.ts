// import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from "vite-plugin-glsl";
import mkcert from "vite-plugin-mkcert";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react(), glsl(), mkcert()],
    server: {
        cors: true,
        // https: true,
    },
    build: {
        assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
        rollupOptions: {
            input: {
                // must have a 'main' entry point
                action: resolve(__dirname, "/action.html"),
            },
        },
    },
});
