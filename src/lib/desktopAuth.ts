import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { openUrl } from "@tauri-apps/plugin-opener";
import { supabase } from "./supabaseClient";

const DESKTOP_AUTH_REDIRECT_URL = "dawndesk://auth/callback";
const AUTH_DEEP_LINK_EVENT = "dawndesk-auth-deep-link";

export async function signInWithGoogleDesktop() {
  if (!supabase) throw new Error("Cloud sign-in is not configured yet.");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: DESKTOP_AUTH_REDIRECT_URL,
      skipBrowserRedirect: true,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) throw error;
  if (!data.url) throw new Error("Google did not return a sign-in URL.");

  await openUrl(data.url);
}

export async function handleDesktopAuthUrl(url: string) {
  if (!supabase || !url.startsWith(DESKTOP_AUTH_REDIRECT_URL)) return false;

  const parsed = new URL(url);
  const params = new URLSearchParams(parsed.search || parsed.hash.replace(/^#/, ""));
  const errorDescription = params.get("error_description") || params.get("error");
  if (errorDescription) throw new Error(errorDescription);

  const code = params.get("code");
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) throw error;
    return true;
  }

  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return true;
  }

  return false;
}

export async function getInitialDesktopAuthUrl() {
  try {
    return await invoke<string | null>("get_auth_deep_link_arg");
  } catch {
    return null;
  }
}

export function listenForDesktopAuthUrl(handler: (url: string) => void) {
  return listen<string>(AUTH_DEEP_LINK_EVENT, (event) => {
    if (event.payload) handler(event.payload);
  });
}
