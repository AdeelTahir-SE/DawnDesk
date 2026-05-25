import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Plus, Download, Send, FileText, CheckCircle2, CircleDashed, Clock, X, Trash2 } from "lucide-react";

interface Invoice {
  id: number;
  client_name: string;
  total_amount: number;
  status: string;
  due_date: string;
  items_json: string;
}

interface InvoiceItem {
  desc: string;
  amount: number;
}

export default function InvoicingView() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [newInv, setNewInv] = useState({ client_name: "", status: "draft", due_date: "" });
  const [newItems, setNewItems] = useState<InvoiceItem[]>([{desc: "", amount: 0}]);

  const fetchInvoices = async () => {
    try {
      const data = await invoke<Invoice[]>("get_invoices");
      setInvoices(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handleAddInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = newItems.reduce((sum, item) => sum + Number(item.amount), 0);
    try {
      await invoke("create_invoice", { 
        input: { 
          ...newInv,
          total_amount: totalAmount,
          items_json: JSON.stringify(newItems)
        } 
      });
      setShowAddModal(false);
      setNewInv({ client_name: "", status: "draft", due_date: "" });
      setNewItems([{desc: "", amount: 0}]);
      fetchInvoices();
    } catch (e) {
      console.error(e);
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'paid': return <CheckCircle2 className="w-4 h-4 text-white" />;
      case 'sent': return <Send className="w-4 h-4 text-white/50" />;
      case 'overdue': return <Clock className="w-4 h-4 text-white/70" />;
      default: return <CircleDashed className="w-4 h-4 text-white/30" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'paid': return 'bg-white/10 text-white';
      case 'sent': return 'bg-white/5 text-white/70';
      case 'overdue': return 'bg-white/20 text-white font-bold border border-white/50';
      default: return 'bg-transparent border border-white/10 text-white/50';
    }
  };

  const addItem = () => {
    setNewItems([...newItems, {desc: "", amount: 0}]);
  };

  const updateItem = (index: number, field: 'desc' | 'amount', value: string) => {
    const updated = [...newItems];
    if (field === 'desc') updated[index].desc = value;
    if (field === 'amount') updated[index].amount = Number(value);
    setNewItems(updated);
  };

  const removeItem = (index: number) => {
    setNewItems(newItems.filter((_, i) => i !== index));
  };

  return (
    <div className="p-8 flex flex-col gap-8 h-full animate-in fade-in zoom-in-95 duration-300">
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-white">Invoicing</h2>
          <p className="text-white/50 text-sm">Create and track invoices for your freelance work.</p>
        </div>
        <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-5 py-2.5 text-sm font-bold text-black hover:bg-yellow-300 transition-transform active:scale-95 shadow-[0_0_20px_rgba(250,204,21,0.25)]">
          <Plus className="w-5 h-5" /> Create Invoice
        </button>
      </div>

      <div className="flex-1 overflow-auto rounded-2xl border border-white/10 bg-neutral-900/50">
        <table className="w-full text-left text-sm">
          <thead className="bg-black/40 text-white/50 sticky top-0 backdrop-blur-md">
            <tr>
              <th className="px-6 py-4 font-medium">Invoice ID</th>
              <th className="px-6 py-4 font-medium">Client</th>
              <th className="px-6 py-4 font-medium">Amount</th>
              <th className="px-6 py-4 font-medium">Due Date</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-4 font-mono text-white/50">INV-{inv.id.toString().padStart(4, '0')}</td>
                <td className="px-6 py-4 font-bold text-white">{inv.client_name}</td>
                <td className="px-6 py-4 font-mono font-bold text-white">${inv.total_amount.toFixed(2)}</td>
                <td className="px-6 py-4 text-white/50">{inv.due_date}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium capitalize ${getStatusColor(inv.status)}`}>
                    {getStatusIcon(inv.status)} {inv.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-md transition-colors" title="Export PDF">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-md transition-colors" title="Send to Client">
                      <Send className="w-4 h-4" />
                    </button>
                    <button className="p-1.5 hover:bg-white/10 text-white/50 hover:text-white rounded-md transition-colors" title="View Details">
                      <FileText className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {invoices.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center py-12 text-white/50">No invoices created yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">Create Invoice</h3>
              <button onClick={() => setShowAddModal(false)} className="text-white/50 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAddInvoice} className="p-6 flex flex-col gap-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Client Name</label>
                  <input type="text" required value={newInv.client_name} onChange={e => setNewInv({...newInv, client_name: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" placeholder="Acme Corp" />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-white/70 font-medium">Due Date</label>
                  <input type="date" required value={newInv.due_date} onChange={e => setNewInv({...newInv, due_date: e.target.value})} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-yellow-400/50" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm text-white/70 font-medium">Line Items</label>
                  <button type="button" onClick={addItem} className="text-xs font-bold text-yellow-400 hover:text-yellow-300">
                    + Add Item
                  </button>
                </div>
                
                {newItems.map((item, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input type="text" required value={item.desc} onChange={e => updateItem(index, 'desc', e.target.value)} className="flex-1 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-yellow-400/50" placeholder="Service description" />
                    <input type="number" step="0.01" required value={item.amount} onChange={e => updateItem(index, 'amount', e.target.value)} className="w-32 bg-black/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white outline-none focus:border-yellow-400/50" placeholder="Amount" />
                    {newItems.length > 1 && (
                      <button type="button" onClick={() => removeItem(index)} className="p-2 text-white/30 hover:text-white/70">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}

                <div className="flex justify-end pt-4 border-t border-white/5 mt-2">
                  <div className="text-sm text-white/50 mr-4 mt-1">Total:</div>
                  <div className="text-xl font-bold text-white">${newItems.reduce((s, i) => s + Number(i.amount || 0), 0).toFixed(2)}</div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 rounded-xl text-white/70 hover:bg-white/5 font-medium transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 rounded-xl bg-yellow-400 text-black font-bold hover:bg-yellow-300 transition-colors">Save Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
