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
      <div className="dd-page">
        <aside className="dd-sidebar">
          <div className="dd-sidebar-header">
            <div className="flex items-center gap-3">
              <div className="dd-icon-box">
                <Wallet className="h-5 w-5" />
              </div>
              <div>
                <h1 className="dd-sidebar-title">Finance OS</h1>
                <p className="dd-subtext">Enterprise ERP Workspace</p>
              </div>
            </div>
            <button className="dd-search mt-5">
              <Search className="h-4 w-4" />
              Search transactions, bills...
            </button>
          </div>

          <nav className="custom-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`dd-nav-item ${
                  activeView === item.id ? "dd-nav-item-active" : ""
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-3 border-t border-neutral-800 p-4">
            <div className="dd-sidebar-notice">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <ShieldCheck className="h-4 w-4 text-green-400" />
                Local-first vault
              </div>
              <p className="dd-subtext mt-1 leading-relaxed">
                Ledger, accounts, and reports stay on this device.
              </p>
            </div>
            <button className="dd-nav-item">
              <Bell className="h-5 w-5" />
              Alerts
              <span className="ml-auto rounded-full bg-yellow-400 px-2 py-0.5 text-[10px] font-bold text-black">3</span>
            </button>
          </div>
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <header className="dd-topbar">
            <div className="flex items-center gap-3">
              <div className="dd-icon-box-sm">
                {activeItem.icon}
              </div>
              <div>
                <p className="dd-label-muted">Workspace</p>
                <h2 className="dd-card-title">{activeItem.label}</h2>
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
