import { useState } from "react";
import { Plus, Webhook, Zap, Link, Database } from "lucide-react";

export default function IntegrationsAutomationView() {
  const [activeTab, setActiveTab] = useState("integrations");

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
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
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
          {activeTab === "integrations" && <IntegrationsList />}
          {activeTab === "automation" && <WorkflowsList />}
          {activeTab === "api" && <APIKeysView />}
        </div>
      </section>
    </div>
  );
}

function IntegrationsList() {
  const apps = [
    { name: "Stripe", category: "Payments", status: "Connected", sync: "Synced 5m ago" },
    { name: "Salesforce", category: "CRM", status: "Connected", sync: "Synced 1h ago" },
    { name: "Gusto", category: "Payroll", status: "Disconnected", sync: "Never synced" },
    { name: "Plaid", category: "Banking", status: "Connected", sync: "Real-time" }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${app.status === 'Connected' ? 'bg-green-500/10 text-green-400' : 'bg-neutral-800 text-white/50'}`}>
              {app.status}
            </span>
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
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Trigger automated actions. (e.g. When a Stripe Invoice is paid, create a Journal Entry.)</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Create Workflow</button>
    </div>
  );
}

function APIKeysView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Database className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Developer API</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Generate OAuth tokens and API keys to connect custom internal tools directly to DawnDesk ERP.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Generate Key</button>
    </div>
  );
}
