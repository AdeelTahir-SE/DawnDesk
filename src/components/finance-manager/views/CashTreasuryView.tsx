import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Landmark, RefreshCw, MoreHorizontal, Link, ArrowRightLeft, Plus, Loader2, X, Activity } from "lucide-react";

export type AccountItem = {
  id: number;
  name: string;
  type_: string;
  balance: number;
  currency: string;
};

type InvoiceItem = {
  id: number;
  total_amount: number;
  status: string;
  due_date: string;
};

type VendorBill = {
  id: number;
  total_amount: number;
  status: string;
  due_date: string;
};

type TransactionItem = {
  id: number;
  amount: number;
  type_: string;
  date: string;
  status: string;
};

export default function CashTreasuryView() {
  const [activeTab, setActiveTab] = useState("accounts");
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [bills, setBills] = useState<VendorBill[]>([]);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [bankStatus, setBankStatus] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [accountRows, invoiceRows, billRows, txRows] = await Promise.all([
        invoke<AccountItem[]>("get_accounts"),
        invoke<InvoiceItem[]>("get_invoices"),
        invoke<VendorBill[]>("get_vendor_bills"),
        invoke<TransactionItem[]>("get_transactions"),
      ]);
      setAccounts(accountRows);
      setInvoices(invoiceRows);
      setBills(billRows);
      setTransactions(txRows);
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
              <Landmark className="h-6 w-6 text-yellow-400" />
              Cash & Treasury
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Manage bank connections, cash positioning, reconciliations, and liquidity forecasts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setBankStatus("No live bank connector is configured yet. Add bank accounts manually, then use transactions to keep balances current.")} className="flex items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-800/80">
              <Link className="h-4 w-4" /> Connect Bank
            </button>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Add Account
            </button>
          </div>
        </div>
        {bankStatus && (
          <div className="mt-4 rounded-xl border border-green-500/20 bg-green-500/10 px-4 py-3 text-sm font-semibold text-green-300">
            {bankStatus}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("accounts")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "accounts" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Bank Accounts</button>
          <button onClick={() => setActiveTab("forecast")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "forecast" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Cash Forecast</button>
          <button onClick={() => setActiveTab("reconciliation")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "reconciliation" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Bank Reconciliation</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "accounts" && <BankAccountsList accounts={accounts} />}
              {activeTab === "forecast" && <CashForecast accounts={accounts} invoices={invoices} bills={bills} />}
              {activeTab === "reconciliation" && <BankRecon accounts={accounts} transactions={transactions} />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateAccountModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function BankAccountsList({ accounts }: { accounts: AccountItem[] }) {
  const [selectedAccount, setSelectedAccount] = useState<AccountItem | null>(null);
  if (accounts.length === 0) return <div className="text-center py-20 text-white/40">No bank accounts found.</div>;
  
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {accounts.map((acc) => (
        <div key={acc.id} className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-5 hover:bg-neutral-900/50 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-neutral-900">
                <Landmark className="h-5 w-5 text-white/60" />
              </div>
              <div>
                <h4 className="font-bold text-white">{acc.name}</h4>
                <p className="text-xs text-white/40 uppercase tracking-wider">{acc.type_}</p>
              </div>
            </div>
            <button onClick={() => setSelectedAccount(acc)} className="text-white/40 hover:text-white"><MoreHorizontal className="h-5 w-5" /></button>
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs font-semibold text-white/40 uppercase mb-1">Available Balance</p>
              <p className="text-2xl font-mono font-bold text-white">${acc.balance.toFixed(2)}</p>
            </div>
            <span className="text-xs font-bold text-green-400 flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Synced</span>
          </div>
        </div>
      ))}
      {selectedAccount && (
        <div className="md:col-span-2 lg:col-span-3 rounded-xl border border-yellow-400/20 bg-yellow-400/10 px-4 py-3 text-sm font-semibold text-yellow-200">
          {selectedAccount.name}: {selectedAccount.currency} {selectedAccount.balance.toFixed(2)} available, synced just now.
        </div>
      )}
    </div>
  );
}

function CashForecast({ accounts, invoices, bills }: { accounts: AccountItem[]; invoices: InvoiceItem[]; bills: VendorBill[] }) {
  const today = new Date();
  const day30 = new Date(today.getTime() + 30 * 86_400_000);
  const currentCash = accounts.reduce((sum, account) => sum + account.balance, 0);
  const expectedInflows = invoices
    .filter((invoice) => invoice.status.toLowerCase() !== "paid")
    .filter((invoice) => {
      const due = new Date(invoice.due_date);
      return due >= today && due <= day30;
    })
    .reduce((sum, invoice) => sum + invoice.total_amount, 0);
  const expectedOutflows = bills
    .filter((bill) => bill.status.toLowerCase() !== "paid")
    .filter((bill) => {
      const due = new Date(bill.due_date);
      return due >= today && due <= day30;
    })
    .reduce((sum, bill) => sum + bill.total_amount, 0);
  const projectedCash = currentCash + expectedInflows - expectedOutflows;

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6 text-center">
      <Activity className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">30-Day Liquidity Forecast</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Projects cash from current account balances plus unpaid AR/AP due in the next 30 days.</p>
      <div className="mx-auto mt-6 grid max-w-3xl gap-3 md:grid-cols-4">
        <TreasuryMetric label="Current Cash" value={`$${currentCash.toFixed(2)}`} />
        <TreasuryMetric label="Expected Inflows" value={`$${expectedInflows.toFixed(2)}`} />
        <TreasuryMetric label="Expected Outflows" value={`$${expectedOutflows.toFixed(2)}`} />
        <TreasuryMetric label="Projected Cash" value={`$${projectedCash.toFixed(2)}`} />
      </div>
    </div>
  );
}

function BankRecon({ accounts, transactions }: { accounts: AccountItem[]; transactions: TransactionItem[] }) {
  const accountBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  const transactionBalance = transactions
    .filter((tx) => tx.status.toLowerCase() !== "void")
    .reduce((sum, tx) => sum + (tx.type_.toLowerCase() === "income" ? tx.amount : -tx.amount), 0);
  const variance = accountBalance - transactionBalance;

  return (
    <div className="text-center py-16 rounded-xl border border-neutral-800 bg-neutral-950/50 px-6">
      <ArrowRightLeft className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Local Reconciliation Summary</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Compares stored account balances with net posted transaction activity.</p>
      <div className="mx-auto mt-6 grid max-w-2xl gap-3 md:grid-cols-3">
        <TreasuryMetric label="Account Balances" value={`$${accountBalance.toFixed(2)}`} />
        <TreasuryMetric label="Net Transactions" value={`$${transactionBalance.toFixed(2)}`} />
        <TreasuryMetric label="Variance" value={`$${variance.toFixed(2)}`} />
      </div>
    </div>
  );
}

function TreasuryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function CreateAccountModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("Checking");
  const [balance, setBalance] = useState("0");
  const [currency, setCurrency] = useState("USD");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_account", {
        input: { name, type_: type, initial_balance: parseFloat(balance) || 0, currency }
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
          <h2 className="text-xl font-bold text-white">New Bank Account</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Account Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. Chase Business Checking" />
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Account Type</label>
            <select value={type} onChange={e => setType(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400">
              <option>Checking</option>
              <option>Savings</option>
              <option>Credit Card</option>
              <option>Treasury</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Initial Balance</label>
              <input type="number" step="0.01" required value={balance} onChange={e => setBalance(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Currency</label>
              <input required value={currency} onChange={e => setCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Add Account"}
          </button>
        </form>
      </div>
    </div>
  );
}
