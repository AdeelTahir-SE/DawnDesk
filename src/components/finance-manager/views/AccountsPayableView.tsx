import { useState } from "react";
import { Plus, Search, ArrowUpRight, Receipt, CheckCircle2, Clock, MoreHorizontal, FileCheck } from "lucide-react";

export default function AccountsPayableView() {
  const [activeTab, setActiveTab] = useState("bills");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Total Payables</p>
          <p className="mt-2 text-3xl font-black text-white">$18,400.00</p>
          <p className="mt-1 text-xs text-yellow-400">across 8 open bills</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Next Payment Run</p>
          <p className="mt-2 text-3xl font-black text-white">$4,200.00</p>
          <p className="mt-1 text-xs text-white/40">Scheduled for Friday</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Paid This Month</p>
          <p className="mt-2 text-3xl font-black text-red-400">$85,300.00</p>
          <p className="mt-1 text-xs text-white/40">-5% vs last month</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ArrowUpRight className="h-6 w-6 text-yellow-400" />
              Accounts Payable
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search vendors, bills..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Enter Bill
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("bills")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "bills"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Vendor Bills
          </button>
          <button
            onClick={() => setActiveTab("runs")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "runs"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Payment Runs
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "bills" ? <VendorBillsTable /> : <PaymentRunsTable />}
        </div>
      </section>
    </div>
  );
}

function VendorBillsTable() {
  const bills = [
    { id: "BILL-509", vendor: "AWS Web Services", date: "2026-05-15", due: "2026-05-30", amount: "$3,450.00", status: "Approved" },
    { id: "BILL-510", vendor: "Gusto Payroll", date: "2026-05-16", due: "2026-05-20", amount: "$450.00", status: "Paid" },
    { id: "BILL-511", vendor: "WeWork Office", date: "2026-05-01", due: "2026-06-01", amount: "$5,000.00", status: "Review" },
    { id: "BILL-512", vendor: "Marketing Agency Inc", date: "2026-05-10", due: "2026-05-25", amount: "$8,500.00", status: "Approved" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Bill #</th>
            <th className="px-6 py-4 font-semibold">Vendor</th>
            <th className="px-6 py-4 font-semibold">Bill Date</th>
            <th className="px-6 py-4 font-semibold">Due Date</th>
            <th className="px-6 py-4 font-semibold text-right">Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
            <th className="px-6 py-4 font-semibold text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {bills.map((bill) => (
            <tr key={bill.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white flex items-center gap-2">
                <Receipt className="h-4 w-4 text-white/40" />
                {bill.id}
              </td>
              <td className="px-6 py-4 font-bold">{bill.vendor}</td>
              <td className="px-6 py-4 text-white/60">{bill.date}</td>
              <td className="px-6 py-4 text-white/60">{bill.due}</td>
              <td className="px-6 py-4 text-right font-mono text-white">{bill.amount}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    bill.status === "Paid"
                      ? "bg-green-500/10 text-green-400"
                      : bill.status === "Review"
                      ? "bg-orange-500/10 text-orange-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {bill.status === "Paid" && <CheckCircle2 className="h-3 w-3" />}
                  {bill.status === "Review" && <Clock className="h-3 w-3" />}
                  {bill.status === "Approved" && <FileCheck className="h-3 w-3" />}
                  {bill.status}
                </span>
              </td>
              <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                <button className="text-white/40 hover:text-white transition-colors">
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PaymentRunsTable() {
  const runs = [
    { id: "RUN-105", date: "2026-05-28", bills: 4, amount: "$4,200.00", status: "Scheduled" },
    { id: "RUN-104", date: "2026-05-21", bills: 12, amount: "$24,500.00", status: "Completed" },
    { id: "RUN-103", date: "2026-05-14", bills: 8, amount: "$15,200.00", status: "Completed" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Run ID</th>
            <th className="px-6 py-4 font-semibold">Execution Date</th>
            <th className="px-6 py-4 font-semibold">Bills Included</th>
            <th className="px-6 py-4 font-semibold text-right">Total Amount</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {runs.map((run) => (
            <tr key={run.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono font-bold text-white">{run.id}</td>
              <td className="px-6 py-4">{run.date}</td>
              <td className="px-6 py-4">{run.bills} bills</td>
              <td className="px-6 py-4 text-right font-mono text-white">{run.amount}</td>
              <td className="px-6 py-4">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                    run.status === "Completed"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-yellow-500/10 text-yellow-400"
                  }`}
                >
                  {run.status === "Completed" && <CheckCircle2 className="h-3 w-3" />}
                  {run.status === "Scheduled" && <Clock className="h-3 w-3" />}
                  {run.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
