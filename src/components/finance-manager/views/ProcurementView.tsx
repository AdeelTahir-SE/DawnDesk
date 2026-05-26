import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, ShoppingCart, Truck, ShieldCheck, Search, Loader2, X, ClipboardCheck } from "lucide-react";

export type PurchaseOrder = {
  id: number;
  vendor_name: string;
  date: string;
  total_amount: number;
  status: string;
  items_json: string;
};

export default function ProcurementView() {
  const [activeTab, setActiveTab] = useState("pos");
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<PurchaseOrder[]>("get_purchase_orders");
      setPos(res);
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Supply Chain</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <ShoppingCart className="h-6 w-6 text-yellow-400" />
              Procurement & Purchasing
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage purchase orders, vendor approvals, and automated 3-way matching.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search POs or Vendors..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Create PO
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("pos")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "pos" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Purchase Orders</button>
          <button onClick={() => setActiveTab("approvals")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "approvals" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Approval Workflows</button>
          <button onClick={() => setActiveTab("matching")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "matching" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>3-Way Matching</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "pos" && <PurchaseOrdersTable pos={pos} />}
              {activeTab === "approvals" && <ApprovalsView />}
              {activeTab === "matching" && <ThreeWayMatchingView />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreatePOModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function PurchaseOrdersTable({ pos }: { pos: PurchaseOrder[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Vendor</th>
            <th className="px-6 py-4 font-semibold">PO Number</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {pos.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No purchase orders found.</td></tr>
          )}
          {pos.map((p) => (
            <tr key={p.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <Truck className="h-4 w-4 text-white/40" />
                {p.vendor_name}
              </td>
              <td className="px-6 py-4 font-mono text-white/60">PO-{p.id.toString().padStart(5, '0')}</td>
              <td className="px-6 py-4 text-white/60">{p.date}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">${p.total_amount.toFixed(2)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${p.status === 'Approved' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                  {p.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ApprovalsView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <ShieldCheck className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Pending Approvals</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Set up multi-level approval hierarchies based on department and amount thresholds.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">Configure Workflows</button>
    </div>
  );
}

function ThreeWayMatchingView() {
  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <ClipboardCheck className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">3-Way Match Validation</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Automatically verify Purchase Order vs. Receiving Report vs. Vendor Invoice.</p>
      <button className="mt-6 rounded-xl bg-neutral-800 px-4 py-2 text-sm font-bold text-white hover:bg-neutral-700">View Exceptions</button>
    </div>
  );
}

function CreatePOModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_purchase_order", {
        input: { 
          vendor_name: vendor, 
          date, 
          total_amount: parseFloat(amount) || 0, 
          status: "Draft", 
          items_json: "[]" 
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
          <h2 className="text-xl font-bold text-white">Create Purchase Order</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Vendor Name</label>
            <input required value={vendor} onChange={e => setVendor(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. AWS" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Total Estimated Amount ($)</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Draft PO"}
          </button>
        </form>
      </div>
    </div>
  );
}
