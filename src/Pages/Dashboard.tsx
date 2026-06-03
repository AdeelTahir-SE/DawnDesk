import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  Bot,
  Cloud,
  FileText,
  FolderKanban,
  Image as ImageIcon,
  LineChart,
  Monitor,
  Settings,
  ShieldCheck,
  Sparkles,
  StickyNote,
  Terminal,
  Video,
  Wrench,
} from "lucide-react";
import { readTextFile, BaseDirectory, exists } from "@tauri-apps/plugin-fs";
import { useAppLogger, LogEntry } from "../utils/LoggerContext";
import { PROVIDER_LABELS, readAiUsage, subscribeToAiUsage, type AiProvider } from "../lib/aiTextGeneration";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import { listFinanceWorkspaces, listSupabaseProjects } from "../lib/workspaceSync";

type DashboardActivity = Pick<LogEntry, "timestamp" | "level" | "source" | "action" | "message">;

const RELEASE_AI_USAGE_PROVIDERS: AiProvider[] = ["ollama"];

type WorkspaceCounts = {
  projects: number | null;
  finance: number | null;
};

const quickTools = [
  {
    title: "Project Manager",
    text: "Plan issues, sprints, strategies, comments, and members.",
    to: "/project-manager",
    icon: FolderKanban,
  },
  {
    title: "Finance Manager",
    text: "Open shared finance projects, ledgers, AR/AP, audit, and reports.",
    to: "/finance",
    icon: LineChart,
  },
  {
    title: "Notes",
    text: "Capture notes, organize notebooks, and search your knowledge base.",
    to: "/notes",
    icon: StickyNote,
  },
  {
    title: "Prompt Manager",
    text: "Reuse prompts and store model outputs as text, images, or both.",
    to: "/prompts",
    icon: Terminal,
  },
  {
    title: "Photo Editor",
    text: "Edit images with layers, filters, effects, and export tools.",
    to: "/photo-editor",
    icon: ImageIcon,
  },
];

function parseLogLine(line: string): DashboardActivity | null {
  const match = line.match(/^\[(.*?)\] \[(.*?)\] \[(.*?)\] \[(.*?)\] (.*?) - (.*)$/);
  if (!match) return null;
  return {
    timestamp: match[1],
    source: match[2] as LogEntry["source"],
    level: match[4].toLowerCase() as LogEntry["level"],
    action: match[5],
    message: match[6],
  };
}

function readPromptCount() {
  try {
    const prompts = JSON.parse(localStorage.getItem("dawndesk_prompts") || "[]");
    return Array.isArray(prompts) ? prompts.length : 0;
  } catch {
    return 0;
  }
}

function readTheme() {
  return localStorage.getItem("dawndesk_theme") || "dark";
}

function readNotificationsEnabled() {
  try {
    const settings = JSON.parse(localStorage.getItem("dawndesk_global_settings") || "{}");
    return settings.notifications !== false;
  } catch {
    return true;
  }
}

function formatTokenCount(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return String(value);
}

