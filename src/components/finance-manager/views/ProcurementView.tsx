import { useState, useEffect, useMemo } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, ShoppingCart, Truck, ShieldCheck, Search, Loader2, X, ClipboardCheck } from "lucide-react";

export type PurchaseOrder = {
  id: number;
  vendor_name: string;
  date: string;
  total_amount: number;
  status: string;
  items_json: string;
};

type VendorBill = {
  id: number;
  vendor_name: string;
  bill_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  status: string;
  items_json: string;
};

export default function ProcurementView() {
  const [activeTab, setActiveTab] = useState("pos");
  const [pos, setPos] = useState<PurchaseOrder[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [purchaseOrders, vendorBills] = await Promise.all([
        invoke<PurchaseOrder[]>("get_purchase_orders"),
        invoke<VendorBill[]>("get_vendor_bills"),
      ]);
      setPos(purchaseOrders);
      setBills(vendorBills);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredPos = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return pos;
    return pos.filter((po) => po.vendor_name.toLowerCase().includes(term) || `po-${po.id}`.includes(term));
  }, [pos, query]);

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
                value={query}
                onChange={(event) => setQuery(event.target.value)}
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
              {activeTab === "pos" && <PurchaseOrdersTable pos={filteredPos} />}
              {activeTab === "approvals" && <ApprovalsView pos={filteredPos} />}
              {activeTab === "matching" && <ThreeWayMatchingView pos={filteredPos} bills={bills} />}
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

function ApprovalsView({ pos }: { pos: PurchaseOrder[] }) {
  const pending = pos.filter((po) => !["approved", "paid", "closed"].includes(po.status.toLowerCase()));
  const total = pending.reduce((sum, po) => sum + po.total_amount, 0);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Pending Approvals</h3>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-2">
        <ProcurementMetric label="Pending POs" value={pending.length.toString()} />
        <ProcurementMetric label="Pending Amount" value={`$${total.toFixed(2)}`} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">PO</th>
              <th className="px-6 py-4 font-semibold">Vendor</th>
              <th className="px-6 py-4 font-semibold text-right">Amount</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {pending.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No purchase orders require approval.</td></tr>}
            {pending.map((po) => (
              <tr key={po.id}>
                <td className="px-6 py-4 font-mono text-white">PO-{po.id.toString().padStart(5, "0")}</td>
                <td className="px-6 py-4 font-bold text-white">{po.vendor_name}</td>
                <td className="px-6 py-4 text-right font-mono">${po.total_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-yellow-300">{po.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ThreeWayMatchingView({ pos, bills }: { pos: PurchaseOrder[]; bills: VendorBill[] }) {
  const rows = bills.map((bill) => {
    const po = pos.find((candidate) => candidate.vendor_name.toLowerCase() === bill.vendor_name.toLowerCase());
    const discrepancy = po ? bill.total_amount - po.total_amount : bill.total_amount;
    return { bill, po, discrepancy };
  });

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Vendor Bill</th>
            <th className="px-6 py-4 font-semibold">Purchase Order</th>
            <th className="px-6 py-4 font-semibold text-right">Bill Amount</th>
            <th className="px-6 py-4 font-semibold text-right">PO Amount</th>
            <th className="px-6 py-4 font-semibold">Result</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {rows.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">Create vendor bills and purchase orders to run matching.</td></tr>}
          {rows.map(({ bill, po, discrepancy }) => {
            const matched = po && Math.abs(discrepancy) < 0.01;
            return (
              <tr key={bill.id}>
                <td className="px-6 py-4 font-mono text-white">{bill.bill_number}</td>
                <td className="px-6 py-4 font-mono text-white/60">{po ? `PO-${po.id.toString().padStart(5, "0")}` : "No matching PO"}</td>
                <td className="px-6 py-4 text-right font-mono">${bill.total_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono">{po ? `$${po.total_amount.toFixed(2)}` : "-"}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${matched ? "bg-green-500/10 text-green-400" : "bg-orange-500/10 text-orange-300"}`}>
                    <ClipboardCheck className="h-3 w-3" />
                    {matched ? "Matched" : po ? `Variance $${Math.abs(discrepancy).toFixed(2)}` : "Missing PO"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ProcurementMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-2xl font-black text-white">{value}</p>
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
