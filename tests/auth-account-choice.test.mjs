import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

test("Google OAuth asks users to choose an account", async () => {
  const authChoice = await readText("src/Pages/AuthChoice.tsx");
  const requiredAuth = await readText("src/components/RequireGoogleAuth.tsx");

  for (const source of [authChoice, requiredAuth]) {
    assert.match(source, /queryParams:\s*{\s*prompt:\s*"select_account"/s);
  }
});

test("settings exposes a switch account flow", async () => {
  const settings = await readText("src/Pages/Settings.tsx");

  assert.match(settings, /handleSwitchAccount/);
  assert.match(settings, /navigate\("\/auth\?switch=account"\)/);
  assert.match(settings, /Switch Account/);
});

