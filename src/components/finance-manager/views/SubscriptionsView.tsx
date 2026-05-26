import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Repeat, CalendarDays, X } from "lucide-react";

interface Subscription {
  id: number;
  name: string;
  amount: number;
  billing_cycle: string;
  next_date: string;
}

export default function SubscriptionsView() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSub, setNewSub] = useState({ name: "", amount: 0, billing_cycle: "monthly", next_date: "" });

  const fetchSubscriptions = async () => {
    try {
      const data = await invoke<Subscription[]>("get_subscriptions");
      setSubscriptions(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const handleAddSub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await invoke("create_subscription", { 
        input: { 
          ...newSub, 
          amount: Number(newSub.amount)
        } 
      });
      setShowAddModal(false);
      setNewSub({ name: "", amount: 0, billing_cycle: "monthly", next_date: "" });
      fetchSubscriptions();
    } catch (e) {
      console.error(e);
    }
  };

  const monthlyBurn = subscriptions.reduce((sum, s) => {
    if (s.billing_cycle === 'yearly') return sum + (s.amount / 12);
    if (s.billing_cycle === 'weekly') return sum + (s.amount * 4);
    return sum + s.amount;
  }, 0);

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-heading font-extrabold tracking-tight text-brand-text">Subscriptions</h2>
          <p className="text-brand-text-muted text-sm">Manage recurring bills and renewal alerts.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-brand-accent px-5 py-2.5 text-sm font-bold text-brand-base hover:bg-brand-accent-hover transition-transform active:scale-95 shadow-[0_0_20px_rgba(247,201,72,0.25)]">
          <Plus className="w-5 h-5" /> Add Subscription
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-1 rounded-2xl border border-brand-border bg-brand-elevated p-6 flex flex-col justify-center items-center gap-2 shadow-sm">
          <span className="text-brand-text-muted text-sm font-medium uppercase tracking-wider">Monthly Burn</span>
          <span className="text-4xl font-black text-brand-text">${monthlyBurn.toFixed(2)}</span>
          <span className="text-xs text-brand-text-secondary mt-2">Across {subscriptions.length} active subscriptions</span>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {subscriptions.map(s => (
          <div key={s.id} className="flex items-center justify-between p-5 rounded-2xl border border-brand-border bg-brand-elevated hover:border-brand-text-muted transition-colors shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-base text-brand-text flex items-center justify-center border border-brand-border shadow-sm">
                <Repeat className="w-6 h-6 text-brand-text-secondary" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-brand-text text-lg">{s.name}</span>
                <span className="text-xs text-brand-text-muted flex items-center gap-1">
                  <CalendarDays className="w-3 h-3" /> Renews on {s.next_date}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex flex-col items-end">
                <span className="font-bold text-brand-text text-lg">${s.amount.toFixed(2)}</span>
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-widest">{s.billing_cycle}</span>
              </div>
              <button className="text-xs font-medium text-brand-text-muted hover:text-brand-text bg-brand-base border border-brand-border px-3 py-1.5 rounded-lg hover:bg-brand-border/30 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        ))}

        {subscriptions.length === 0 && (
          <div className="py-12 flex flex-col items-center justify-center border border-dashed border-brand-border rounded-2xl">
            <h3 className="text-lg font-bold text-brand-text mb-2">No subscriptions tracked</h3>
            <p className="text-sm text-brand-text-muted mb-6 text-center max-w-sm">Add your recurring bills to monitor your monthly burn rate.</p>
            <button onClick={() => setShowAddModal(true)} className="px-6 py-2.5 bg-brand-accent text-brand-base text-sm font-bold rounded-xl hover:bg-brand-accent-hover transition-colors">
              Add Subscription
            </button>
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-brand-base/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-brand-elevated border border-brand-border rounded-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-brand-border">
              <h3 className="text-xl font-heading font-bold text-brand-text">Add Subscription</h3>
              <button onClick={() => setShowAddModal(false)} className="text-brand-text-muted hover:text-brand-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleAddSub} className="p-6 flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Service Name</label>
                <input type="text" required value={newSub.name} onChange={e => setNewSub({...newSub, name: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="e.g. Netflix" />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm text-brand-text-secondary font-medium">Amount ($)</label>
                <input type="number" step="0.01" required value={newSub.amount} onChange={e => setNewSub({...newSub, amount: Number(e.target.value)})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" placeholder="19.99" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Billing Cycle</label>
                  <select value={newSub.billing_cycle} onChange={e => setNewSub({...newSub, billing_cycle: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors">
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-brand-text-secondary font-medium">Next Renewal</label>
                  <input type="date" required value={newSub.next_date} onChange={e => setNewSub({...newSub, next_date: e.target.value})} className="bg-brand-base border border-brand-border rounded-xl px-4 py-3 text-brand-text outline-none focus:border-brand-accent/50 transition-colors" />
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-brand-text-secondary hover:bg-brand-border/30 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-brand-accent text-brand-base font-bold hover:bg-brand-accent-hover transition-colors">Add Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
