import { useState } from "react";
import { FileBarChart, DownloadCloud, FileText, Filter, Calendar } from "lucide-react";

export default function FinancialReportingView() {
  const [reportType, setReportType] = useState("pl");

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <FileBarChart className="h-6 w-6 text-yellow-400" />
              Financial Reporting
            </h2>
            <p className="mt-2 text-sm text-white/50">Generate standard and custom financial statements.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800/80">
              <Filter className="h-4 w-4" />
              Filters
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <DownloadCloud className="h-4 w-4" />
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-8 flex items-center gap-4 border-b border-neutral-800 pb-4">
          <label className="text-sm font-semibold text-white/50">Report Type:</label>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/60"
          >
            <option value="pl">Income Statement (P&L)</option>
            <option value="bs">Balance Sheet</option>
            <option value="cf">Cash Flow Statement</option>
          </select>

          <label className="text-sm font-semibold text-white/50 ml-6">Period:</label>
          <select className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm text-white outline-none focus:border-yellow-400/60">
            <option>May 2026</option>
            <option>April 2026</option>
            <option>Q2 2026</option>
            <option>YTD 2026</option>
          </select>
        </div>

        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-8">
          <div className="text-center mb-10">
            <h3 className="text-xl font-bold text-white uppercase tracking-widest">DawnDesk Inc.</h3>
            <p className="text-sm text-white/60 uppercase tracking-widest mt-1">
              {reportType === "pl" ? "Income Statement" : reportType === "bs" ? "Balance Sheet" : "Cash Flow Statement"}
            </p>
            <p className="text-xs text-white/40 mt-1">For the period ending May 31, 2026</p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6 text-sm font-mono">
            {reportType === "pl" && (
              <>
                <div className="border-b-2 border-neutral-800 pb-2">
                  <p className="font-bold text-white uppercase tracking-wider text-xs">Revenue</p>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Software Subscriptions</span>
                  <span>$145,000.00</span>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Professional Services</span>
                  <span>$25,000.00</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-2">
                  <span>Total Revenue</span>
                  <span>$170,000.00</span>
                </div>

                <div className="border-b-2 border-neutral-800 pb-2 mt-8">
                  <p className="font-bold text-white uppercase tracking-wider text-xs">Cost of Goods Sold</p>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Hosting & Infrastructure</span>
                  <span>$12,000.00</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-2">
                  <span>Total COGS</span>
                  <span>$12,000.00</span>
                </div>

                <div className="flex justify-between font-bold text-yellow-400 border-t-2 border-neutral-800 pt-2 mt-4 text-base">
                  <span>Gross Profit</span>
                  <span>$158,000.00</span>
                </div>

                <div className="border-b-2 border-neutral-800 pb-2 mt-8">
                  <p className="font-bold text-white uppercase tracking-wider text-xs">Operating Expenses</p>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Salaries & Wages</span>
                  <span>$85,000.00</span>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Marketing & Advertising</span>
                  <span>$18,500.00</span>
                </div>
                <div className="flex justify-between text-white/80 pl-4">
                  <span>Rent & Facilities</span>
                  <span>$5,000.00</span>
                </div>
                <div className="flex justify-between font-bold text-white border-t border-neutral-800 pt-2">
                  <span>Total Operating Expenses</span>
                  <span>$108,500.00</span>
                </div>

                <div className="flex justify-between font-black text-green-400 border-t-4 border-double border-neutral-700 pt-2 mt-6 text-lg">
                  <span>Net Income</span>
                  <span>$49,500.00</span>
                </div>
              </>
            )}
            {reportType !== "pl" && (
              <div className="text-center py-20 text-white/50">
                <FileText className="h-10 w-10 mx-auto mb-4 opacity-20" />
                <p>Select Income Statement to view the sample report data.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
