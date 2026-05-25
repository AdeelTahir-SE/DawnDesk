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
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Debts & Loans</h2>
          <p className="text-white/50 text-sm">Track who owes you money, and who you owe.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Plus className="w-5 h-5" /> Add Record
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 blur-3xl rounded-full"></div>
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <HandCoins className="w-4 h-4 text-white" /> Owed to Me
          </span>
          <span className="text-4xl font-black text-white">${totalOwedToMe.toFixed(2)}</span>
        </div>
        
        <div className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col gap-2 relative overflow-hidden group">
          <div className="absolute right-0 top-0 w-32 h-32 bg-yellow-400/5 blur-3xl rounded-full"></div>
          <span className="text-white/50 text-sm font-medium uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-yellow-400" /> I Owe
          </span>
          <span className="text-4xl font-black text-white/60">${totalIOwe.toFixed(2)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {debts.map(d => {
          const progress = Math.min((d.paid_amount / d.amount) * 100, 100);
          const isDone = progress >= 100;
          const isMine = d.type_ === 'owed_to_me';

          return (
            <div key={d.id} className="rounded-2xl border border-white/10 bg-neutral-900/50 p-6 flex flex-col gap-4 relative">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <span className="text-xs text-white/40 uppercase tracking-widest mb-1">{isMine ? 'They Owe Me' : 'I Owe Them'}</span>
                  <h3 className="text-xl font-bold text-white">{d.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xl font-bold text-white">${(d.amount - d.paid_amount).toFixed(2)}</span>
                  <div className="text-xs text-white/50">remaining of ${d.amount.toFixed(2)}</div>
                </div>
              </div>
              
              <div className="h-2 w-full bg-black/50 rounded-full overflow-hidden mt-2">
                <div className={`h-full ${isDone ? 'bg-white' : isMine ? 'bg-white/80' : 'bg-yellow-400'} rounded-full`} style={{ width: `${progress}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs text-white/50 border-t border-white/5 pt-4 mt-2">
                <span>Due: {d.due_date}</span>
                {isDone ? (
                  <span className="text-white font-bold">Fully Settled</span>
                ) : (
                  <button className="text-white hover:text-white bg-white/5 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors">
                    Log Payment
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {debts.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-white/10 rounded-2xl">
            <HandCoins className="w-12 h-12 text-white/20 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">No debts or loans</h3>
            <p className="text-sm text-white/50 mb-6 text-center max-w-sm">Keep track of money you lent to friends or borrowed from institutions.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-yellow-400 text-black text-sm font-bold rounded-xl hover:bg-yellow-300">
              Add Record
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Add Debt Record</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddDebt} className="p-6 flex flex-col gap-5">
              <div className="flex gap-2 p-1 bg-black/40 border border-white/5 rounded-xl">
                <button type="button" onClick={() => setNewDebt({...newDebt, type_: 'owed_to_me'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newDebt.type_ === 'owed_to_me' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>Owed to Me</button>
                <button type="button" onClick={() => setNewDebt({...newDebt, type_: 'i_owe'})} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${newDebt.type_ === 'i_owe' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/70'}`}>I Owe Them</button>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Person / Institution Name</label>
                <input type="text" required value={newDebt.name} onChange={e => setNewDebt({...newDebt, name: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="e.g. John Doe" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Total Amount ($)</label>
                <input type="number" step="0.01" required value={newDebt.amount} onChange={e => setNewDebt({...newDebt, amount: Number(e.target.value)})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="100.00" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-white/70 font-medium">Due Date</label>
                <input type="date" required value={newDebt.due_date} onChange={e => setNewDebt({...newDebt, due_date: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">Add Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
