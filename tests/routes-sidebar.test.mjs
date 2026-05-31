import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

function routePaths(appSource) {
  return [...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((match) => match[1]);
}

function sidebarLinks(sidebarSource) {
  return [...sidebarSource.matchAll(/<SidebarLink[^>]+label="([^"]+)"[^>]+to="([^"]+)"/g)]
    .map((match) => ({ label: match[1], to: match[2] }));
}

test("sidebar workspace links have matching app routes", async () => {
  const appSource = await readText("src/App.tsx");
  const sidebarSource = await readText("src/components/sidebar.tsx");
  const routes = new Set(routePaths(appSource));
  const links = sidebarLinks(sidebarSource);

  assert.ok(links.length >= 8, "sidebar should expose the main DawnDesk app areas");

  for (const link of links) {
    const route = link.to.replace(/^\//, "");
    assert.equal(routes.has(route), true, `${link.label} should route to ${link.to}`);
  }
});

test("documented app areas cover sidebar modules", async () => {
  const readme = await readText("README.md");
  const features = await readText("docs/FEATURES.md");
  const sidebarSource = await readText("src/components/sidebar.tsx");
  const labels = sidebarLinks(sidebarSource).map((link) => link.label);
  const docsText = `${readme}\n${features}`;

  const documentedNames = new Map([
    ["Prompts", "Prompt Manager"],
    ["Projects", "Project Manager"],
    ["Finance", "Finance Manager"],
    ["Workflow", "Workflow Builder"],
    ["Dev Tools", "Developer Tools"],
  ]);

  for (const label of labels) {
    const expectedName = documentedNames.get(label) ?? label;
    assert.match(docsText, new RegExp(`\\b${expectedName}\\b`), `${expectedName} should be documented`);
  }
});
