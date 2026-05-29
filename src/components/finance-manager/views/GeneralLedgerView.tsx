import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Search, BookOpen, CheckCircle2, Settings, Globe, CheckSquare, Loader2, X } from "lucide-react";

export type ChartOfAccount = {
  id: number;
  code: string;
  name: string;
  account_type: string;
  balance: number;
};

export type JournalEntry = {
  id: number;
  date: string;
  reference: string;
  description: string;
  total_debit: number;
  total_credit: number;
  status: string;
  lines_json: string;
};

export type PeriodClose = {
  id: number;
  period: string;
  task: string;
  assigned_to: string;
  status: string;
};

export type ExchangeRate = {
  id: number;
  pair: string;
  rate: number;
  date: string;
};

export default function GeneralLedgerView() {
  const [activeTab, setActiveTab] = useState("journal");
  const [coas, setCoas] = useState<ChartOfAccount[]>([]);
  const [jes, setJes] = useState<JournalEntry[]>([]);
  const [closes, setCloses] = useState<PeriodClose[]>([]);
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [showJeModal, setShowJeModal] = useState(false);
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [coaRes, jeRes, closeRes, rateRes] = await Promise.all([
        invoke<ChartOfAccount[]>("get_chart_of_accounts"),
        invoke<JournalEntry[]>("get_journal_entries"),
        invoke<PeriodClose[]>("get_period_closes"),
        invoke<ExchangeRate[]>("get_exchange_rates"),
      ]);
      setCoas(coaRes);
      setJes(jeRes);
      setCloses(closeRes);
      setRates(rateRes);
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
              <BookOpen className="h-6 w-6 text-yellow-400" />
              General Ledger
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage chart of accounts, post journal entries, track period-end closes, and multi-currency.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search ledger..."
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            {activeTab === "accounts" && (
              <button onClick={() => setShowCoaModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
                <Plus className="h-4 w-4" /> Add Account
              </button>
            )}
            {activeTab === "journal" && (
              <button onClick={() => setShowJeModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
                <Plus className="h-4 w-4" /> New Entry
              </button>
            )}
            {activeTab === "close" && (
              <button onClick={() => setShowCloseModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
                <Plus className="h-4 w-4" /> Add Task
              </button>
            )}
            {activeTab === "currency" && (
              <button onClick={() => setShowRateModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
                <Plus className="h-4 w-4" /> Add Rate
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("journal")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "journal" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Journal Entries</button>
          <button onClick={() => setActiveTab("accounts")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "accounts" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Chart of Accounts</button>
          <button onClick={() => setActiveTab("close")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "close" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Period-End Close</button>
          <button onClick={() => setActiveTab("currency")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "currency" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Multi-Currency</button>
          <button onClick={() => setActiveTab("settings")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "settings" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>GL Settings</button>
        </div>

        <div className="mt-6">
          {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "journal" && <JournalEntriesTable entries={jes} />}
              {activeTab === "accounts" && <ChartOfAccountsTable accounts={coas} />}
              {activeTab === "close" && <PeriodCloseTable closes={closes} />}
              {activeTab === "currency" && <MultiCurrencyTable rates={rates} />}
              {activeTab === "settings" && <GLSettings />}
            </>
          )}
        </div>
      </section>

      {showCoaModal && <CreateCoaModal onClose={() => setShowCoaModal(false)} onSaved={loadData} />}
      {showJeModal && <CreateJeModal onClose={() => setShowJeModal(false)} onSaved={loadData} />}
      {showCloseModal && <CreateCloseModal onClose={() => setShowCloseModal(false)} onSaved={loadData} />}
      {showRateModal && <CreateRateModal onClose={() => setShowRateModal(false)} onSaved={loadData} />}
    </div>
  );
}

function JournalEntriesTable({ entries }: { entries: JournalEntry[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Entry ID</th>
            <th className="px-6 py-4 font-semibold">Date</th>
            <th className="px-6 py-4 font-semibold">Reference</th>
            <th className="px-6 py-4 font-semibold">Description</th>
            <th className="px-6 py-4 font-semibold text-right">Debit</th>
            <th className="px-6 py-4 font-semibold text-right">Credit</th>
            <th className="px-6 py-4 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {entries.length === 0 && (
            <tr><td colSpan={7} className="px-6 py-8 text-center text-white/40">No journal entries found.</td></tr>
          )}
          {entries.map((entry) => (
            <tr key={entry.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-yellow-400">JE-{entry.id}</td>
              <td className="px-6 py-4">{entry.date}</td>
              <td className="px-6 py-4">{entry.reference}</td>
              <td className="px-6 py-4">{entry.description}</td>
              <td className="px-6 py-4 text-right font-mono">${entry.total_debit.toFixed(2)}</td>
              <td className="px-6 py-4 text-right font-mono">${entry.total_credit.toFixed(2)}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${entry.status === "Posted" ? "bg-green-500/10 text-green-400" : "bg-neutral-500/10 text-neutral-400"}`}>
                  {entry.status === "Posted" && <CheckCircle2 className="h-3 w-3" />}
                  {entry.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ChartOfAccountsTable({ accounts }: { accounts: ChartOfAccount[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">Account Code</th>
            <th className="px-6 py-4 font-semibold">Account Name</th>
            <th className="px-6 py-4 font-semibold">Type</th>
            <th className="px-6 py-4 font-semibold text-right">Current Balance</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {accounts.length === 0 && (
            <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No accounts found.</td></tr>
          )}
          {accounts.map((acc) => (
            <tr key={acc.id} className="transition-colors hover:bg-neutral-800/30">
              <td className="px-6 py-4 font-mono text-white/60">{acc.code}</td>
              <td className="px-6 py-4 font-bold text-white">{acc.name}</td>
              <td className="px-6 py-4">
                <span className={`rounded-lg border px-2 py-1 text-xs border-neutral-800 bg-neutral-900`}>
                  {acc.account_type}
                </span>
              </td>
              <td className="px-6 py-4 text-right font-mono">${acc.balance.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PeriodCloseTable({ closes }: { closes: PeriodClose[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2"><CheckSquare className="h-5 w-5 text-yellow-400" /> Close Checklist</h3>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Period</th>
              <th className="px-6 py-4 font-semibold">Task</th>
              <th className="px-6 py-4 font-semibold">Assigned To</th>
              <th className="px-6 py-4 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {closes.length === 0 && (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-white/40">No close tasks configured.</td></tr>
            )}
            {closes.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold">{c.period}</td>
                <td className="px-6 py-4">{c.task}</td>
                <td className="px-6 py-4 text-white/60">{c.assigned_to}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${c.status === 'Completed' ? 'bg-green-500/10 text-green-400' : 'bg-orange-500/10 text-orange-400'}`}>
                    {c.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MultiCurrencyTable({ rates }: { rates: ExchangeRate[] }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-white text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-yellow-400" /> Exchange Rates</h3>
      </div>
      <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Currency Pair</th>
              <th className="px-6 py-4 font-semibold">Exchange Rate</th>
              <th className="px-6 py-4 font-semibold">Last Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {rates.length === 0 && (
              <tr><td colSpan={3} className="px-6 py-8 text-center text-white/40">No exchange rates configured.</td></tr>
            )}
            {rates.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4 font-bold text-white">{r.pair}</td>
                <td className="px-6 py-4 font-mono text-green-400 font-bold">{r.rate.toFixed(4)}</td>
                <td className="px-6 py-4 text-white/60">{r.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GLSettings() {
  const [fiscalMonth, setFiscalMonth] = useState("January");
  const [eliminations, setEliminations] = useState(true);
  const [statistical, setStatistical] = useState(true);
  const [reversing, setReversing] = useState(true);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
        <h3 className="font-bold text-white text-lg flex items-center gap-2 mb-4"><Settings className="h-5 w-5 text-yellow-400" /> GL Configuration</h3>
        <p className="text-white/50 text-sm mb-4">Manage fiscal year, inter-company settings, and statistical accounts here.</p>
        
        <div className="space-y-4 max-w-lg">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <p className="font-bold text-white text-sm">Fiscal Year Start Month</p>
              <p className="text-xs text-white/40">Determines when year-end closing occurs.</p>
            </div>
            <select value={fiscalMonth} onChange={(event) => setFiscalMonth(event.target.value)} className="rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-1.5 text-white outline-none">
              <option>January</option>
              <option>July</option>
              <option>October</option>
            </select>
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <p className="font-bold text-white text-sm">Enable Inter-company Eliminations</p>
              <p className="text-xs text-white/40">Auto-eliminate transactions between subsidiaries.</p>
            </div>
            <ToggleButton checked={eliminations} onChange={() => setEliminations((value) => !value)} />
          </div>
          <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
            <div>
              <p className="font-bold text-white text-sm">Enable Statistical Accounts</p>
              <p className="text-xs text-white/40">Track non-monetary metrics (e.g. headcount).</p>
            </div>
            <ToggleButton checked={statistical} onChange={() => setStatistical((value) => !value)} />
          </div>
          <div className="flex items-center justify-between pb-2">
            <div>
              <p className="font-bold text-white text-sm">Allow Reversing Journal Entries</p>
              <p className="text-xs text-white/40">Enable auto-reversal of accruals on the next period.</p>
            </div>
            <ToggleButton checked={reversing} onChange={() => setReversing((value) => !value)} />
          </div>
          <p className="rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-xs font-semibold text-yellow-200">
            Settings saved locally for this session. Fiscal year starts in {fiscalMonth}.
          </p>
        </div>
      </div>
    </div>
  );
}

function ToggleButton({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-9 rounded-full transition-colors ${checked ? "bg-yellow-400" : "bg-neutral-700"}`}
      aria-pressed={checked}
    >
      <span className={`absolute top-1 h-3 w-3 rounded-full bg-black transition-all ${checked ? "right-1" : "left-1 bg-white"}`} />
    </button>
  );
}

// Modals
function CreateCoaModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("Asset");
  const [balance, setBalance] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_chart_of_account", {
        input: { code, name, account_type: type, initial_balance: parseFloat(balance) || 0 }
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
          <h2 className="text-xl font-bold text-white">New Account</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Code</label>
            <input required value={code} onChange={e => setCode(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. 1000" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Operating Bank" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400">
              <option>Asset</option>
              <option>Liability</option>
              <option>Equity</option>
              <option>Revenue</option>
              <option>Expense</option>
              <option>Statistical</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Initial Balance</label>
            <input type="number" step="0.01" required value={balance} onChange={e => setBalance(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Account"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateJeModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [reference, setReference] = useState("");
  const [desc, setDesc] = useState("");
  const [debit, setDebit] = useState("0");
  const [credit, setCredit] = useState("0");
  const [isReversing, setIsReversing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_journal_entry", {
        input: { 
          date, reference, 
          description: isReversing ? `[REVERSING] ${desc}` : desc, 
          total_debit: parseFloat(debit) || 0, 
          total_credit: parseFloat(credit) || 0, 
          status: "Posted", 
          lines_json: "[]" 
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
          <h2 className="text-xl font-bold text-white">New Journal Entry</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Date</label>
            <input type="date" required value={date} onChange={e => setDate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Reference</label>
            <input required value={reference} onChange={e => setReference(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. DEP-01" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description</label>
            <input required value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Monthly Rent" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Total Debit</label>
              <input type="number" step="0.01" required value={debit} onChange={e => setDebit(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Total Credit</label>
              <input type="number" step="0.01" required value={credit} onChange={e => setCredit(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer mt-2">
             <input type="checkbox" checked={isReversing} onChange={e => setIsReversing(e.target.checked)} className="rounded bg-neutral-900 border-neutral-800 text-yellow-400 focus:ring-yellow-400 focus:ring-offset-neutral-950" />
             <span className="text-sm text-white/80">Mark as Reversing Entry</span>
          </label>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Post Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateCloseModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [period, setPeriod] = useState("");
  const [task, setTask] = useState("");
  const [assigned, setAssigned] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_period_close", {
        input: { period, task, assigned_to: assigned, status: "Pending" }
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
          <h2 className="text-xl font-bold text-white">Add Close Task</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Period</label>
            <input required value={period} onChange={e => setPeriod(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. May 2026" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Task</label>
            <input required value={task} onChange={e => setTask(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Reconcile Bank" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Assigned To</label>
            <input required value={assigned} onChange={e => setAssigned(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. John Doe" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Create Task"}
          </button>
        </form>
      </div>
    </div>
  );
}

function CreateRateModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [pair, setPair] = useState("");
  const [rate, setRate] = useState("1.0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_exchange_rate", {
        input: { pair, rate: parseFloat(rate) || 0, date: new Date().toISOString().split('T')[0] }
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
          <h2 className="text-xl font-bold text-white">Add Exchange Rate</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Currency Pair</label>
            <input required value={pair} onChange={e => setPair(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. USD / EUR" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Rate</label>
            <input type="number" step="0.0001" required value={rate} onChange={e => setRate(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Add Rate"}
          </button>
        </form>
      </div>
    </div>
  );
}
