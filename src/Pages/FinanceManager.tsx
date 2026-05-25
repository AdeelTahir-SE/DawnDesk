import { useState } from "react";
import WelcomeScreen from "../components/WelcomeScreen";
import { 
  LayoutDashboard, Receipt, Wallet, PieChart, Target, 
  Repeat, CreditCard, FileText, Settings, Bell
} from "lucide-react";
import DashboardView from "../components/finance-manager/views/DashboardView";
import TransactionsView from "../components/finance-manager/views/TransactionsView";
import AccountsView from "../components/finance-manager/views/AccountsView";
import BudgetsView from "../components/finance-manager/views/BudgetsView";
import GoalsView from "../components/finance-manager/views/GoalsView";
import SubscriptionsView from "../components/finance-manager/views/SubscriptionsView";
import DebtsView from "../components/finance-manager/views/DebtsView";
import InvoicingView from "../components/finance-manager/views/InvoicingView";
import SettingsView from "../components/finance-manager/views/SettingsView";

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
  { id: 'transactions', label: 'Transactions', icon: <Receipt className="w-5 h-5" /> },
  { id: 'accounts', label: 'Accounts', icon: <Wallet className="w-5 h-5" /> },
  { id: 'budgets', label: 'Budgets', icon: <PieChart className="w-5 h-5" /> },
  { id: 'goals', label: 'Goals', icon: <Target className="w-5 h-5" /> },
  { id: 'subscriptions', label: 'Subscriptions', icon: <Repeat className="w-5 h-5" /> },
  { id: 'debts', label: 'Debts', icon: <CreditCard className="w-5 h-5" /> },
  { id: 'invoicing', label: 'Invoicing', icon: <FileText className="w-5 h-5" /> },
  { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function FinanceManager() {
  const [activeView, setActiveView] = useState('dashboard');

  const renderView = () => {
    switch(activeView) {
      case 'dashboard': return <DashboardView />;
      case 'transactions': return <TransactionsView />;
      case 'accounts': return <AccountsView />;
      case 'budgets': return <BudgetsView />;
      case 'goals': return <GoalsView />;
      case 'subscriptions': return <SubscriptionsView />;
      case 'debts': return <DebtsView />;
      case 'invoicing': return <InvoicingView />;
      case 'settings': return <SettingsView />;
      default: return <DashboardView />;
    }
  };

  return (
    <WelcomeScreen appKey="finance" title="Advanced Finance Manager" description="Powerful analytics, budgeting, and insights—securely offline.">
      <div className="flex h-full w-full bg-[#0a0a0a] text-white overflow-hidden">
        
        {/* Sidebar */}
        <div className="w-64 border-r border-white/5 bg-black/40 flex flex-col h-full shrink-0">
          <div className="p-6">
            <h1 className="text-xl font-black tracking-tight bg-gradient-to-r from-yellow-400 to-yellow-200 bg-clip-text text-transparent flex items-center gap-2">
              <Wallet className="text-yellow-400 w-6 h-6" />
              Finance
            </h1>
          </div>
          
          <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium ${
                  activeView === item.id 
                    ? 'bg-yellow-400/10 text-yellow-400 shadow-[inset_2px_0_0_#facc15]' 
                    : 'text-white/50 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/50 hover:text-white hover:bg-white/5 transition-all text-sm font-medium">
              <Bell className="w-5 h-5" />
              Alerts
              <span className="ml-auto bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded-full">3</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-hidden relative">
          <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
            {renderView()}
          </div>
        </div>

      </div>
    </WelcomeScreen>
  );
}
