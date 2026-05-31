import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, Percent, FileText, Loader2, X, Map } from "lucide-react";

export type TaxCode = {
  id: number;
  code: string;
  description: string;
  rate_percent: number;
  active: boolean;
};

export default function TaxManagementView() {
  const [activeTab, setActiveTab] = useState("codes");
  const [taxCodes, setTaxCodes] = useState<TaxCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<TaxCode[]>("get_tax_codes");
      setTaxCodes(res);
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
              <Percent className="h-6 w-6 text-yellow-400" />
              Tax Management
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage global tax jurisdictions, VAT/GST codes, and automated tax reporting.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> New Tax Code
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("codes")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "codes" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Tax Codes</button>
          <button onClick={() => setActiveTab("jurisdictions")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "jurisdictions" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Jurisdictions</button>
          <button onClick={() => setActiveTab("reporting")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "reporting" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Tax Reporting</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "codes" && <TaxCodesTable codes={taxCodes} />}
              {activeTab === "jurisdictions" && <JurisdictionsView codes={taxCodes} />}
              {activeTab === "reporting" && <TaxReportingView codes={taxCodes} />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateTaxCodeModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function TaxCodesTable({ codes }: { codes: TaxCode[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Tax Code</th>
            <th className="px-6 py-4 font-semibold">Description</th>
            <th className="px-6 py-4 font-semibold text-right">Rate (%)</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {codes.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No tax codes configured.</td></tr>
          )}
          {codes.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <Percent className="h-4 w-4 text-yellow-400/50" />
                {c.code}
              </td>
              <td className="px-6 py-4 text-white/60">{c.description}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">{c.rate_percent.toFixed(2)}%</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${c.active ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function JurisdictionsView({ codes }: { codes: TaxCode[] }) {
  const jurisdictions = codes.reduce<Record<string, TaxCode[]>>((groups, code) => {
    const key = code.code.split("-")[0] || "Unmapped";
    groups[key] = [...(groups[key] ?? []), code];
    return groups;
  }, {});

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <Map className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Tax Nexus & Jurisdictions</h3>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {Object.keys(jurisdictions).length === 0 && <div className="md:col-span-3 py-8 text-center text-sm text-white/40">Create tax codes to group jurisdictions.</div>}
        {Object.entries(jurisdictions).map(([jurisdiction, rows]) => (
          <div key={jurisdiction} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{jurisdiction}</p>
            <p className="mt-2 text-2xl font-black text-white">{rows.length}</p>
            <p className="mt-1 text-xs text-white/40">{rows.filter((row) => row.active).length} active codes</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaxReportingView({ codes }: { codes: TaxCode[] }) {
  const activeCodes = codes.filter((code) => code.active);
  const averageRate = activeCodes.length > 0 ? activeCodes.reduce((sum, code) => sum + code.rate_percent, 0) / activeCodes.length : 0;

  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <FileText className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Tax Configuration Summary</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Liability filings require taxable transaction lines; this view summarizes configured active tax rates.</p>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Active Codes</p>
          <p className="mt-2 text-2xl font-black text-white">{activeCodes.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Avg Rate</p>
          <p className="mt-2 text-2xl font-black text-white">{averageRate.toFixed(2)}%</p>
        </div>
      </div>
    </div>
  );
}

function CreateTaxCodeModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [desc, setDesc] = useState("");
  const [rate, setRate] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_tax_code", {
        input: { 
          code, 
          description: desc, 
          rate_percent: parseFloat(rate) || 0, 
          active: true 
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
          <h2 className="text-xl font-bold text-white">New Tax Code</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Tax Code</label>
            <input required value={code} onChange={e => setCode(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. CA-SALES-TAX" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description</label>
            <input required value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Rate (%)</label>
            <input type="number" step="0.001" required value={rate} onChange={e => setRate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Save Tax Code"}
          </button>
        </form>
      </div>
    </div>
  );
}
