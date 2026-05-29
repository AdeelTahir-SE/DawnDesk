import { useEffect, useState } from "react";
import { Plus, Webhook, Zap, Link, Database, X } from "lucide-react";

type IntegrationApp = {
  name: string;
  category: string;
  status: "Connected" | "Disconnected";
  sync: string;
};

export default function IntegrationsAutomationView() {
  const [activeTab, setActiveTab] = useState("integrations");
  const [apps, setApps] = useState<IntegrationApp[]>([]);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("finance_integrations");
    if (saved) setApps(JSON.parse(saved) as IntegrationApp[]);
  }, []);

  useEffect(() => {
    localStorage.setItem("finance_integrations", JSON.stringify(apps));
  }, [apps]);

  const toggleApp = (name: string) => {
    setApps((current) =>
      current.map((app) =>
        app.name === name
          ? {
              ...app,
              status: app.status === "Connected" ? "Disconnected" : "Connected",
              sync: app.status === "Connected" ? "Paused" : "Synced just now",
            }
          : app
      )
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Settings</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Webhook className="h-6 w-6 text-yellow-400" />
              Integrations & API
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Connect external tools like Salesforce, Stripe, and banks, and set up automated workflows.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowIntegrationModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Add Integration
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("integrations")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "integrations" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Connected Apps</button>
          <button onClick={() => setActiveTab("automation")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "automation" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Workflow Automation</button>
          <button onClick={() => setActiveTab("api")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "api" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>API Keys</button>
        </div>

        <div className="mt-6">
          {activeTab === "integrations" && <IntegrationsList apps={apps} onToggle={toggleApp} />}
          {activeTab === "automation" && <WorkflowsList />}
          {activeTab === "api" && <APIKeysView />}
        </div>
      </section>
      {showIntegrationModal && (
        <AddIntegrationModal
          onClose={() => setShowIntegrationModal(false)}
          onAdd={(app) => {
            setApps((current) => [app, ...current]);
            setShowIntegrationModal(false);
          }}
        />
      )}
    </div>
  );
}

function IntegrationsList({ apps, onToggle }: { apps: IntegrationApp[]; onToggle: (name: string) => void }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {apps.length === 0 && (
        <div className="md:col-span-2 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/50 p-8 text-center text-sm text-white/40">
          No integrations configured. Add one to track local connection status.
        </div>
      )}
      {apps.map((app, i) => (
        <div key={i} className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-5 hover:bg-neutral-900/50 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-900">
              <Link className="h-6 w-6 text-white/60" />
            </div>
            <div>
              <h4 className="font-bold text-white">{app.name}</h4>
              <p className="text-xs text-white/40">{app.category}</p>
            </div>
          </div>
          <div className="text-right">
            <button onClick={() => onToggle(app.name)} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${app.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-white/50'}`}>
              {app.status}
            </button>
            <p className="mt-2 text-xs text-white/40">{app.sync}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowsList() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Zap className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Automated Workflows</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Workflow execution is not wired to a backend runner yet. Connected app status is tracked locally until automation storage is added.</p>
    </div>
  );
}

function APIKeysView() {
  const [key, setKey] = useState("");
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Database className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Developer API</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">The finance backend does not expose an external API key issuer yet. This creates a local placeholder identifier only.</p>
      <button onClick={() => setKey(`local_${crypto.randomUUID().slice(0, 8)}`)} className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Create Local ID</button>
      {key && <p className="mt-4 font-mono text-sm font-semibold text-green-300">{key}</p>}
    </div>
  );
}

function AddIntegrationModal({ onClose, onAdd }: { onClose: () => void; onAdd: (app: IntegrationApp) => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Custom");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Add Integration</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            onAdd({ name, category, status: "Connected", sync: "Synced just now" });
          }}
        >
          <div>
            <label className="text-xs font-semibold uppercase text-white/50">App Name</label>
            <input required value={name} onChange={(event) => setName(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. QuickBooks" />
          </div>
          <div>
            <label className="text-xs font-semibold uppercase text-white/50">Category</label>
            <input required value={category} onChange={(event) => setCategory(event.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Accounting" />
          </div>
          <button type="submit" className="w-full rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300">Connect Integration</button>
        </form>
      </div>
    </div>
  );
}
