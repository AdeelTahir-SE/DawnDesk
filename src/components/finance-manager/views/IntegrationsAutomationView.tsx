import { useState } from "react";
import { Plug, Plus, Search, RefreshCw, CheckCircle2, AlertTriangle, Workflow, CreditCard, ShoppingBag } from "lucide-react";

export default function IntegrationsAutomationView() {
  return (
    <div className="flex flex-col gap-6 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-2xl border border-neutral-800 bg-neutral-900/60 p-6 shadow-lg shadow-black/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <Plug className="h-6 w-6 text-yellow-400" />
              Integrations & Automation
            </h2>
            <p className="mt-2 text-sm text-white/50">Connect your finance stack and configure workflow rules.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 rounded-xl bg-yellow-400 px-4 py-2.5 text-sm font-bold text-black transition-colors hover:bg-yellow-300">
              <Plus className="h-4 w-4" />
              Add Integration
            </button>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <IntegrationCard 
            name="Plaid" 
            desc="Bank feed auto-import" 
            status="Connected" 
            sync="Syncing normally" 
            icon={<CreditCard className="h-6 w-6 text-white" />}
            color="bg-neutral-800"
          />
          <IntegrationCard 
            name="Shopify" 
            desc="E-commerce sales sync" 
            status="Connected" 
            sync="Synced 2 hrs ago" 
            icon={<ShoppingBag className="h-6 w-6 text-[#96bf48]" />}
            color="bg-[#96bf48]/10 border-[#96bf48]/30"
          />
          <IntegrationCard 
            name="Gusto" 
            desc="Payroll journal entries" 
            status="Error" 
            sync="API token expired" 
            icon={<Workflow className="h-6 w-6 text-[#F05E41]" />}
            color="bg-[#F05E41]/10 border-[#F05E41]/30"
          />
          <IntegrationCard 
            name="Salesforce" 
            desc="CRM opportunities to invoices" 
            status="Disconnected" 
            sync="Not configured" 
            icon={<Workflow className="h-6 w-6 text-[#00A1E0]" />}
            color="bg-neutral-800"
          />
        </div>

        <div className="mt-10 border-t border-neutral-800 pt-8">
          <h3 className="text-lg font-bold text-white mb-4">Automation Rules</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-bold text-white">Auto-categorize AWS bills</p>
                  <p className="text-sm text-white/50">IF vendor equals "AWS" THEN categorize as "5200 - Hosting"</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Active</span>
                <div className="w-10 h-6 rounded-full bg-yellow-400 flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 bg-black rounded-full transform translate-x-4"></div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-neutral-950/50 p-4">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                  <Workflow className="h-5 w-5 text-white/40" />
                </div>
                <div>
                  <p className="font-bold text-white/60">Dunning emails (Net 30)</p>
                  <p className="text-sm text-white/40">IF invoice overdue > 5 days THEN send reminder email</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-neutral-400 bg-neutral-500/10 px-2 py-1 rounded-full">Disabled</span>
                <div className="w-10 h-6 rounded-full bg-neutral-800 flex items-center px-1 cursor-pointer">
                  <div className="w-4 h-4 bg-neutral-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function IntegrationCard({ name, desc, status, sync, icon, color }: any) {
  return (
    <div className={`rounded-xl border ${status === 'Error' ? 'border-red-500/50' : 'border-neutral-800'} bg-neutral-950/50 p-5 relative overflow-hidden`}>
      <div className={`absolute top-0 right-0 p-3`}>
        {status === 'Connected' ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : 
         status === 'Error' ? <AlertTriangle className="h-5 w-5 text-red-400" /> : 
         null}
      </div>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 ${color}`}>
        {icon}
      </div>
      <h3 className="font-bold text-white text-lg">{name}</h3>
      <p className="text-sm text-white/60 mt-1">{desc}</p>
      
      <div className="mt-4 pt-4 border-t border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className={`h-3 w-3 ${status === 'Error' ? 'text-red-400' : 'text-white/40'}`} />
          <span className={`text-xs ${status === 'Error' ? 'text-red-400' : 'text-white/40'}`}>{sync}</span>
        </div>
        <button className="text-xs font-bold text-white hover:text-yellow-400 transition-colors">Configure</button>
      </div>
    </div>
  );
}
