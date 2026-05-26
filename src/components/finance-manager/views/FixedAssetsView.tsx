import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, MonitorSmartphone, Calculator, Search, Loader2, X, AlertTriangle } from "lucide-react";

export type FixedAsset = {
  id: number;
  name: string;
  description: string;
  purchase_date: string;
  purchase_price: number;
  useful_life_years: number;
  salvage_value: number;
  status: string;
};

export default function FixedAssetsView() {
  const [activeTab, setActiveTab] = useState("assets");
  const [assets, setAssets] = useState<FixedAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<FixedAsset[]>("get_fixed_assets");
      setAssets(res);
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Operations</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <MonitorSmartphone className="h-6 w-6 text-yellow-400" />
              Fixed Assets
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Track capital expenditures, depreciation schedules, and physical asset lifecycles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search assets..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Add Asset
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("assets")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "assets" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Asset Register</button>
          <button onClick={() => setActiveTab("depreciation")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "depreciation" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Depreciation Schedules</button>
          <button onClick={() => setActiveTab("disposals")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "disposals" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Disposals</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "assets" && <AssetsTable assets={assets} />}
              {activeTab === "depreciation" && <DepreciationView />}
              {activeTab === "disposals" && <DisposalsView />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateAssetModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function AssetsTable({ assets }: { assets: FixedAsset[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Asset ID & Name</th>
            <th className="px-6 py-4 font-semibold">Purchase Date</th>
            <th className="px-6 py-4 font-semibold text-right">Purchase Price</th>
            <th className="px-6 py-4 font-semibold text-right">Useful Life</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {assets.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No fixed assets found.</td></tr>
          )}
          {assets.map((asset) => (
            <tr key={asset.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4">
                <div className="font-bold text-white flex items-center gap-2">
                  <MonitorSmartphone className="h-4 w-4 text-white/40" />
                  {asset.name}
                </div>
                <div className="mt-0.5 text-xs text-white/40 font-mono">AST-{asset.id.toString().padStart(4, '0')}</div>
              </td>
              <td className="px-6 py-4 text-white/60">{asset.purchase_date}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">${asset.purchase_price.toFixed(2)}</td>
              <td className="px-6 py-4 text-right text-white/60">{asset.useful_life_years} Years</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-bold text-green-400">
                  {asset.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DepreciationView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <Calculator className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Automated Depreciation</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Generate straight-line, declining balance, or MACRS depreciation entries automatically.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Run Month-End Depreciation</button>
    </div>
  );
}

function DisposalsView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <AlertTriangle className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Asset Disposals & Write-offs</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Record sales or write-offs of assets and automatically calculate gain/loss on disposal.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Record Disposal</button>
    </div>
  );
}

function CreateAssetModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [price, setPrice] = useState("0");
  const [life, setLife] = useState("5");
  const [salvage, setSalvage] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_fixed_asset", {
        input: { 
          name, 
          description, 
          purchase_date: date, 
          purchase_price: parseFloat(price) || 0, 
          useful_life_years: parseInt(life) || 1, 
          salvage_value: parseFloat(salvage) || 0, 
          status: "Active" 
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
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Register Fixed Asset</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Asset Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. MacBook Pro M3" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Purchase Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description / Serial No.</label>
            <input required value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Price ($)</label>
              <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Life (Years)</label>
              <input type="number" required value={life} onChange={e => setLife(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Salvage ($)</label>
              <input type="number" step="0.01" required value={salvage} onChange={e => setSalvage(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Register Asset"}
          </button>
        </form>
      </div>
    </div>
  );
}
