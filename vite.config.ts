import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const here = path.dirname(fileURLToPath(import.meta.url));

// Dev-only playground for this package (see demo/, which imports the
// library from ../src directly) — not published; the package.json "files"
// allowlist excludes everything but dist/.
export default defineConfig({
  root: path.join(here, "demo"),
  plugins: [react()],
});
