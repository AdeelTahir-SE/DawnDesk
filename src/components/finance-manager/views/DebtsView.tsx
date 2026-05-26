import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, X, HandCoins, Building2 } from "lucide-react";

interface Debt {
  id: number;
  name: string;
  amount: number;
  type_: string;
  due_date: string;
  paid_amount: number;
}

export default function DebtsView() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDebt, setNewDebt] = useState({ name: "", amount: 0, type_: "owed_to_me", due_date: "" });

  const fetchDebts = async () => {
    try {
      const data = await invoke<Debt[]>("get_debts");
      setDebts(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_debt", { 
        input: { 
          ...newDebt, 
          amount: Number(newDebt.amount)
        } 
      });
      setShowAddModal(false);
      setNewDebt({ name: "", amount: 0, type_: "owed_to_me", due_date: "" });
      fetchDebts();
    } catch (e) {
      console.error(e);
    }
  };

  const totalOwedToMe = debts.filter(d => d.type_ === 'owed_to_me').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);
  const totalIOwe = debts.filter(d => d.type_ === 'i_owe').reduce((sum, d) => sum + (d.amount - d.paid_amount), 0);

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Debts & Loans</h2>
          <p className="text-brand-text-muted text-sm">Track who owes you money, and who you owe.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
          <Plus className="w-5 h-5" /> Add Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-brand-border bg-brand-elevated p-6 flex flex-col gap-2 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-success/5 blur-3xl rounded-full"></div>
          <span className="text-brand-text-muted text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-brand-success" /> Owed to Me
          </span>
          <span className="text-4xl font-black text-brand-text">${totalOwedToMe.toFixed(2)}</span>
        </div>
        
        <div className="rounded-2xl border border-brand-border bg-brand-elevated p-6 flex flex-col gap-2 relative overflow-hidden group shadow-sm hover:shadow-md transition-shadow">
          <div className="absolute right-0 top-0 w-32 h-32 bg-brand-error/5 blur-3xl rounded-full"></div>
          <span className="text-brand-text-muted text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-brand-error" /> I Owe
          </span>
          <span className="text-4xl font-black text-brand-text">${totalIOwe.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debts.map(d => {
          const progress = Math.min((d.paid_amount / d.amount) * 100, 100);
          const isDone = progress >= 100;
          const isMine = d.type_ === 'owed_to_me';

          return (
            <div key={d.id} className="rounded-2xl border border-brand-border bg-brand-elevated p-6 flex flex-col gap-4 relative shadow-sm hover:border-brand-text-muted transition-colors">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs text-brand-text-secondary uppercase tracking-widest mb-1">{isMine ? 'They Owe Me' : 'I Owe Them'}</span>
                  <h3 className="text-xl font-bold text-brand-text">{d.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-brand-text">${(d.amount - d.paid_amount).toFixed(2)}</span>
                  <div className="text-xs text-brand-text-muted">remaining of ${d.amount.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="h-2 w-full bg-brand-base rounded-full overflow-hidden mt-2">
                <div className={`h-full ${isDone ? 'bg-brand-success' : isMine ? 'bg-brand-accent' : 'bg-brand-error'} rounded-full`} style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-brand-text-muted border-t border-brand-border/50 pt-4 mt-2">
                <span>Due: {d.due_date}</span>
                {isDone ? (
                  <span className="text-brand-success font-bold">Fully Settled</span>
                ) : (
                  <button className="text-brand-text-muted hover:text-brand-text bg-brand-base px-3 py-1.5 rounded-lg border border-brand-border hover:bg-brand-border/30 transition-colors">
                    Log Payment
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-brand-border rounded-2xl">
            <HandCoins className="w-12 h-12 text-brand-text-secondary mb-4" />
            <h3 className="text-lg font-bold text-brand-text mb-2">No debts or loans</h3>
            <p className="text-sm text-brand-text-muted mb-6 text-center max-w-sm">Keep track of money you lent to friends or borrowed from institutions.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-brand-accent text-brand-base text-sm font-bold rounded-xl hover:bg-brand-accent-hover transition-colors">
              Add Record
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-elevated border border-brand-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h3 className="text-xl font-heading font-bold text-brand-text">Add Debt Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="p-6 flex flex-col gap-5">
              <div className="flex gap-2 p-1 bg-brand-base border border-brand-border/50 rounded-xl">
                <button type="button" onClick={() => setNewDebt({...newDebt, type_: 'owed_to_me'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newDebt.type_ === 'owed_to_me' ? 'bg-brand-elevated text-brand-text shadow-sm' : 'text-brand-text-secondary hover:text-brand-text-muted'}`}>Owed to Me</button>
                <button type="button" onClick={() => setNewDebt({...newDebt, type_: 'i_owe'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newDebt.type_ === 'i_owe' ? 'bg-brand-elevated text-brand-text shadow-sm' : 'text-brand-text-secondary hover:text-brand-text-muted'}`}>I Owe Them</button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Person / Institution Name</label>
                <input type="text" required value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="e.g. John Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Total Amount ($)</label>
                <input type="number" step="0.01" required value={newDebt.amount} onChange={e => setNewDebt({...newDebt, amount: Number(e.target.value)})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="100.00" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Due Date</label>
                <input type="date" required value={newDebt.due_date} onChange={e => setNewDebt({...newDebt, due_date: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-border/30 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-base font-bold hover:bg-brand-accent-hover transition-colors">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
