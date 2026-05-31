import { useState, useEffect, useMemo } from "react";
import { invoke } from "../../../lib/financeSupabaseInvoke";
import { Plus, Package, Search, BarChart, Loader2, X, RefreshCw } from "lucide-react";

export type InventoryItem = {
  id: number;
  sku: string;
  name: string;
  description: string;
  quantity: number;
  unit_cost: number;
  unit_price: number;
};

export default function InventoryCOGSView() {
  const [activeTab, setActiveTab] = useState("items");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await invoke<InventoryItem[]>("get_inventory_items");
      setItems(res);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) =>
      [item.sku, item.name, item.description].some((value) => value.toLowerCase().includes(term))
    );
  }, [items, query]);

  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-yellow-400">Supply Chain</p>
            <h2 className="mt-2 font-heading text-3xl font-black tracking-tight text-white flex items-center gap-2">
              <Package className="h-6 w-6 text-yellow-400" />
              Inventory & COGS
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-white/60">
              Track stock levels, calculate Cost of Goods Sold, and manage multiple warehouses.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                placeholder="Search SKU or Product..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className="w-full sm:w-64 rounded-xl border border-neutral-800 bg-neutral-950 px-9 py-2.5 text-sm text-white outline-none placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
            <button onClick={() => setShowModal(true)} className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" /> Add Item
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-6 border-b border-neutral-800">
          <button onClick={() => setActiveTab("items")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "items" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Inventory List</button>
          <button onClick={() => setActiveTab("cogs")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "cogs" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>COGS Analysis</button>
          <button onClick={() => setActiveTab("valuation")} className={`pb-3 text-sm font-bold transition-colors ${activeTab === "valuation" ? "border-b-2 border-yellow-400 text-yellow-400" : "border-b-2 border-transparent text-white/50 hover:text-white"}`}>Valuation (FIFO/LIFO)</button>
        </div>

        <div className="mt-6">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-yellow-400 animate-spin" /></div>
          ) : (
            <>
              {activeTab === "items" && <InventoryTable items={filteredItems} />}
              {activeTab === "cogs" && <COGSView items={filteredItems} />}
              {activeTab === "valuation" && <ValuationView items={filteredItems} />}
            </>
          )}
        </div>
      </section>

      {showModal && <CreateItemModal onClose={() => setShowModal(false)} onSaved={loadData} />}
    </div>
  );
}

