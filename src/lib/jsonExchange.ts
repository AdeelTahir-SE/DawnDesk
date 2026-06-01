export function downloadJsonFile(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".json") ? filename : `${filename}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export async function saveJsonFile(filename: string, data: unknown, title = "Save JSON export") {
  const contents = JSON.stringify(data, null, 2);
  try {
    const { save } = await import("@tauri-apps/plugin-dialog");
    const { writeTextFile } = await import("@tauri-apps/plugin-fs");
    const path = await save({
      title,
      defaultPath: filename.endsWith(".json") ? filename : `${filename}.json`,
      filters: [{ name: "JSON", extensions: ["json"] }],
      canCreateDirectories: true,
    });
    if (!path) return null;
    await writeTextFile(path, contents);
    return path;
  } catch {
    downloadJsonFile(filename, data);
    return filename;
  }
}

export function pickJsonFile(): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error("No JSON file selected."));
        return;
      }

      try {
        resolve(JSON.parse(await file.text()));
      } catch {
        reject(new Error("Selected file is not valid JSON."));
      }
    };
    input.click();
  });
}

export function safeExportName(value: string, fallback: string) {
  const cleaned = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return cleaned || fallback;
}
