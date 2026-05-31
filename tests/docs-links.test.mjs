import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function exists(relativePath) {
  try {
    await stat(path.join(root, relativePath));
    return true;
  } catch {
    return false;
  }
}

function localMarkdownLinks(markdown) {
  const markdownLinks = [...markdown.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)].map((match) => match[1]);
  const htmlLinks = [...markdown.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  return [...markdownLinks, ...htmlLinks]
    .map((link) => link.split("#")[0])
    .filter(Boolean)
    .filter((link) => !/^(https?:|mailto:)/i.test(link));
}

test("README local links point to existing files", async () => {
  const readme = await readText("README.md");
  const links = localMarkdownLinks(readme);

  assert.ok(links.includes("./LICENSE"), "README should link to the license");
  assert.ok(links.includes("docs/TESTING.md"), "README should link to the testing guide");

  for (const link of links) {
    assert.equal(await exists(link), true, `${link} should exist`);
  }
});

test("docs index links point to existing docs", async () => {
  const docsReadme = await readText("docs/README.md");
  const links = localMarkdownLinks(docsReadme);

  assert.ok(links.includes("TESTING.md"), "docs index should link to TESTING.md");
  assert.ok(links.includes("FEATURE_AND_SUB_APP_FORMAT.md"), "docs index should link to feature format docs");

  for (const link of links) {
    assert.equal(await exists(path.join("docs", link)), true, `docs/${link} should exist`);
  }
});
