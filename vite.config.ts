import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { gitGraphPlugin } from "./vite-plugin-git-graph";

export default defineConfig({
  plugins: [react(), gitGraphPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    allowedHosts: true,
  },
});
