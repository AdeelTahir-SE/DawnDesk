import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { invoke } from "@tauri-apps/api/core";
import {
  Bell,
  Check,
  Cpu,
  Info,
  Monitor,
  Moon,
  Save,
  Settings as SettingsIcon,
  Shield,
  LogOut,
  Sliders,
  User,
} from "lucide-react";
import { LOGGER_SOURCES, useAppLogger, type LogLevel, type LoggerSource } from "../utils/LoggerContext";
import { isSupabaseConfigured, supabase } from "../lib/supabaseClient";

const TABS = [
  { id: "general", label: "General", icon: <Sliders className="h-4 w-4" /> },
  { id: "loggers", label: "Operation Toasts", icon: <Bell className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Monitor className="h-4 w-4" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
  { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

const defaultSettings = {
  theme: "dark",
  autoLaunch: false,
  hardwareAcceleration: true,
  notifications: true,
};

function applyDawnDeskTheme(theme: string) {
  const resolvedTheme = theme === "light" ? "light" : "dark";
  const isLight = resolvedTheme === "light";
  document.documentElement.classList.toggle("light", isLight);
  document.documentElement.classList.toggle("dark", !isLight);
  localStorage.setItem("dawndesk_theme", resolvedTheme);
  window.dispatchEvent(new CustomEvent("dawndesk_theme_changed", { detail: { theme: resolvedTheme } }));
  return resolvedTheme;
}

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [nativeSettingsNote, setNativeSettingsNote] = useState("");
  const logger = useAppLogger();
  const { logSuccess, logError } = logger;

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some((item) => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  useEffect(() => {
    const savedTheme = localStorage.getItem("dawndesk_theme") || defaultSettings.theme;
    const savedSettings = localStorage.getItem("dawndesk_global_settings");
    if (savedSettings) {
      try {
        const nextSettings = { ...defaultSettings, ...JSON.parse(savedSettings), theme: savedTheme };
        setSettings(nextSettings);
        logger.updateLoggerSettings({
          toastsEnabled: nextSettings.notifications,
          channels: { ...logger.settings.channels, operation: nextSettings.notifications },
        });
      } catch (e) {
        console.error(e);
      }
    } else {
      setSettings((current) => ({ ...current, theme: savedTheme }));
    }
    void Promise.all([
      invoke<boolean>("get_auto_launch"),
      invoke<boolean>("get_hardware_acceleration"),
    ])
      .then(([autoLaunch, hardwareAcceleration]) => {
        setSettings((current) => {
          const nextSettings = { ...current, autoLaunch, hardwareAcceleration };
          localStorage.setItem("dawndesk_global_settings", JSON.stringify(nextSettings));
          return nextSettings;
        });
      })
      .catch((error) => {
        console.warn("Native settings are not available in this environment.", error);
      });
  }, []);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      if (!supabase || !isSupabaseConfigured) return;
      const { data } = await supabase.auth.getSession();
      if (isMounted) {
        setAuthEmail(data.session?.user.email ?? null);
      }
    };
    loadSession();

    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      setAuthEmail(session?.user.email ?? null);
    });

    return () => {
      isMounted = false;
      subscription?.data.subscription.unsubscribe();
    };
  }, []);

  const persistSettings = (nextSettings: typeof defaultSettings) => {
    setSettings(nextSettings);
    localStorage.setItem("dawndesk_global_settings", JSON.stringify(nextSettings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  const updateSetting = async (key: keyof typeof defaultSettings, value: boolean | string) => {
    const nextSettings = { ...settings, [key]: value };
    persistSettings(nextSettings);

    if (key === "notifications" && typeof value === "boolean") {
      logger.updateLoggerSettings({
        toastsEnabled: value,
        channels: { ...logger.settings.channels, operation: value },
      });
      logSuccess("Settings", value ? "Operation notifications enabled" : "Operation notifications disabled", { source: "settings" });
      return;
    }

    if (key === "theme" && typeof value === "string") {
      const resolvedTheme = applyDawnDeskTheme(value);
      persistSettings({ ...nextSettings, theme: resolvedTheme });
      logSuccess("Settings", `${resolvedTheme === "light" ? "Light" : "Dark"} theme applied`, { source: "settings" });
      return;
    }

    if (key === "autoLaunch" && typeof value === "boolean") {
      try {
        await invoke("set_auto_launch", { enabled: value });
        logSuccess("Settings", value ? "DawnDesk will launch on startup" : "DawnDesk startup launch disabled", { source: "settings" });
      } catch (error) {
        setNativeSettingsNote(String(error));
        persistSettings({ ...nextSettings, autoLaunch: !value });
        logError("Settings", `Could not update launch on startup: ${String(error)}`, { source: "settings" });
      }
      return;
    }

    if (key === "hardwareAcceleration" && typeof value === "boolean") {
      try {
        await invoke("set_hardware_acceleration", { enabled: value });
        setNativeSettingsNote("Hardware acceleration changes apply after restarting DawnDesk.");
        logSuccess("Settings", value ? "Hardware acceleration enabled after restart" : "Hardware acceleration disabled after restart", { source: "settings" });
      } catch (error) {
        setNativeSettingsNote(String(error));
        persistSettings({ ...nextSettings, hardwareAcceleration: !value });
        logError("Settings", `Could not update hardware acceleration: ${String(error)}`, { source: "settings" });
      }
      return;
    }

    logSuccess("Settings", `${key} updated`, { source: "settings" });
  };

  const markSaved = () => {
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  useEffect(() => {
    const refreshTheme = () => {
      setSettings((current) => ({ ...current, theme: localStorage.getItem("dawndesk_theme") || "dark" }));
    };
    window.addEventListener("storage", refreshTheme);
    window.addEventListener("dawndesk_theme_changed", refreshTheme);
    return () => {
      window.removeEventListener("storage", refreshTheme);
      window.removeEventListener("dawndesk_theme_changed", refreshTheme);
    };
  }, []);

  const handleLogout = async () => {
    if (!supabase || !isSupabaseConfigured) {
      setAuthError("Cloud account sign-out is not available right now.");
      return;
    }

    setAuthLoading(true);
    setAuthError("");
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
      logError("Settings", `Logout failed: ${error.message}`, { source: "settings" });
    } else {
      setAuthEmail(null);
      logSuccess("Settings", "Signed out of cloud account", { source: "settings" });
    }
    setAuthLoading(false);
  };

  return (
    <div className="dd-page">
      <aside className="dd-sidebar">
        <div className="dd-sidebar-header">
          <div className="flex items-center gap-3">
            <div className="dd-icon-box">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="dd-sidebar-title text-base">Settings</h1>
              <p className="dd-subtext">DawnDesk control panel</p>
            </div>
          </div>
        </div>

        <nav className="custom-scrollbar flex-1 overflow-y-auto p-3 space-y-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`dd-nav-item ${
                activeTab === tab.id
                  ? "dd-nav-item-active"
                  : ""
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-neutral-800 p-4">
          <div className="dd-sidebar-notice">
            <p className="dd-label-muted">Status</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-green-400">
              <Check className="h-4 w-4" />
              Local settings synced
            </div>
          </div>
        </div>
      </aside>

      <main className="dd-main">
        <div className="dd-content max-w-5xl">
          <section className="dd-hero">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="dd-label">Preferences</p>
                <h2 className="dd-page-title mt-2">{TABS.find((tab) => tab.id === activeTab)?.label}</h2>
                <p className="dd-body-lg max-w-2xl mt-2">Tune the desktop shell, privacy posture, and AI defaults from one place.</p>
              </div>
              <button className="dd-btn-secondary bg-neutral-950/50">
                {saved ? <Check className="h-4 w-4 text-green-400" /> : <Save className="h-4 w-4 text-yellow-400" />}
                {saved ? "Saved" : "Auto-save on"}
              </button>
            </div>
          </section>

          {activeTab === "general" && (
            <div className="space-y-5">
              <SettingsGrid>
                <SettingToggle icon={<Bell />} title="Notifications" text="Allow DawnDesk to surface important app alerts." checked={settings.notifications} onChange={(value) => void updateSetting("notifications", value)} />
                <SettingToggle icon={<User />} title="Launch on Startup" text="Open DawnDesk automatically when you sign in." checked={settings.autoLaunch} onChange={(value) => void updateSetting("autoLaunch", value)} />
                <SettingToggle icon={<Cpu />} title="Hardware Acceleration" text="Use GPU rendering for smoother panels and animations. Changes apply after restart." checked={settings.hardwareAcceleration} onChange={(value) => void updateSetting("hardwareAcceleration", value)} />
              </SettingsGrid>
              {nativeSettingsNote && (
                <div className="rounded-xl border border-yellow-400/25 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-100">
                  {nativeSettingsNote}
                </div>
              )}
            </div>
          )}

          {activeTab === "loggers" && (
            <LoggerSettingsPanel onSaved={markSaved} />
          )}

          {activeTab === "appearance" && (
            <SettingsGrid>
              <SettingSelect
                icon={<Moon />}
                title="Theme"
                text="Switch DawnDesk between the same dark and light themes used by the top bar button."
                value={settings.theme}
                onChange={(value) => void updateSetting("theme", value)}
                options={[
                  ["dark", "Dark"],
                  ["light", "Light"],
                ]}
              />
              <PreviewPanel />
            </SettingsGrid>
          )}

          {activeTab === "privacy" && (
            <SettingsGrid>
              <AuthSessionCard
                email={authEmail}
                loading={authLoading}
                error={authError}
                onLogout={handleLogout}
              />
            </SettingsGrid>
          )}

          {activeTab === "about" && (
            <div className="dd-card-elevated">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl border border-neutral-800 bg-neutral-950 text-yellow-400">
                    <SettingsIcon className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-heading text-3xl font-black text-white">DawnDesk</h3>
                    <p className="mt-1 dd-subtext">Version 0.1.0-alpha</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="dd-btn-secondary">Check for Updates</button>
                  <button className="dd-btn-secondary">View License</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function SettingsGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">{children}</div>;
}

function AuthSessionCard({
  email,
  loading,
  error,
  onLogout,
}: {
  email: string | null;
  loading: boolean;
  error: string;
  onLogout: () => void;
}) {
  return (
    <div className="dd-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="dd-icon-box">
            <User />
          </span>
          <div>
            <h3 className="dd-card-title">Cloud Account</h3>
            <p className="mt-1 dd-subtext">
              {email ? `Signed in as ${email}` : "No cloud account is currently signed in."}
            </p>
          </div>
        </div>
      </div>
      {error && (
        <div className="mt-4 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      <button
        onClick={onLogout}
        disabled={loading || !email}
        className="mt-5 inline-flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-bold text-red-300 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading ? <Save className="h-4 w-4 animate-pulse" /> : <LogOut className="h-4 w-4" />}
        Log Out
      </button>
    </div>
  );
}

const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  info: "Info",
  success: "Success",
  warning: "Warnings",
  error: "Errors",
};

function LoggerSettingsPanel({ onSaved }: { onSaved: () => void }) {
  const { logs, settings, updateLoggerSettings, resetLoggerSettings, logSuccess } = useAppLogger();

  const update = (patch: Parameters<typeof updateLoggerSettings>[0]) => {
    updateLoggerSettings(patch);
    onSaved();
  };

  const updateLevel = (level: LogLevel, value: boolean) => {
    update({ levels: { ...settings.levels, [level]: value } });
  };

  const updateSource = (source: LoggerSource, value: boolean) => {
    update({ sources: { ...settings.sources, [source]: value } });
  };

  const updateMutedAction = (action: string, value: boolean) => {
    update({ mutedActions: { ...settings.mutedActions, [action]: value } });
  };

  const recentActions = Array.from(new Set(logs.filter((log) => log.channel === "operation").map((log) => log.action))).slice(0, 10);

  return (
    <div className="space-y-5">
      <SettingsGrid>
        <SettingToggle
          icon={<Bell />}
          title="Operation Toasts"
          text="Show toast feedback when DawnDesk performs app operations such as save, import, export, apply effects, or errors."
          checked={settings.enabled && settings.toastsEnabled && settings.channels.operation}
          onChange={(value) => update({ enabled: value, toastsEnabled: value, channels: { ...settings.channels, operation: value } })}
        />
        <SettingToggle
          icon={<Info />}
          title="Keep Log File"
          text="Write operation history to the local DawnDesk activity log even if toast notifications are disabled."
          checked={settings.fileEnabled}
          onChange={(value) => update({ fileEnabled: value })}
        />
        <SettingToggle
          icon={<Monitor />}
          title="Console Logging"
          text="Mirror operation entries into the developer console for debugging."
          checked={settings.consoleEnabled}
          onChange={(value) => update({ consoleEnabled: value })}
        />
        <div className="dd-card">
          <div className="flex gap-4">
            <span className="dd-icon-box"><Bell /></span>
            <div className="flex-1">
              <h3 className="dd-card-title">Preview Toast</h3>
              <p className="mt-1 dd-subtext">Send a sample operation toast using the current logger settings.</p>
              <button
                className="mt-5 dd-btn-secondary"
                onClick={() => logSuccess("Settings", "Operation toast preview is working.", { source: "settings" })}
              >
                Test Toast
              </button>
            </div>
          </div>
        </div>
      </SettingsGrid>

      <div className="dd-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="dd-card-title">Toast Levels</h3>
            <p className="mt-1 dd-subtext">Choose which operation severities can show toast feedback.</p>
          </div>
          <button
            className="dd-btn-secondary"
            onClick={() => {
              resetLoggerSettings();
              onSaved();
            }}
          >
            Reset
          </button>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {(Object.keys(LOG_LEVEL_LABELS) as LogLevel[]).map((level) => (
            <SettingInlineToggle
              key={level}
              label={LOG_LEVEL_LABELS[level]}
              checked={settings.levels[level]}
              onChange={(value) => updateLevel(level, value)}
            />
          ))}
        </div>
      </div>

      <div className="dd-card">
        <h3 className="dd-card-title">Sub-App Toasts</h3>
        <p className="mt-1 dd-subtext">Turn operation toasts on or off for specific DawnDesk apps.</p>
        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
          {LOGGER_SOURCES.filter((source) => source.id !== "shell").map((source) => (
            <SettingInlineToggle
              key={source.id}
              label={source.label}
              checked={settings.sources[source.id]}
              onChange={(value) => updateSource(source.id, value)}
            />
          ))}
        </div>
      </div>

      <div className="dd-card">
        <h3 className="dd-card-title">Specific Operation Loggers</h3>
        <p className="mt-1 dd-subtext">Mute noisy operation names that appear in recent activity.</p>
        {recentActions.length === 0 ? (
          <p className="mt-5 dd-subtext">No operation toasts have been recorded yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            {recentActions.map((action) => (
              <SettingInlineToggle
                key={action}
                label={action}
                checked={!settings.mutedActions[action]}
                onChange={(value) => updateMutedAction(action, !value)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingInlineToggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-neutral-800 bg-neutral-950/40 px-3 py-2">
      <span className="text-sm font-semibold text-white/80">{label}</span>
      <span className="relative inline-flex cursor-pointer items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
        <span className="h-5 w-9 rounded-full bg-neutral-700 after:absolute after:left-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-4" />
      </span>
    </label>
  );
}

function SettingToggle({ icon, title, text, checked, onChange }: { icon: ReactNode; title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="dd-card">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="dd-icon-box">{icon}</span>
          <div>
            <h3 className="dd-card-title">{title}</h3>
            <p className="mt-1 dd-subtext">{text}</p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <div className="h-6 w-11 rounded-full bg-neutral-700 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-500 after:bg-white after:transition-all after:content-[''] peer-checked:bg-yellow-400 peer-checked:after:translate-x-full peer-checked:after:border-white" />
        </label>
      </div>
    </div>
  );
}

function SettingSelect({ icon, title, text, value, options, onChange }: { icon: ReactNode; title: string; text: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div className="dd-card">
      <div className="flex gap-4">
        <span className="dd-icon-box">{icon}</span>
        <div className="flex-1">
          <h3 className="dd-card-title">{title}</h3>
          <p className="mt-1 dd-subtext">{text}</p>
          <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-5 dd-select w-full">
            {options.map(([optionValue, label]) => (
              <option key={optionValue} value={optionValue}>{label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

function PreviewPanel() {
  return (
    <div className="dd-card">
      <h3 className="dd-card-title">Workspace Preview</h3>
      <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-full bg-white/70" />
          <div className="h-7 w-7 rounded-lg bg-yellow-400" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-16 rounded-lg bg-neutral-800" />
          <div className="h-16 rounded-lg bg-neutral-800" />
          <div className="h-16 rounded-lg bg-neutral-800" />
        </div>
      </div>
    </div>
  );
}
