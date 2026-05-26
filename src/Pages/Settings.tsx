import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  Bell,
  Check,
  Cpu,
  Database,
  HardDrive,
  Info,
  KeyRound,
  Monitor,
  Moon,
  Save,
  Settings as SettingsIcon,
  Shield,
  Sliders,
  Sparkles,
  User,
} from "lucide-react";

const TABS = [
  { id: "general", label: "General", icon: <Sliders className="h-4 w-4" /> },
  { id: "appearance", label: "Appearance", icon: <Monitor className="h-4 w-4" /> },
  { id: "ai", label: "AI Settings", icon: <Sparkles className="h-4 w-4" /> },
  { id: "privacy", label: "Privacy", icon: <Shield className="h-4 w-4" /> },
  { id: "about", label: "About", icon: <Info className="h-4 w-4" /> },
];

const defaultSettings = {
  theme: "dark",
  density: "comfortable",
  autoLaunch: false,
  hardwareAcceleration: true,
  dataCollection: false,
  aiModel: "gpt-4o",
  aiContextLimit: "8192",
  notifications: true,
  localVault: true,
};

export default function Settings() {
  const [activeTab, setActiveTab] = useState("general");
  const [settings, setSettings] = useState(defaultSettings);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedSettings = localStorage.getItem("dawndesk_global_settings");
    if (savedSettings) {
      try {
        setSettings({ ...defaultSettings, ...JSON.parse(savedSettings) });
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const updateSetting = (key: keyof typeof defaultSettings, value: boolean | string) => {
    const nextSettings = { ...settings, [key]: value };
    setSettings(nextSettings);
    localStorage.setItem("dawndesk_global_settings", JSON.stringify(nextSettings));
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1400);
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-brand-base text-brand-text">
      <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-brand-border bg-brand-elevated">
        <div className="border-b border-brand-border p-6">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl border border-brand-border bg-brand-base text-brand-accent">
              <SettingsIcon className="h-6 w-6" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-black text-brand-text">Settings</h1>
              <p className="text-xs text-brand-text-muted">DawnDesk control panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-brand-accent/10 text-brand-accent shadow-[inset_3px_0_0_#F7C948]"
                  : "text-brand-text-muted hover:bg-white/5 hover:text-brand-text"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-brand-border p-4">
          <div className="rounded-xl border border-brand-border bg-brand-base p-4">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-text-muted">Status</p>
            <div className="mt-3 flex items-center gap-2 text-sm font-bold text-brand-success">
              <Check className="h-4 w-4" />
              Local settings synced
            </div>
          </div>
        </div>
      </aside>

      <main className="custom-scrollbar flex-1 overflow-y-auto p-8">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-brand-text-muted">Preferences</p>
              <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-brand-text">{TABS.find((tab) => tab.id === activeTab)?.label}</h2>
              <p className="mt-2 max-w-2xl text-sm text-brand-text-secondary">Tune the desktop shell, privacy posture, and AI defaults from one place.</p>
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-brand-border bg-brand-elevated px-4 py-2.5 text-sm font-bold text-brand-text">
              {saved ? <Check className="h-4 w-4 text-brand-success" /> : <Save className="h-4 w-4 text-brand-accent" />}
              {saved ? "Saved" : "Auto-save on"}
            </button>
          </header>

          {activeTab === "general" && (
            <SettingsGrid>
              <SettingToggle icon={<Bell />} title="Notifications" text="Allow DawnDesk to surface important app alerts." checked={settings.notifications} onChange={(value) => updateSetting("notifications", value)} />
              <SettingToggle icon={<User />} title="Launch on Startup" text="Open DawnDesk automatically when you sign in." checked={settings.autoLaunch} onChange={(value) => updateSetting("autoLaunch", value)} />
              <SettingToggle icon={<Cpu />} title="Hardware Acceleration" text="Use GPU rendering for smoother panels and animations." checked={settings.hardwareAcceleration} onChange={(value) => updateSetting("hardwareAcceleration", value)} />
              <SettingSelect
                icon={<Sliders />}
                title="Interface Density"
                text="Choose how compact tool screens should feel."
                value={settings.density}
                onChange={(value) => updateSetting("density", value)}
                options={[
                  ["comfortable", "Comfortable"],
                  ["compact", "Compact"],
                  ["spacious", "Spacious"],
                ]}
              />
            </SettingsGrid>
          )}

          {activeTab === "appearance" && (
            <SettingsGrid>
              <SettingSelect
                icon={<Moon />}
                title="Theme"
                text="DawnDesk is optimized for a dark local workspace."
                value={settings.theme}
                onChange={(value) => updateSetting("theme", value)}
                options={[
                  ["dark", "Dark"],
                  ["system", "Follow system"],
                ]}
              />
              <PreviewPanel />
            </SettingsGrid>
          )}

          {activeTab === "ai" && (
            <SettingsGrid>
              <SettingSelect
                icon={<Sparkles />}
                title="Default Model"
                text="Used by AI-assisted tools unless a sub-app overrides it."
                value={settings.aiModel}
                onChange={(value) => updateSetting("aiModel", value)}
                options={[
                  ["gpt-4o", "GPT-4o"],
                  ["claude-3-5-sonnet", "Claude 3.5 Sonnet"],
                  ["gemini-1.5-pro", "Gemini 1.5 Pro"],
                  ["llama-3-70b", "Llama 3 70B"],
                ]}
              />
              <SettingSelect
                icon={<Database />}
                title="Context Limit"
                text="Higher context is useful for long documents and codebases."
                value={settings.aiContextLimit}
                onChange={(value) => updateSetting("aiContextLimit", value)}
                options={[
                  ["4096", "4,096 tokens"],
                  ["8192", "8,192 tokens"],
                  ["32768", "32,768 tokens"],
                  ["128000", "128,000+ tokens"],
                ]}
              />
            </SettingsGrid>
          )}

          {activeTab === "privacy" && (
            <SettingsGrid>
              <SettingToggle icon={<Shield />} title="Anonymous Telemetry" text="Send crash diagnostics and no personal content." checked={settings.dataCollection} onChange={(value) => updateSetting("dataCollection", value)} />
              <SettingToggle icon={<KeyRound />} title="Local Vault Mode" text="Keep sensitive workspace data on this machine." checked={settings.localVault} onChange={(value) => updateSetting("localVault", value)} />
              <div className="rounded-2xl border border-brand-error/25 bg-brand-error/5 p-6">
                <div className="flex items-center gap-3 text-brand-error">
                  <HardDrive className="h-5 w-5" />
                  <h3 className="text-lg font-black">Data Management</h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-brand-text-secondary">
                  Clear cached app preferences and workspace layout settings. Finance and project databases are stored separately.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem("dawndesk_global_settings");
                    setSettings(defaultSettings);
                  }}
                  className="mt-5 rounded-xl border border-brand-error/30 bg-brand-error/10 px-4 py-2 text-sm font-bold text-brand-error transition-colors hover:bg-brand-error/20"
                >
                  Reset App Preferences
                </button>
              </div>
            </SettingsGrid>
          )}

          {activeTab === "about" && (
            <div className="rounded-2xl border border-brand-border bg-brand-elevated p-8">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="grid h-20 w-20 place-items-center rounded-2xl border border-brand-border bg-brand-base text-brand-accent">
                    <SettingsIcon className="h-10 w-10" />
                  </div>
                  <div>
                    <h3 className="font-heading text-3xl font-black text-brand-text">DawnDesk</h3>
                    <p className="mt-1 text-brand-text-muted">Version 0.1.0-alpha</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button className="rounded-xl border border-brand-border bg-brand-base px-5 py-2.5 text-sm font-bold text-brand-text hover:bg-brand-border/50">Check for Updates</button>
                  <button className="rounded-xl border border-brand-border bg-brand-base px-5 py-2.5 text-sm font-bold text-brand-text hover:bg-brand-border/50">View License</button>
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

function SettingToggle({ icon, title, text, checked, onChange }: { icon: ReactNode; title: string; text: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-elevated p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-border bg-brand-base text-brand-accent">{icon}</span>
          <div>
            <h3 className="font-bold text-brand-text">{title}</h3>
            <p className="mt-1 text-sm leading-relaxed text-brand-text-muted">{text}</p>
          </div>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input type="checkbox" className="peer sr-only" checked={checked} onChange={(event) => onChange(event.target.checked)} />
          <div className="h-6 w-11 rounded-full bg-brand-border after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-brand-text-secondary after:bg-brand-text after:transition-all after:content-[''] peer-checked:bg-brand-accent peer-checked:after:translate-x-full peer-checked:after:border-brand-base" />
        </label>
      </div>
    </div>
  );
}

function SettingSelect({ icon, title, text, value, options, onChange }: { icon: ReactNode; title: string; text: string; value: string; options: [string, string][]; onChange: (value: string) => void }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-brand-elevated p-6">
      <div className="flex gap-4">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-brand-border bg-brand-base text-brand-accent">{icon}</span>
        <div className="flex-1">
          <h3 className="font-bold text-brand-text">{title}</h3>
          <p className="mt-1 text-sm leading-relaxed text-brand-text-muted">{text}</p>
          <select value={value} onChange={(event) => onChange(event.target.value)} className="mt-5 w-full rounded-xl border border-brand-border bg-brand-base px-4 py-3 text-sm font-semibold text-brand-text outline-none focus:border-brand-accent/50">
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
    <div className="rounded-2xl border border-brand-border bg-brand-elevated p-6">
      <h3 className="font-bold text-brand-text">Workspace Preview</h3>
      <div className="mt-5 rounded-xl border border-brand-border bg-brand-base p-4">
        <div className="flex items-center justify-between">
          <div className="h-3 w-24 rounded-full bg-brand-text/70" />
          <div className="h-7 w-7 rounded-lg bg-brand-accent" />
        </div>
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-16 rounded-lg bg-brand-card" />
          <div className="h-16 rounded-lg bg-brand-card" />
          <div className="h-16 rounded-lg bg-brand-card" />
        </div>
      </div>
    </div>
  );
}
