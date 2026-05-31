import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

async function readText(relativePath) {
  return readFile(path.join(root, relativePath), "utf8");
}

async function listFiles(relativeDir) {
  const dir = path.join(root, relativeDir);
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const relativePath = path.join(relativeDir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(relativePath));
    } else {
      files.push(relativePath.replaceAll("\\", "/"));
    }
  }

  return files;
}

async function fileExists(relativePath) {
  try {
    return (await stat(path.join(root, relativePath))).isFile();
  } catch {
    return false;
  }
}

function activeAssetPaths(assetDoc) {
  const activeSections = assetDoc.split("## Cleanup Completed")[0] ?? assetDoc;
  return [...activeSections.matchAll(/`((?:public|src\/assets)\/[^`]+)`/g)].map((match) => match[1]);
}

test("active assets inventory matches files on disk", async () => {
  const assetDoc = await readText("docs/ASSETS.md");
  const listedAssets = activeAssetPaths(assetDoc).sort();
  const actualAssets = [
    ...await listFiles("public"),
    ...await listFiles("src/assets"),
  ].sort();

  assert.deepEqual(actualAssets, listedAssets);

  for (const asset of listedAssets) {
    assert.equal(await fileExists(asset), true, `${asset} should exist`);
  }
});

test("public assets are referenced by URL and bundled assets are imported", async () => {
  const assetDoc = await readText("docs/ASSETS.md");
  const listedAssets = activeAssetPaths(assetDoc);
  const searchableSources = [
    await readText("README.md"),
    await readText("src/Pages/Home.tsx"),
    await readText("src/Pages/AuthChoice.tsx"),
    await readText("src/Pages/PromptManager.tsx"),
    await readText("src/components/video-editor/VideoEditorOnboarding.tsx"),
    await readText("src/components/photo-editor/PhotoEditorOnboarding.tsx"),
  ].join("\n");

  for (const asset of listedAssets) {
    const basename = path.basename(asset);
    assert.match(searchableSources, new RegExp(basename.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")), `${asset} should be referenced`);
  }
});
