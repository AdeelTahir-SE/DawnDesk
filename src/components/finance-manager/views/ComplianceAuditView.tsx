import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, ShieldAlert, Key, UserCheck, Loader2, X, Lock } from "lucide-react";

export type AuditLog = {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  description: string;
};

export default function ComplianceAuditView() {
  const [activeTab, setActiveTab] = useState("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<AuditLog[]>("get_audit_logs");
      setLogs(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Compliance</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <ShieldAlert className="h-6 w-6 text-yellow-400" />
              Compliance & Audit
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Immutable audit trails, role-based access control, and SOX compliance reporting.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Simulate Action
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("logs")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "logs" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Audit Logs</button>
          <button onClick={() => setActiveTab("rbac")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "rbac" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Roles & Permissions</button>
          <button onClick={() => setActiveTab("soc2")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "soc2" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>SOC2 / SOX Evidence</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "logs" && <AuditLogsTable logs={logs} />}
              {activeTab === "rbac" && <RBACView />}
              {activeTab === "soc2" && <SOC2View />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateLogModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function AuditLogsTable({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Timestamp</th>
            <th className="px-6 py-4 font-semibold">User / System</th>
            <th className="px-6 py-4 font-semibold">Action</th>
            <th className="px-6 py-4 font-semibold">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {logs.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No audit logs found.</td></tr>
          )}
          {logs.map((log) => (
            <tr key={log.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/60">{log.timestamp}</td>
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-white/40" />
                {log.user}
              </td>
              <td className="px-6 py-4 text-yellow-400 font-mono text-xs">{log.action}</td>
              <td className="px-6 py-4 text-white/60">{log.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RBACView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Key className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Role-Based Access Control</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Manage granular permissions for Controllers, CFOs, AP Clerks, and Auditors.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Manage Roles</button>
    </div>
  );
}

function SOC2View() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Lock className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Compliance Evidence</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Automatically collect system snapshots for external auditors (SOC1/SOC2, SOX).</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Export Evidence Package</button>
    </div>
  );
}

function CreateLogModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [user, setUser] = useState("admin@dawndesk.io");
  const [action, setAction] = useState("UPDATE_GL_ACCOUNT");
  const [desc, setDesc] = useState("Modified chart of accounts balance manually.");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_audit_log", {
        input: { 
          timestamp: new Date().toISOString(), 
          user, 
          action, 
          description: desc 
        }
      });
      onSaved();
      onClose();
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Simulate Audit Event</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">User</label>
            <input required value={user} onChange={e => setUser(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Action Code</label>
            <input required value={action} onChange={e => setAction(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400 font-mono uppercase" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description</label>
            <textarea required value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400 h-24 resize-none" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Logging..." : "Commit Log"}
          </button>
        </form>
      </div>
    </div>
  );
}
