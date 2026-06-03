import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Download, FileJson, Plus, ShieldAlert, UserCheck, Loader2, X, Lock } from "lucide-react";
import { exportTextFile, toJsonExport } from "../../../utils/exportFile";

export type AuditLog = {
  id: number;
  timestamp: string;
  user: string;
  action: string;
  description: string;
};

type ComplianceRole = {
  id: number;
  name: string;
  description: string;
  permissions_json: string;
  is_system: boolean;
};

type ComplianceEvidencePackage = {
  generated_at: string;
  summary: {
    audit_log_count: number;
    role_count: number;
    tax_code_count: number;
    open_period_close_count: number;
  };
  audit_logs: AuditLog[];
  roles: ComplianceRole[];
  tax_codes: unknown[];
  period_closes: unknown[];
};

export default function ComplianceAuditView() {
  const [activeTab, setActiveTab] = useState("logs");
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [evidence, setEvidence] = useState<ComplianceEvidencePackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const [auditLogs, evidencePackage] = await Promise.all([
        invoke<AuditLog[]>("get_audit_logs"),
        invoke<ComplianceEvidencePackage>("get_compliance_evidence"),
      ]);
      setLogs(auditLogs);
      setEvidence(evidencePackage);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : String(e));
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
              Record audit events and export local compliance evidence.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Record Event
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("logs")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "logs" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Audit Logs</button>
          <button onClick={() => setActiveTab("soc2")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "soc2" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>SOC2 / SOX Evidence</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : error ? (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-200">{error}</div>
          ) : (
            <>
              {activeTab === "logs" && <AuditLogsTable logs={logs} />}
              {activeTab === "soc2" && <EvidenceView evidence={evidence} />}
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

function EvidenceView({ evidence }: { evidence: ComplianceEvidencePackage | null }) {
  const [exportStatus, setExportStatus] = useState("");

  const exportEvidencePackage = async () => {
    if (!evidence) return;

    const path = await exportTextFile({
      title: "Export Compliance Evidence",
      defaultPath: `dawndesk-compliance-evidence-${new Date().toISOString().slice(0, 10)}.json`,
      contents: toJsonExport(evidence),
      filters: [{ name: "JSON", extensions: ["json"] }],
    });

    setExportStatus(path ? `Exported to ${path}` : "");
  };

  if (!evidence) {
    return (
      <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
        <Lock className="h-10 w-10 text-white/20 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-white">Compliance Evidence</h3>
        <p className="text-sm text-white/50 max-w-md mx-auto mt-2">No evidence package could be generated yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-white">
            <Lock className="h-5 w-5 text-yellow-400" />
            Evidence Package
          </h3>
          <p className="mt-1 text-sm text-white/50">Generated from current audit, tax, close, and access-control records.</p>
          <p className="mt-2 font-mono text-xs text-white/35">{evidence.generated_at}</p>
        </div>
        <button onClick={exportEvidencePackage} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
          <Download className="h-4 w-4" />
          Export JSON
        </button>
      </div>
      {exportStatus && <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">{exportStatus}</div>}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <EvidenceMetric label="Audit Logs" value={evidence.summary.audit_log_count} />
        <EvidenceMetric label="Access Roles" value={evidence.summary.role_count} />
        <EvidenceMetric label="Tax Codes" value={evidence.summary.tax_code_count} />
        <EvidenceMetric label="Open Close Tasks" value={evidence.summary.open_period_close_count} />
      </div>

      <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="flex items-center gap-2 text-sm font-bold text-white">
          <FileJson className="h-4 w-4 text-yellow-400" />
          Export Contents
        </div>
        <p className="mt-2 text-sm text-white/50">
          The downloaded file includes complete audit log rows, compliance role permissions, tax code configuration, and period close task records from this local workspace.
        </p>
      </div>
    </div>
  );
}

function EvidenceMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
    </div>
  );
}

function CreateLogModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [user, setUser] = useState("");
  const [action, setAction] = useState("");
  const [desc, setDesc] = useState("");
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
          <h2 className="text-xl font-bold text-white">Record Audit Event</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">User</label>
            <input required value={user} onChange={e => setUser(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="name or email" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Action Code</label>
            <input required value={action} onChange={e => setAction(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400 font-mono uppercase" placeholder="e.g. UPDATE_GL_ACCOUNT" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description</label>
            <textarea required value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400 h-24 resize-none" placeholder="What changed, and why?" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Recording..." : "Record Audit Event"}
          </button>
        </form>
      </div>
    </div>
  );
}
