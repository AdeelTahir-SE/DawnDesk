import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, Search, ArrowDownRight, FileText, Loader2, X, CheckCircle2, Clock } from "lucide-react";

export type InvoiceItem = {
  id: number;
  client_name: string;
  total_amount: number;
  status: string;
  due_date: string;
  items_json: string;
};

export default function AccountsReceivableView() {
  const [activeTab, setActiveTab] = useState("invoices");
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const invRes = await invoke<InvoiceItem[]>("get_invoices");
      setInvoices(invRes);
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
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Core Financials</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <ArrowDownRight className="h-6 w-6 text-yellow-400" />
              Accounts Receivable
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Track customer invoices and aging from saved receivable records.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search customers or invoices..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            {activeTab === "invoices" && (
              <button onClick={() => setShowInvoiceModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
                <Plus className="h-4 w-4" /> New Invoice
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("invoices")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "invoices" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Invoices</button>
          <button onClick={() => setActiveTab("aging")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "aging" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>AR Aging</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "invoices" && <InvoicesTable invoices={invoices} />}
              {activeTab === "aging" && <ARAgingTable invoices={invoices} />}
            </>
          )}
        </div>
      </section>

      {showInvoiceModal && <CreateInvoiceModal onClose={() => setShowInvoiceModal(false)} onSaved={loadData} />}
    </div>
  );
}

function InvoicesTable({ invoices }: { invoices: InvoiceItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Customer</th>
            <th className="px-6 py-4 font-semibold">Invoice #</th>
            <th className="px-6 py-4 font-semibold">Due Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {invoices.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No invoices found.</td></tr>
          )}
          {invoices.map((inv) => (
            <tr key={inv.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <FileText className="h-4 w-4 text-white/40" />
                {inv.client_name}
              </td>
              <td className="px-6 py-4 font-mono text-white/60">INV-{inv.id}</td>
              <td className="px-6 py-4 font-medium text-yellow-400">{inv.due_date}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">${inv.total_amount.toFixed(2)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${inv.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {inv.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {inv.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ARAgingTable({ invoices }: { invoices: InvoiceItem[] }) {
  // Compute aging dynamically
  const agingMap: Record<string, { current: number, thirty: number, sixty: number, ninety: number, total: number }> = {};
  
  const now = new Date();
  
  invoices.forEach(inv => {
    if (inv.status === "Paid") return;
    const client = inv.client_name;
    if (!agingMap[client]) agingMap[client] = { current: 0, thirty: 0, sixty: 0, ninety: 0, total: 0 };
    
    const dueDate = new Date(inv.due_date);
    const diffTime = Math.abs(now.getTime() - dueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (now <= dueDate) {
      agingMap[client].current += inv.total_amount;
    } else if (diffDays <= 30) {
      agingMap[client].thirty += inv.total_amount;
    } else if (diffDays <= 60) {
      agingMap[client].sixty += inv.total_amount;
    } else {
      agingMap[client].ninety += inv.total_amount;
    }
    agingMap[client].total += inv.total_amount;
  });

  const agingArray = Object.entries(agingMap).map(([client, data]) => ({ client, ...data }));

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Customer</th>
            <th className="px-6 py-4 font-semibold text-right">Current</th>
            <th className="px-6 py-4 font-semibold text-right text-yellow-400">1 - 30 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-orange-400">31 - 60 Days</th>
            <th className="px-6 py-4 font-semibold text-right text-red-400">&gt; 90 Days</th>
            <th className="px-6 py-4 font-semibold text-right font-bold text-white">Total Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {agingArray.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-8 text-center text-white/40">No outstanding aging balances.</td></tr>
          )}
          {agingArray.map((a, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white">{a.client}</td>
              <td className="px-6 py-4 text-right font-mono">${a.current.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono text-yellow-400">${a.thirty.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono text-orange-400">${a.sixty.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono text-red-400">${a.ninety.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">${a.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Modals
function CreateInvoiceModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [clientName, setClientName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_invoice", {
        input: { 
          client_name: clientName, 
          due_date: dueDate, 
          total_amount: parseFloat(amount) || 0, 
          status: "Sent", 
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
          <h2 className="text-xl font-bold text-white">New Invoice</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Customer Name</label>
            <input required value={clientName} onChange={e => setClientName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Stark Industries" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Due Date</label>
            <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Total Amount</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Invoice"}
          </button>
        </form>
      </div>
    </div>
  );
}
