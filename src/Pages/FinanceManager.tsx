import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BookOpen,
  Building,
  ClipboardCheck,
  FileBarChart,
  Landmark,
  Package,
  PieChart,
  Plug,
  ReceiptText,
  Search,
  ShieldCheck,
  ShoppingCart,
  Wallet,
} from "lucide-react";

import DashboardView from "../components/finance-manager/views/DashboardView";
import GeneralLedgerView from "../components/finance-manager/views/GeneralLedgerView";
import AccountsReceivableView from "../components/finance-manager/views/AccountsReceivableView";
import AccountsPayableView from "../components/finance-manager/views/AccountsPayableView";
import CashTreasuryView from "../components/finance-manager/views/CashTreasuryView";
import BudgetingForecastingView from "../components/finance-manager/views/BudgetingForecastingView";
import FinancialReportingView from "../components/finance-manager/views/FinancialReportingView";
import FixedAssetsView from "../components/finance-manager/views/FixedAssetsView";
import TaxManagementView from "../components/finance-manager/views/TaxManagementView";
import ProcurementView from "../components/finance-manager/views/ProcurementView";
import InventoryCogsView from "../components/finance-manager/views/InventoryCogsView";
import IntegrationsAutomationView from "../components/finance-manager/views/IntegrationsAutomationView";
import ComplianceAuditView from "../components/finance-manager/views/ComplianceAuditView";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: <PieChart className="w-5 h-5" /> },
  { id: "gl", label: "General Ledger", icon: <BookOpen className="w-5 h-5" /> },
  { id: "ar", label: "Accounts Receivable", icon: <ArrowDownRight className="w-5 h-5" /> },
  { id: "ap", label: "Accounts Payable", icon: <ArrowUpRight className="w-5 h-5" /> },
  { id: "cash", label: "Cash & Treasury", icon: <Landmark className="w-5 h-5" /> },
  { id: "budget", label: "Budgeting", icon: <PieChart className="w-5 h-5" /> },
  { id: "reports", label: "Financial Reports", icon: <FileBarChart className="w-5 h-5" /> },
  { id: "assets", label: "Fixed Assets", icon: <Building className="w-5 h-5" /> },
  { id: "tax", label: "Tax Management", icon: <ReceiptText className="w-5 h-5" /> },
  { id: "procurement", label: "Procurement", icon: <ShoppingCart className="w-5 h-5" /> },
  { id: "inventory", label: "Inventory & COGS", icon: <Package className="w-5 h-5" /> },
  { id: "integrations", label: "Integrations", icon: <Plug className="w-5 h-5" /> },
  { id: "compliance", label: "Compliance & Audit", icon: <ClipboardCheck className="w-5 h-5" /> },
];

export default function FinanceManager() {
  const [activeView, setActiveView] = useState("dashboard");
  const activeItem = NAV_ITEMS.find((item) => item.id === activeView) ?? NAV_ITEMS[0];

  const renderView = () => {
    switch (activeView) {
      case "dashboard":
        return <DashboardView />;
      case "gl":
        return <GeneralLedgerView />;
      case "ar":
        return <AccountsReceivableView />;
      case "ap":
        return <AccountsPayableView />;
      case "cash":
        return <CashTreasuryView />;
      case "budget":
        return <BudgetingForecastingView />;
      case "reports":
        return <FinancialReportingView />;
      case "assets":
        return <FixedAssetsView />;
      case "tax":
        return <TaxManagementView />;
      case "procurement":
        return <ProcurementView />;
      case "inventory":
        return <InventoryCogsView />;
      case "integrations":
        return <IntegrationsAutomationView />;
      case "compliance":
        return <ComplianceAuditView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <WelcomeScreen
      appKey="finance"
      title="Advanced Finance Manager"
      description="Powerful enterprise resource planning (ERP) capabilities - securely offline."
    >
      <div className="flex h-full w-full overflow-hidden bg-neutral-950 text-white animate-fadeIn">
        <aside className="flex h-full w-[280px] shrink-0 flex-col border-r border-neutral-800 bg-neutral-900/60">
          <div className="border-b border-neutral-800/70 p-5">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl border border-neutral-800 bg-neutral-950 text-yellow-400">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-black tracking-tight text-white">Finance OS</h1>
                <p className="text-xs text-white/50">Enterprise ERP Workspace</p>
              </div>
            </div>
            <button className="mt-5 flex w-full items-center gap-2 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-left text-xs text-white/50 transition-colors hover:border-white/30">
              <Search className="h-4 w-4" />
              Search transactions, bills...
            </button>
          </div>

          <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition-all duration-200 ${
                  activeView === item.id
                    ? "bg-yellow-400/10 text-yellow-400 shadow-[inset_3px_0_0_#F7C948]"
                    : "text-white/50 hover:bg-neutral-800/60 hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-3 border-t border-neutral-800 p-4">
            <div className="rounded-xl border border-neutral-800 bg-neutral-950 p-3">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                Local-first vault
              </div>
              <p className="mt-1 text-xs leading-relaxed text-white/50">
                Ledger, accounts, and reports stay on this device.
              </p>
            </div>
            <button className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-white/50 transition-all hover:bg-neutral-800/60 hover:text-white">
              <Bell className="h-5 w-5" />
              Alerts
              <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">3</span>
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <header className="absolute left-0 right-0 top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-800 bg-neutral-950/90 px-6 backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg border border-neutral-800 bg-neutral-900/60 text-yellow-400">
                {activeItem.icon}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">Workspace</p>
                <h2 className="text-sm font-bold text-white">{activeItem.label}</h2>
              </div>
            </div>
          </header>

          <div className="custom-scrollbar absolute inset-0 overflow-y-auto">
            <div className="min-h-full pt-16">{renderView()}</div>
          </div>
        </main>
      </div>
    </WelcomeScreen>
  );
}
