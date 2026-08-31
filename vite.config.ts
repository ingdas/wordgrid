import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { crazyGamesZip } from "./scripts/dist-zip.mts";

// Build output goes to /docs so GitHub Pages can serve it directly.
// base "./" keeps asset paths relative so it works from any repo subpath.
// crazyGamesZip() then packs that output (minus the submission pack and the
// Pages-only files) into docs/art/wordgrid-crazygames.zip, the upload the art
// page links to — see scripts/dist-zip.mts.
export default defineConfig({
  plugins: [react(), tailwindcss(), crazyGamesZip()],
  base: "./",
  build: {
    outDir: "docs",
    emptyOutDir: true,
  },
});
