import { relaunch } from "@tauri-apps/plugin-process";
import { check } from "@tauri-apps/plugin-updater";

type TauriUpdate = {
  version?: string;
  date?: string;
  body?: string;
  downloadAndInstall: (onEvent?: (event: unknown) => void) => Promise<void>;
};

let pendingUpdate: TauriUpdate | null = null;

export type AppUpdateInfo = {
  version: string;
  date?: string;
  body?: string;
};

export async function checkForAppUpdate(): Promise<AppUpdateInfo | null> {
  try {
    const update = await check();
    pendingUpdate = update;

    if (!update) return null;

    return {
      version: update.version || "new version",
      date: update.date,
      body: update.body,
    };
  } catch (error) {
    console.info("DawnDesk updater is not available or not configured.", error);
    pendingUpdate = null;
    return null;
  }
}

export async function installAvailableAppUpdate(onEvent?: (event: unknown) => void) {
  if (!pendingUpdate) {
    await checkForAppUpdate();
  }

  if (!pendingUpdate) return false;

  await pendingUpdate.downloadAndInstall(onEvent);

  try {
    await relaunch();
  } catch {
    // Windows installers may close the app automatically after install.
  }

  return true;
}
