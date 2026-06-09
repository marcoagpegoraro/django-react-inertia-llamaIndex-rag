import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: resolve(rootDir, "frontend"),
  base: "/static/frontend/",
  plugins: [react()],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
    origin: "http://127.0.0.1:5173",
    watch: {
      ignored: ["**/.agents/**", "**/.codex/**"],
    },
  },
  build: {
    manifest: "manifest.json",
    outDir: resolve(rootDir, "frontend_dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        app: resolve(rootDir, "frontend/src/main.jsx"),
      },
    },
  },
});
