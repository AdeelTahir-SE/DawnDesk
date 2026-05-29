import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";

type ExportTextFileOptions = {
  title: string;
  defaultPath: string;
  contents: string;
  filters?: { name: string; extensions: string[] }[];
};

export async function exportTextFile({ title, defaultPath, contents, filters }: ExportTextFileOptions) {
  const path = await save({
    title,
    defaultPath,
    filters,
    canCreateDirectories: true,
  });

  if (!path) return null;

  await writeTextFile(path, contents);
  return path;
}

export function toJsonExport(value: unknown) {
  return JSON.stringify(value, null, 2);
}
