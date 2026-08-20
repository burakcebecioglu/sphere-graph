import { copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// tsup (esbuild) doesn't process plain, unimported CSS files — copy it into
// dist/ ourselves so the "./style.css" export in package.json resolves.
const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const src = join(root, "src/sphere-graph.css");
const destDir = join(root, "dist");
const dest = join(destDir, "sphere-graph.css");

mkdirSync(destDir, { recursive: true });
copyFileSync(src, dest);
console.log(`Copied ${src} -> ${dest}`);
