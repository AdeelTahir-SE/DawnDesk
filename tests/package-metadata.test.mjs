import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("package scripts expose the standard verification commands", async () => {
  const pkg = JSON.parse(await readText("package.json"));

  assert.equal(pkg.scripts.build, "tsc && vite build");
  assert.equal(pkg.scripts.test, "node --test tests/*.test.mjs");
  assert.equal(pkg.scripts.check, "npm run build && npm run test");
  assert.match(pkg.scripts["test:ci"], /cargo test --manifest-path src-tauri\/Cargo\.toml/);
});

test("README badges match package metadata", async () => {
  const pkg = JSON.parse(await readText("package.json"));
  const readme = await readText("README.md");

  assert.match(readme, new RegExp(`version-${pkg.version.replaceAll(".", "\\.")}`));
  assert.match(readme, /license-Source--available_non--commercial/);
  assert.match(readme, /desktop-Tauri_2/);
  assert.match(readme, /frontend-React_19/);
});