export default function Dashboard() {
  const { logs } = useAppLogger();
  const [fileActivities, setFileActivities] = useState<DashboardActivity[]>([]);
  const [promptCount, setPromptCount] = useState(0);
  const [workspaceCounts, setWorkspaceCounts] = useState<WorkspaceCounts>({ projects: null, finance: null });
  const [theme, setTheme] = useState(readTheme);
  const [notificationsEnabled, setNotificationsEnabled] = useState(readNotificationsEnabled);
  const [aiUsage, setAiUsage] = useState(readAiUsage);

  const activities = useMemo(() => {
    const merged = [...logs, ...fileActivities];
    return merged
      .filter((item, index, array) => array.findIndex((other) => other.timestamp === item.timestamp && other.action === item.action) === index)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 8);
  }, [logs, fileActivities]);

  async function loadLogs() {
    try {
      const hasLog = await exists("dawndesk_activity.log", { baseDir: BaseDirectory.AppLocalData });
      if (!hasLog) return;
      const content = await readTextFile("dawndesk_activity.log", { baseDir: BaseDirectory.AppLocalData });
      const parsed = content
        .trim()
        .split("\n")
        .map(parseLogLine)
        .filter(Boolean) as DashboardActivity[];
      setFileActivities(parsed.reverse().slice(0, 30));
    } catch (err) {
      console.error("Failed to load logs in dashboard", err);
    }
  }

  async function loadWorkspaceCounts() {
    if (!isSupabaseConfigured) return;
    try {
      const [projects, finance] = await Promise.allSettled([
        listSupabaseProjects(),
        listFinanceWorkspaces(),
      ]);
      setWorkspaceCounts({
        projects: projects.status === "fulfilled" ? projects.value.length : null,
        finance: finance.status === "fulfilled" ? finance.value.length : null,
      });
    } catch {
      setWorkspaceCounts({ projects: null, finance: null });
    }
  }

  useEffect(() => {
    setPromptCount(readPromptCount());
    setTheme(readTheme());
    setNotificationsEnabled(readNotificationsEnabled());
    setAiUsage(readAiUsage());
    void loadLogs();
    void loadWorkspaceCounts();

    const refreshSettings = () => {
      setTheme(readTheme());
      setNotificationsEnabled(readNotificationsEnabled());
      setPromptCount(readPromptCount());
      setAiUsage(readAiUsage());
    };
    window.addEventListener("storage", refreshSettings);
    window.addEventListener("dawndesk_theme_changed", refreshSettings);
    const unsubscribeAiUsage = subscribeToAiUsage(() => setAiUsage(readAiUsage()));
    return () => {
      window.removeEventListener("storage", refreshSettings);
      window.removeEventListener("dawndesk_theme_changed", refreshSettings);
      unsubscribeAiUsage();
    };
  }, []);

  const summaryCards = [
    {
      label: "Project Workspaces",
      value: workspaceCounts.projects === null ? "Sign in" : String(workspaceCounts.projects),
      detail: "Project spaces",
      icon: FolderKanban,
      to: "/project-manager",
    },
    {
      label: "Finance Projects",
      value: workspaceCounts.finance === null ? "Sign in" : String(workspaceCounts.finance),
      detail: "Finance workspaces",
      icon: LineChart,
      to: "/finance",
    },
    {
      label: "Saved Prompts",
      value: String(promptCount),
      detail: "Templates and stored outputs",
      icon: Bot,
      to: "/prompts",
    },
    {
      label: "Recent Operations",
      value: String(activities.length),
      detail: "Latest logged app actions",
      icon: Activity,
      to: "/settings?tab=loggers",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-8">
      <section className="dd-hero">
        <p className="dd-label">DawnDesk</p>
        <h1 className="mt-2 dd-page-title">DawnDesk Dashboard</h1>
        <p className="mt-2 max-w-2xl dd-body-lg">
          Jump into active work, check your connected workspaces, and review recent app activity from one useful place.
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((item) => (
          <Link key={item.label} to={item.to} className="dd-card group transition-colors hover:border-yellow-400/35">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="dd-body">{item.label}</p>
                <p className="mt-2 text-3xl font-black text-white">{item.value}</p>
                <p className="mt-2 text-xs font-semibold text-yellow-300">{item.detail}</p>
              </div>
              <span className="dd-icon-box-sm text-yellow-400">
                <item.icon className="h-5 w-5" />
              </span>
            </div>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        <div className="space-y-5 xl:col-span-8">
          <article className="dd-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="dd-section-title">Open A Workspace</h2>
                <p className="mt-1 dd-subtext">Useful shortcuts for the tools you actually use in DawnDesk.</p>
              </div>
              <Link to="/settings" className="dd-btn-secondary h-10 px-3 text-xs">
                <Settings className="h-4 w-4" />
                Settings
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              {quickTools.map((tool) => (
                <Link key={tool.title} to={tool.to} className="rounded-xl border border-neutral-800 bg-neutral-950/45 p-4 transition-colors hover:border-yellow-400/35 hover:bg-neutral-900">
                  <div className="flex gap-4">
                    <span className="dd-icon-box-sm text-yellow-400">
                      <tool.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-white">{tool.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-white/50">{tool.text}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </article>

          <article className="dd-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="dd-section-title">Recent Activity</h2>
                <p className="mt-1 dd-subtext">Operation logs from saves, imports, exports, edits, and sync events.</p>
              </div>
              <button onClick={() => void loadLogs()} className="dd-btn-secondary">
                Refresh
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950/50">
              {activities.length > 0 ? (
                <ul className="divide-y divide-neutral-800">
                  {activities.map((item, index) => (
                    <li key={`${item.timestamp}-${item.action}-${index}`} className="grid gap-3 px-4 py-3 md:grid-cols-[160px_1fr_auto] md:items-center">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{item.action}</p>
                        <p className="mt-1 text-xs uppercase tracking-wide text-white/35">{item.source}</p>
                      </div>
                      <p className="line-clamp-2 text-sm leading-6 text-white/55">{item.message}</p>
                      <div className="flex items-center gap-2 md:justify-end">
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${
                          item.level === "error"
                            ? "border-red-500/30 bg-red-500/10 text-red-300"
                            : item.level === "warning"
                              ? "border-yellow-400/30 bg-yellow-400/10 text-yellow-200"
                              : "border-neutral-700 bg-neutral-900 text-white/45"
                        }`}>
                          {item.level}
                        </span>
                        <span className="text-xs text-white/35">
                          {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="px-4 py-8 text-center text-sm text-white/45">
                  No recent activity yet. Use a DawnDesk tool and logged operations will appear here.
                </div>
              )}
            </div>
          </article>
        </div>

        <aside className="space-y-5 xl:col-span-4">
          <article className="dd-card">
            <h2 className="dd-section-title">System & Sync</h2>
            <p className="mt-1 dd-subtext">Current app state that helps explain what is connected.</p>

            <div className="mt-5 space-y-3">
              <StatusRow icon={<Cloud />} label="Cloud Sync" value={isSupabaseConfigured ? "Ready" : "Setup needed"} ok={isSupabaseConfigured} />
              <StatusRow icon={<Monitor />} label="Theme" value={theme === "light" ? "Light" : "Dark"} ok />
              <StatusRow icon={<ShieldCheck />} label="Notifications" value={notificationsEnabled ? "Enabled" : "Disabled"} ok={notificationsEnabled} />
              <StatusRow icon={<FileText />} label="Activity Log" value={`${activities.length} visible`} ok />
            </div>
          </article>

          <article className="dd-card">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="dd-section-title">AI Token Usage</h2>
                <p className="mt-1 dd-subtext">Tracked from DawnDesk text generation calls.</p>
              </div>
              <Link to="/settings?tab=ai" className="dd-btn-secondary px-3 py-2 text-xs">
                Configure
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {RELEASE_AI_USAGE_PROVIDERS.map((provider) => (
                <div key={provider} className="rounded-xl border border-neutral-800 bg-neutral-950/45 px-3 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-bold text-white/80">{PROVIDER_LABELS[provider]}</span>
                    <span className="text-lg font-black text-yellow-300">{formatTokenCount(aiUsage[provider].totalTokens)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs text-white/40">
                    <span>{aiUsage[provider].requests} request{aiUsage[provider].requests === 1 ? "" : "s"}</span>
                    <span>{formatTokenCount(aiUsage[provider].promptTokens)} in / {formatTokenCount(aiUsage[provider].completionTokens)} out</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dd-card">
            <h2 className="dd-section-title">Creative Tools</h2>
            <p className="mt-1 dd-subtext">Fast access to creation and utility surfaces.</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MiniTool to="/video-editor" icon={<Video />} label="Video" />
              <MiniTool to="/photo-editor" icon={<ImageIcon />} label="Photo" />
              <MiniTool to="/dev-tools" icon={<Wrench />} label="Dev Tools" />
              <MiniTool to="/prompts" icon={<Sparkles />} label="Prompts" />
            </div>
          </article>
        </aside>
      </section>
    </div>
  );
}

function StatusRow({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-neutral-800 bg-neutral-950/45 px-3 py-3">
      <div className="flex items-center gap-3">
        <span className={ok ? "text-yellow-400" : "text-red-300"}>{icon}</span>
        <span className="text-sm font-bold text-white/80">{label}</span>
      </div>
      <span className={ok ? "text-xs font-semibold text-white/45" : "text-xs font-semibold text-red-300"}>{value}</span>
    </div>
  );
}

function MiniTool({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link to={to} className="flex flex-col items-center justify-center rounded-lg border border-neutral-800 bg-neutral-950/40 p-3 text-center transition-colors hover:bg-neutral-800/50">
      <span className="text-white/75">{icon}</span>
      <span className="mt-2 text-xs font-semibold text-white/80">{label}</span>
    </Link>
  );
}
