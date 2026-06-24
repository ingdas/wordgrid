import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Build output goes to /docs so GitHub Pages can serve it directly.
// base "./" keeps asset paths relative so it works from any repo subpath.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
