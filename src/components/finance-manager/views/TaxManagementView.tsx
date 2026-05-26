import { useState } from "react";
import { ReceiptText, Plus, Search, Settings, FileCheck, DollarSign } from "lucide-react";

export default function TaxManagementView() {
  const [activeTab, setActiveTab] = useState("summary");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Sales Tax Liability (Q2)</p>
          <p className="mt-2 text-3xl font-black text-white">$14,520</p>
          <p className="mt-1 text-xs text-white/40">Due July 15, 2026</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Input Tax Credit</p>
          <p className="mt-2 text-3xl font-black text-green-400">$3,250</p>
          <p className="mt-1 text-xs text-white/40">From vendor bills</p>
        </div>
        <div className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-5 shadow-lg">
          <p className="text-xs font-semibold text-white/50">Active Tax Jurisdictions</p>
          <p className="mt-2 text-3xl font-black text-yellow-400">4</p>
          <p className="mt-1 text-xs text-white/40">US, UK, EU, CA</p>
        </div>
      </section>

      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <ReceiptText className="h-6 w-6 text-yellow-400" />
              Tax Management
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Add Tax Rule
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-6 border-b border-neutral-800">
          <button
            onClick={() => setActiveTab("summary")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "summary"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Tax Liability Summary
          </button>
          <button
            onClick={() => setActiveTab("codes")}
            className={`pb-3 text-sm font-bold transition-colors ${
              activeTab === "codes"
                ? "border-b-2 border-yellow-400 text-yellow-400"
                : "border-b-2 border-transparent text-white/50 hover:text-white"
            }`}
          >
            Tax Codes & Rates
          </button>
        </div>

        <div className="mt-6">
          {activeTab === "summary" ? <TaxSummaryTable /> : <TaxCodesTable />}
        </div>
      </section>
    </div>
  );
}

function TaxSummaryTable() {
  const liability = [
    { jurisdiction: "California, US", type: "Sales Tax", collected: "$8,400", paid: "$0", net: "$8,400", status: "Unfiled" },
    { jurisdiction: "New York, US", type: "Sales Tax", collected: "$2,100", paid: "$0", net: "$2,100", status: "Unfiled" },
    { jurisdiction: "United Kingdom", type: "VAT", collected: "$6,500", paid: "$2,480", net: "$4,020", status: "Filed" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Jurisdiction</th>
            <th className="px-6 py-4 font-semibold">Tax Type</th>
            <th className="px-6 py-4 font-semibold text-right">Tax Collected</th>
            <th className="px-6 py-4 font-semibold text-right">Input Tax</th>
            <th className="px-6 py-4 font-semibold text-right text-white font-bold">Net Liability</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {liability.map((l, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-bold text-white">{l.jurisdiction}</td>
              <td className="px-6 py-4 text-white/60">{l.type}</td>
              <td className="px-6 py-4 text-right font-mono text-white/80">{l.collected}</td>
              <td className="px-6 py-4 text-right font-mono text-green-400">{l.paid}</td>
              <td className="px-6 py-4 text-right font-mono font-bold text-white">{l.net}</td>
              <td className="px-6 py-4">
                <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${l.status === 'Filed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {l.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TaxCodesTable() {
  const codes = [
    { code: "CA-STATE", name: "California State Tax", rate: "7.25%", account: "2100 - Sales Tax Payable" },
    { code: "NY-STATE", name: "New York State Tax", rate: "4.00%", account: "2100 - Sales Tax Payable" },
    { code: "UK-VAT-STD", name: "UK VAT Standard", rate: "20.00%", account: "2110 - VAT Payable" },
    { code: "TAX-EXEMPT", name: "Tax Exempt", rate: "0.00%", account: "N/A" },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Code</th>
            <th className="px-6 py-4 font-semibold">Name</th>
            <th className="px-6 py-4 font-semibold">Rate</th>
            <th className="px-6 py-4 font-semibold">GL Account</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {codes.map((c, i) => (
            <tr key={i} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono font-bold text-white">{c.code}</td>
              <td className="px-6 py-4 text-white">{c.name}</td>
              <td className="px-6 py-4 font-bold text-yellow-400">{c.rate}</td>
              <td className="px-6 py-4 text-white/60">{c.account}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
