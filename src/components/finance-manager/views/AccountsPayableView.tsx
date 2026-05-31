import { useState, useEffect } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, Search, ArrowUpRight, Receipt, CheckCircle2, Clock, FileCheck, ShieldAlert, UploadCloud, Loader2, X } from "lucide-react";

export type VendorBill = {
  id: number;
  vendor_name: string;
  bill_number: string;
  date: string;
  due_date: string;
  total_amount: number;
  status: string;
  items_json: string;
};

export default function AccountsPayableView() {
  const [activeTab, setActiveTab] = useState("bills");
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [loading, setLoading] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<VendorBill[]>("get_vendor_bills");
      setBills(res);
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
              <ArrowUpRight className="h-6 w-6 text-yellow-400" />
              Accounts Payable
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage vendor bills, scheduled payment runs, 3-way matching, and electronic payments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search vendors or bills..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button onClick={() => setShowBillModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              New Bill
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("bills")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "bills" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Vendor Bills</button>
          <button onClick={() => setActiveTab("runs")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "runs" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Payment Runs</button>
          <button onClick={() => setActiveTab("matching")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "matching" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>3-Way Matching</button>
          <button onClick={() => setActiveTab("aging")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "aging" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>AP Aging</button>
          <button onClick={() => setActiveTab("electronic")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "electronic" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Electronic Payments</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "bills" && <VendorBillsTable bills={bills} />}
              {activeTab === "runs" && <PaymentRunsTable bills={bills} />}
              {activeTab === "matching" && <ThreeWayMatching bills={bills} />}
              {activeTab === "aging" && <APAging bills={bills} />}
              {activeTab === "electronic" && <ElectronicPayments bills={bills} />}
            </>
          )}
        </div>
      </section>

      {showBillModal && <CreateBillModal onClose={() => setShowBillModal(false)} onSaved={loadData} />}
    </div>
  );
}

function VendorBillsTable({ bills }: { bills: VendorBill[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Vendor</th>
            <th className="px-6 py-4 font-semibold">Bill #</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Due Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {bills.length === 0 && (
            <tr><td colSpan={6} className="px-6 py-8 text-center text-white/40">No bills found.</td></tr>
          )}
          {bills.map((bill) => (
            <tr key={bill.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-white/40" />
                {bill.vendor_name}
              </td>
              <td className="px-6 py-4 font-mono text-white/60">{bill.bill_number}</td>
              <td className="px-6 py-4">{bill.date}</td>
              <td className="px-6 py-4 font-medium text-yellow-400">{bill.due_date}</td>
              <td className="px-6 py-4 text-right font-mono font-bold">${bill.total_amount.toFixed(2)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${bill.status === 'Paid' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                  {bill.status === 'Paid' ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                  {bill.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentRunsTable({ bills }: { bills: VendorBill[] }) {
  const unpaidBills = bills.filter((bill) => bill.status.toLowerCase() !== "paid");
  const total = unpaidBills.reduce((sum, bill) => sum + bill.total_amount, 0);
  const runDate = unpaidBills
    .map((bill) => bill.due_date)
    .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())[0];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Run ID</th>
            <th className="px-6 py-4 font-semibold">Execute Date</th>
            <th className="px-6 py-4 font-semibold">Bills Included</th>
            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {unpaidBills.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No unpaid bills available for a payment run.</td></tr>
          ) : (
            <tr className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono font-bold text-white">PR-{new Date().toISOString().slice(0, 10)}</td>
              <td className="px-6 py-4">{runDate}</td>
              <td className="px-6 py-4">{unpaidBills.length}</td>
              <td className="px-6 py-4 text-right font-mono text-yellow-400">${total.toFixed(2)}</td>
              <td className="px-6 py-4"><span className="px-2.5 py-1 text-xs font-bold rounded-full bg-blue-500/10 text-blue-400">Ready</span></td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ThreeWayMatching({ bills }: { bills: VendorBill[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Vendor Bill</th>
            <th className="px-6 py-4 font-semibold">Purchase Order</th>
            <th className="px-6 py-4 font-semibold">Goods Receipt</th>
            <th className="px-6 py-4 font-semibold">Discrepancy</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {bills.length === 0 ? (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No vendor bills to match.</td></tr>
          ) : bills.map((bill) => (
            <tr key={bill.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono font-bold text-white">{bill.bill_number}</td>
              <td className="px-6 py-4 font-mono text-white/60">Attach PO in Procurement</td>
              <td className="px-6 py-4 font-mono text-white/60">{bill.items_json === "[]" ? "No receipt lines" : "Receipt lines present"}</td>
              <td className="px-6 py-4 font-mono text-yellow-300">${bill.total_amount.toFixed(2)}</td>
              <td className="px-6 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-2.5 py-1 text-xs font-bold text-orange-300"><FileCheck className="h-3 w-3" />Needs PO link</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function APAging({ bills }: { bills: VendorBill[] }) {
  const today = new Date();
  const buckets = [
    { label: "Current", min: -Infinity, max: 0 },
    { label: "1-30 Days", min: 1, max: 30 },
    { label: "31-60 Days", min: 31, max: 60 },
    { label: "61-90 Days", min: 61, max: 90 },
    { label: "90+ Days", min: 91, max: Infinity },
  ].map((bucket) => {
    const matchingBills = bills.filter((bill) => {
      if (bill.status.toLowerCase() === "paid") return false;
      const days = Math.floor((today.getTime() - new Date(bill.due_date).getTime()) / 86_400_000);
      return days >= bucket.min && days <= bucket.max;
    });
    return {
      ...bucket,
      count: matchingBills.length,
      amount: matchingBills.reduce((sum, bill) => sum + bill.total_amount, 0),
    };
  });

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Accounts Payable Aging</h3>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-5">
        {buckets.map((bucket) => (
          <div key={bucket.label} className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{bucket.label}</p>
            <p className="mt-2 text-xl font-black text-white">${bucket.amount.toFixed(2)}</p>
            <p className="mt-1 text-xs text-white/40">{bucket.count} bills</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ElectronicPayments({ bills }: { bills: VendorBill[] }) {
  const payable = bills.filter((bill) => bill.status.toLowerCase() !== "paid");
  const total = payable.reduce((sum, bill) => sum + bill.total_amount, 0);

  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50">
      <UploadCloud className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">ACH / Wire Transfers</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Electronic payment setup needs a connected bank account. Current payable batch is shown from open vendor bills.</p>
      <div className="mx-auto mt-6 grid max-w-md grid-cols-2 gap-3">
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Bills Ready</p>
          <p className="mt-2 text-2xl font-black text-white">{payable.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Batch Total</p>
          <p className="mt-2 text-2xl font-black text-white">${total.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
}

function CreateBillModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [vendorName, setVendorName] = useState("");
  const [billNum, setBillNum] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState("");
  const [amount, setAmount] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_vendor_bill", {
        input: { 
          vendor_name: vendorName, 
          bill_number: billNum, 
          date, 
          due_date: dueDate, 
          total_amount: parseFloat(amount) || 0, 
          status: "Unpaid", 
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
          <h2 className="text-xl font-bold text-white">New Vendor Bill</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Vendor Name</label>
            <input required value={vendorName} onChange={e => setVendorName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Acme Corp" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Bill Number</label>
            <input required value={billNum} onChange={e => setBillNum(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. INV-10024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Date</label>
              <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Due Date</label>
              <input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Total Amount</label>
            <input type="number" step="0.01" required value={amount} onChange={e => setAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Bill"}
          </button>
        </form>
      </div>
    </div>
  );
}
