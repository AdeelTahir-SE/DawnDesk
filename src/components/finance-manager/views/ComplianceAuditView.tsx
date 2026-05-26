import { useState } from "react";
import { ClipboardCheck, Search, ShieldCheck, FileCheck2, User, Clock, AlertTriangle, DownloadCloud } from "lucide-react";

export default function ComplianceAuditView() {
  const [activeTab, setActiveTab] = useState("audit");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Locked Periods</p>
          <p className="mt-2 text-3xl font-black text-white">4</p>
          <p className="mt-1 text-xs text-white/40">Jan - Apr 2026</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-white/50">SOX Controls</p>
            <p className="mt-2 text-3xl font-black text-green-400">Active</p>
            <p className="mt-1 text-xs text-white/40">Segregation of duties enforced</p>
          </div>
          <ShieldCheck className="h-12 w-12 text-green-400/20" />
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Policy Violations</p>
          <p className="mt-2 text-3xl font-black text-white">0</p>
          <p className="mt-1 text-xs text-green-400">All checks passed</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ClipboardCheck className="h-6 w-6 text-yellow-400" />
              Compliance & Audit
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search audit trail..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-neutral-800 border border-neutral-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-neutral-700">
              <DownloadCloud className="h-4 w-4" />
              Export Log
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "audit"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            System Audit Trail
          </button>
          <button
            onClick={() => setActiveTab("controls")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "controls"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Internal Controls
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "audit" ? <AuditTrailTable /> : <InternalControlsList />}
        </div>
      </section>
    </div>
  );
}

function AuditTrailTable() {
  const trail = [
    { id: "LOG-00452", date: "2026-05-26 10:42 AM", user: "Admin", action: "Updated Journal Entry JE-1043", status: "Success", ip: "192.168.1.45" },
    { id: "LOG-00451", date: "2026-05-26 09:15 AM", user: "Finance Rep", action: "Approved Bill BILL-509", status: "Success", ip: "10.0.0.12" },
    { id: "LOG-00450", date: "2026-05-25 18:30 PM", user: "System", action: "Period Close (April)", status: "Success", ip: "localhost" },
    { id: "LOG-00449", date: "2026-05-25 14:20 PM", user: "Unknown", action: "Failed Login Attempt", status: "Warning", ip: "45.22.100.1" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Timestamp</th>
            <th className="px-6 py-4 font-semibold">User / System</th>
            <th className="px-6 py-4 font-semibold">Action Performed</th>
            <th className="px-6 py-4 font-semibold">IP Address</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {trail.map((t, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 text-white/60 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {t.date}
              </td>
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <User className="h-4 w-4 text-white/40" />
                {t.user}
              </td>
              <td className="px-6 py-4 text-white">{t.action}</td>
              <td className="px-6 py-4 font-mono text-white/50">{t.ip}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold rounded-full ${t.status === 'Success' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {t.status === 'Warning' ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                  {t.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function InternalControlsList() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <FileCheck2 className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="font-bold text-white text-base">Segregation of Duties (SoD)</p>
            <p className="text-sm text-white/50">Users cannot approve their own purchase orders or journal entries.</p>
          </div>
        </div>
        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">Active</span>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-5">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-green-400" />
          </div>
          <div>
            <p className="font-bold text-white text-base">Immutable Ledgers</p>
            <p className="text-sm text-white/50">Posted journal entries cannot be deleted, only reversed.</p>
          </div>
        </div>
        <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full border border-green-500/20">Active</span>
      </div>
    </div>
  );
}
