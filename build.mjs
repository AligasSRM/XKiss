import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { join } from "node:path";

const root = process.cwd();
const out = join(root, "dist");
const excluded = new Set([
  ".git",
  "node_modules",
  "dist",
  "server.mjs",
  "worker.js",
  "package.json",
  "package-lock.json",
  "build.mjs",
  "README.md"
]);

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (excluded.has(entry.name)) continue;
  await cp(join(root, entry.name), join(out, entry.name), {
    recursive: entry.isDirectory()
  });
}

console.log("XKiss static build complete: dist/");
