import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  base: "./",
  plugins: [react(), basicSsl()],
  server: {
    port: 3000,
    proxy: {
      "/ipfs": {
        target: "https://ipfs.glitterprotocol.dev",
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ipfs/, "/api/v0"),
      },
    },
  },
  resolve: {
    alias: [
      {
        find: /@\//,
        replacement: `${path.resolve(__dirname, "./src")}/`,
      },
    ],
  },
  build: {
    outDir: "dist",
    assetsDir: "./",
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
      },
    },
  },
});
