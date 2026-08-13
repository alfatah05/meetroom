import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// GitHub Actions sets BASE_PATH=/REPO_NAME/ for project sites.
// Local dev defaults to "/".
const base = process.env.BASE_PATH || "/";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base,
});
