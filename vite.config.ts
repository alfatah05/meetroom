import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// Relative base = works when index.html lives in /meetroom/ on shared hosting.
// Asset URLs become ./assets/xxx.js → resolve next to index.html.
// Override only if needed: BASE_PATH=/meetroom/ npm run build
const base = process.env.BASE_PATH || "./";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base,
});
