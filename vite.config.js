import { resolve } from "path";
import { defineConfig } from "vite";
import glsl from 'vite-plugin-glsl';


export default defineConfig({
    plugins: [glsl()],
    build: {
        assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
        rollupOptions: {
            input: { // must have a 'main' entry point
                main: resolve(__dirname, "/background.html"),
                contextmenu: resolve(__dirname, "/aura/contextmenu.html"),
                action: resolve(__dirname, "/aura/action.html"),
            },
        },
    },
});
