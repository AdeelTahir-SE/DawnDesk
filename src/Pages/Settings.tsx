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
              <div className="rounded-2xl border border-red-500/25 bg-red-500/5 p-6">
                <div className="flex items-center gap-3 text-red-500">
                  <HardDrive className="h-5 w-5" />
                  <h3 className="dd-section-title !text-red-500">Data Management</h3>
                </div>
                <p className="mt-3 dd-body">
                  Clear cached app preferences and workspace layout settings. Finance and project databases are stored separately.
                </p>
                <button
                  onClick={() => {
                    localStorage.removeItem("dawndesk_global_settings");
                    setSettings(defaultSettings);
                  }}
                  className="mt-5 dd-btn-danger"
                >
                  Reset App Preferences
                </button>
              </div>
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