function InventoryTable({ items }: { items: InventoryItem[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-neutral-800 bg-neutral-950/50">
      <table className="w-full text-left text-sm text-white/80">
        <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
          <tr>
            <th className="px-6 py-4 font-semibold">SKU & Item Name</th>
            <th className="px-6 py-4 font-semibold text-right">Quantity on Hand</th>
            <th className="px-6 py-4 font-semibold text-right">Unit Cost</th>
            <th className="px-6 py-4 font-semibold text-right">Total Value</th>
            <th className="px-6 py-4 font-semibold text-center">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800">
          {items.length === 0 && (
            <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">No inventory items found.</td></tr>
          )}
          {items.map((i) => {
            const totalValue = i.quantity * i.unit_cost;
            return (
              <tr key={i.id} className="transition-colors hover:bg-neutral-800/30">
                <td className="px-6 py-4">
                  <div className="font-bold text-white flex items-center gap-2">
                    <Package className="h-4 w-4 text-white/40" />
                    {i.name}
                  </div>
                  <div className="mt-0.5 text-xs text-white/40 font-mono">{i.sku}</div>
                </td>
                <td className="px-6 py-4 text-right font-mono font-bold">{i.quantity}</td>
                <td className="px-6 py-4 text-right font-mono">${i.unit_cost.toFixed(2)}</td>
                <td className="px-6 py-4 text-right font-mono font-bold text-yellow-400">${totalValue.toFixed(2)}</td>
                <td className="px-6 py-4 text-center">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${i.quantity > 10 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                    {i.quantity > 10 ? 'In Stock' : 'Low Stock'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function COGSView({ items }: { items: InventoryItem[] }) {
  const totals = useMemo(() => {
    const inventoryCost = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
    const salesValue = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const grossProfit = salesValue - inventoryCost;
    const margin = salesValue > 0 ? (grossProfit / salesValue) * 100 : 0;
    return { inventoryCost, salesValue, grossProfit, margin };
  }, [items]);

  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6">
      <div className="flex items-center gap-2">
        <BarChart className="h-5 w-5 text-yellow-400" />
        <h3 className="text-lg font-bold text-white">Cost & Margin Analysis</h3>
      </div>
      <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-4">
        <InventoryMetric label="Inventory Cost" value={`$${totals.inventoryCost.toFixed(2)}`} />
        <InventoryMetric label="Retail Value" value={`$${totals.salesValue.toFixed(2)}`} />
        <InventoryMetric label="Gross Profit" value={`$${totals.grossProfit.toFixed(2)}`} />
        <InventoryMetric label="Gross Margin" value={`${totals.margin.toFixed(1)}%`} />
      </div>
      <div className="mt-6 overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="border-b border-neutral-800 bg-neutral-900/50 text-xs uppercase tracking-wider text-white/50">
            <tr>
              <th className="px-6 py-4 font-semibold">Item</th>
              <th className="px-6 py-4 font-semibold text-right">Quantity</th>
              <th className="px-6 py-4 font-semibold text-right">Unit Margin</th>
              <th className="px-6 py-4 font-semibold text-right">Inventory COGS</th>
              <th className="px-6 py-4 font-semibold text-right">Potential Gross Profit</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800">
            {items.length === 0 && <tr><td colSpan={5} className="px-6 py-8 text-center text-white/40">Add inventory items to calculate COGS.</td></tr>}
            {items.map((item) => {
              const unitMargin = item.unit_price - item.unit_cost;
              return (
                <tr key={item.id}>
                  <td className="px-6 py-4 font-bold text-white">{item.name}</td>
                  <td className="px-6 py-4 text-right font-mono">{item.quantity}</td>
                  <td className="px-6 py-4 text-right font-mono">${unitMargin.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono">${(item.quantity * item.unit_cost).toFixed(2)}</td>
                  <td className="px-6 py-4 text-right font-mono text-green-400">${(item.quantity * unitMargin).toFixed(2)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ValuationView({ items }: { items: InventoryItem[] }) {
  const [method, setMethod] = useState("FIFO");
  const totalValue = items.reduce((sum, item) => sum + item.quantity * item.unit_cost, 0);
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-950/50 p-6 text-center">
      <RefreshCw className="h-10 w-10 text-white/20 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-white">Inventory Valuation</h3>
      <p className="text-sm text-white/50 max-w-md mx-auto mt-2">Current valuation is calculated from on-hand quantity and unit cost. FIFO/LIFO layers are not created until purchase lots are recorded.</p>
      <div className="mt-6 flex justify-center gap-2">
        {["FIFO", "LIFO", "Weighted Average"].map((option) => (
          <button
            key={option}
            onClick={() => setMethod(option)}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition-colors ${method === option ? "bg-yellow-400 text-black" : "bg-neutral-800 text-white hover:bg-neutral-700"}`}
          >
            {option}
          </button>
        ))}
      </div>
      <div className="mx-auto mt-6 max-w-sm rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{method} Book Value</p>
        <p className="mt-2 text-3xl font-black text-white">${totalValue.toFixed(2)}</p>
        <p className="mt-1 text-xs text-white/40">{items.length} inventory items included</p>
      </div>
    </div>
  );
}

function InventoryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{label}</p>
      <p className="mt-2 text-xl font-black text-white">{value}</p>
    </div>
  );
}

function CreateItemModal({ onClose, onSaved }: { onClose: () => void, onSaved: () => void }) {
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [qty, setQty] = useState("0");
  const [cost, setCost] = useState("0");
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await invoke("create_inventory_item", {
        input: { 
          sku, 
          name, 
          description: desc, 
          quantity: parseInt(qty) || 0, 
          unit_cost: parseFloat(cost) || 0, 
          unit_price: parseFloat(price) || 0 
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
      <div className="w-full max-w-lg rounded-2xl border border-neutral-800 bg-neutral-950 p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Inventory Item</h2>
          <button onClick={onClose} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">SKU</label>
              <input required value={sku} onChange={e => setSku(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" placeholder="e.g. PRD-102" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Product Name</label>
              <input required value={name} onChange={e => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-white/50 uppercase">Description</label>
            <input value={desc} onChange={e => setDesc(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Initial Qty</label>
              <input type="number" required value={qty} onChange={e => setQty(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Unit Cost ($)</label>
              <input type="number" step="0.01" required value={cost} onChange={e => setCost(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-xs font-semibold text-white/50 uppercase">Unit Price ($)</label>
              <input type="number" step="0.01" required value={price} onChange={e => setPrice(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-2 text-white outline-none focus:border-yellow-400" />
            </div>
          </div>
          <button disabled={saving} type="submit" className="w-full mt-4 rounded-xl bg-yellow-400 py-3 font-bold text-black hover:bg-yellow-300 transition-colors">
            {saving ? "Saving..." : "Save Item"}
          </button>
        </form>
      </div>
    </div>
  );
}
