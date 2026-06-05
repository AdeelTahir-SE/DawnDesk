import { useEffect, useState } from "react";
import ConnectionErrorModal from "../components/ConnectionErrorModal";
import WelcomeScreen from "../components/WelcomeScreen";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  BookOpen,
  Building,
  ClipboardCheck,
  Database,
  Download,
  FileBarChart,
  Landmark,
  Loader2,
  Package,
  PieChart,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  Upload,
  UserPlus,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAppLogger } from "../utils/LoggerContext";
import { pickJsonFile, safeExportName, saveJsonFile } from "../lib/jsonExchange";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import {
  createFinanceRow,
  createFinanceWorkspace,
  FINANCE_EXPORT_TABLES,
  formatSupabaseError,
  inviteFinanceMember,
  listFinanceMembers,
  listFinanceRows,
  listFinanceWorkspaces,
  removeFinanceMember,
  type FinanceTableRow,
  type FinanceMember,
  type FinanceWorkspace,
} from "../lib/workspaceSync";
import { setActiveFinanceWorkspaceId } from "../lib/financeSupabaseInvoke";
import { CONNECTION_ERROR_EVENT, getConnectionErrorMessage } from "../lib/connectionErrors";
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
import ComplianceAuditView from "../components/finance-manager/views/ComplianceAuditView";
import FinanceSectionComments from "../components/finance-manager/FinanceSectionComments";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: PieChart, group: "Planning" },
  { id: "gl", label: "General Ledger", icon: BookOpen, group: "Accounting" },
  { id: "ar", label: "Accounts Receivable", icon: ArrowDownRight, group: "Accounting" },
  { id: "ap", label: "Accounts Payable", icon: ArrowUpRight, group: "Accounting" },
  { id: "cash", label: "Cash & Treasury", icon: Landmark, group: "Accounting" },
  { id: "budget", label: "Budgeting", icon: PieChart, group: "Accounting" },
  { id: "reports", label: "Financial Reports", icon: FileBarChart, group: "Project" },
  { id: "assets", label: "Fixed Assets", icon: Building, group: "Operations" },
  { id: "tax", label: "Tax Management", icon: ReceiptText, group: "Operations" },
  { id: "procurement", label: "Procurement", icon: ShoppingCart, group: "Operations" },
  { id: "inventory", label: "Inventory & COGS", icon: Package, group: "Operations" },
  { id: "compliance", label: "Compliance & Audit", icon: ClipboardCheck, group: "Operations" },
  { id: "members", label: "Members", icon: Users, group: "Project" },
] as const;

type FinanceView = (typeof NAV_ITEMS)[number]["id"];
type FinanceNavGroup = (typeof NAV_ITEMS)[number]["group"];

const FINANCE_NAV_GROUPS: FinanceNavGroup[] = ["Planning", "Accounting", "Operations", "Project"];

type FinanceWorkspaceExportFile = {
  schema: "dawndesk.finance-workspace";
  version: 1;
  exportedAt: string;
  workspace: Pick<FinanceWorkspace, "name">;
  tables: Partial<Record<(typeof FINANCE_EXPORT_TABLES)[number], FinanceTableRow[]>>;
};

export default function FinanceManager() {
  const { logSuccess, logError } = useAppLogger();
  const [activeView, setActiveView] = useState<FinanceView>("dashboard");
  const [navSearch, setNavSearch] = useState("");
  const [financeWorkspace, setFinanceWorkspace] = useState<FinanceWorkspace | null>(null);
  const [financeWorkspaces, setFinanceWorkspaces] = useState<FinanceWorkspace[]>([]);
  const [financeMembers, setFinanceMembers] = useState<FinanceMember[]>([]);
  const [financeSyncError, setFinanceSyncError] = useState("");
  const [loadingWorkspace, setLoadingWorkspace] = useState(true);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
  const [creatingWorkspace, setCreatingWorkspace] = useState(false);
  const [importingWorkspace, setImportingWorkspace] = useState(false);
  const [exportingWorkspaceId, setExportingWorkspaceId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<FinanceMember["role"]>("Accountant");
  const [inviting, setInviting] = useState(false);
  const [connectionErrorOpen, setConnectionErrorOpen] = useState(false);
  const activeItem = NAV_ITEMS.find((item) => item.id === activeView) ?? NAV_ITEMS[0];
  const filteredNavItems = NAV_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(navSearch.trim().toLowerCase())
  );
  const ActiveIcon = activeItem.icon;

  const refreshFinanceWorkspace = async () => {
    if (!isSupabaseConfigured) {
      setLoadingWorkspace(false);
      return;
    }

    setFinanceSyncError("");
    setLoadingWorkspace(true);
    try {
      const workspaces = await listFinanceWorkspaces();
      setFinanceWorkspaces(workspaces);
      if (financeWorkspace && workspaces.some((workspace) => workspace.id === financeWorkspace.id)) {
        setFinanceMembers(await listFinanceMembers(financeWorkspace.id));
      } else {
        setFinanceWorkspace(null);
        setFinanceMembers([]);
      }
    } catch (error) {
      setFinanceSyncError(formatSupabaseError(error));
    }
    setLoadingWorkspace(false);
  };

  useEffect(() => {
    refreshFinanceWorkspace();
  }, []);

  useEffect(() => {
    const handleConnectionError = () => {
      setConnectionErrorOpen(true);
    };

    window.addEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
    return () => window.removeEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
  }, []);

  useEffect(() => {
    setActiveFinanceWorkspaceId(financeWorkspace?.id ?? null);
  }, [financeWorkspace?.id]);

  const handleInviteFinanceMember = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!financeWorkspace || !inviteEmail.trim()) return;

    setInviting(true);
    setFinanceSyncError("");
    try {
      await inviteFinanceMember(financeWorkspace.id, inviteEmail, inviteRole);
      setInviteEmail("");
      setInviteRole("Accountant");
      const members = await listFinanceMembers(financeWorkspace.id);
      setFinanceMembers(members);
    } catch (error) {
      setFinanceSyncError(formatSupabaseError(error));
    }
    setInviting(false);
  };

  const handleCreateFinanceWorkspace = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newWorkspaceName.trim()) return;
    setCreatingWorkspace(true);
    setFinanceSyncError("");
    try {
      const workspace = await createFinanceWorkspace(newWorkspaceName);
      const workspaces = await listFinanceWorkspaces();
      setFinanceWorkspaces(workspaces);
      setFinanceWorkspace(workspace);
      setFinanceMembers(await listFinanceMembers(workspace.id));
      setNewWorkspaceName("");
      setIsWorkspaceModalOpen(false);
      setActiveView("dashboard");
    } catch (error) {
      setFinanceSyncError(formatSupabaseError(error));
    }
    setCreatingWorkspace(false);
  };

  const handleExportFinanceWorkspace = async (workspace: FinanceWorkspace) => {
    setExportingWorkspaceId(workspace.id);
    setFinanceSyncError("");
    try {
      const tableEntries = await Promise.all(
        FINANCE_EXPORT_TABLES.map(async (tableName) => [
          tableName,
          await listFinanceRows(tableName, workspace.id),
        ] as const)
      );
      const payload: FinanceWorkspaceExportFile = {
        schema: "dawndesk.finance-workspace",
        version: 1,
        exportedAt: new Date().toISOString(),
        workspace: { name: workspace.name },
        tables: Object.fromEntries(tableEntries),
      };
      const path = await saveJsonFile(
        `${safeExportName(workspace.name, "dawndesk-finance")}.dawndesk-finance.json`,
        payload,
        "Save finance project JSON export"
      );
      if (path) logSuccess("Finance project exported", path, { source: "finance" });
    } catch (error) {
      const message = formatSupabaseError(error);
      setFinanceSyncError(message);
      logError("Finance project export failed", message, { source: "finance" });
    } finally {
      setExportingWorkspaceId(null);
    }
  };

  const normalizeImportedFinanceWorkspace = (file: unknown): FinanceWorkspaceExportFile => {
    if (!file || typeof file !== "object") throw new Error("This JSON file is not a DawnDesk finance export.");
    const maybeFile = file as Partial<FinanceWorkspaceExportFile> & { name?: string };
    const workspace = maybeFile.workspace ?? { name: maybeFile.name };
    if (!workspace.name || typeof workspace.name !== "string") {
      throw new Error("Finance JSON is missing a project name.");
    }
    return {
      schema: "dawndesk.finance-workspace",
      version: 1,
      exportedAt: typeof maybeFile.exportedAt === "string" ? maybeFile.exportedAt : new Date().toISOString(),
      workspace: { name: workspace.name },
      tables: maybeFile.tables ?? {},
    };
  };

  const handleImportFinanceWorkspace = async () => {
    setImportingWorkspace(true);
    setFinanceSyncError("");
    try {
      const file = normalizeImportedFinanceWorkspace(await pickJsonFile());
      const workspace = await createFinanceWorkspace(`${file.workspace.name} Import`);
      for (const tableName of FINANCE_EXPORT_TABLES) {
        const rows = file.tables[tableName] ?? [];
        for (const row of rows) {
          const { id: _id, workspace_id: _workspaceId, ...payload } = row;
          await createFinanceRow(tableName, workspace.id, payload);
        }
      }
      const workspaces = await listFinanceWorkspaces();
      setFinanceWorkspaces(workspaces);
      setFinanceWorkspace(workspace);
      setFinanceMembers(await listFinanceMembers(workspace.id));
      setNewWorkspaceName("");
      setIsWorkspaceModalOpen(false);
      setActiveView("dashboard");
      logSuccess("Finance project imported", workspace.name, { source: "finance" });
    } catch (error) {
      const message = formatSupabaseError(error);
      if (message === "No JSON file selected.") return;
      setFinanceSyncError(message);
      logError("Finance project import failed", message, { source: "finance" });
    } finally {
      setImportingWorkspace(false);
    }
  };

  const handleSelectWorkspace = async (workspaceId: string) => {
    const workspace = financeWorkspaces.find((item) => item.id === workspaceId);
    if (!workspace) return;
    setFinanceWorkspace(workspace);
    setFinanceSyncError("");
    try {
      setFinanceMembers(await listFinanceMembers(workspace.id));
    } catch (error) {
      setFinanceSyncError(formatSupabaseError(error));
    }
  };

  const handleRemoveFinanceMember = async (member: FinanceMember) => {
    if (member.role === "Owner") return;
    if (!window.confirm("Remove this user from the finance workspace?")) return;

    try {
      await removeFinanceMember(member.id);
      if (financeWorkspace) {
        const members = await listFinanceMembers(financeWorkspace.id);
        setFinanceMembers(members);
      }
    } catch (error) {
      setFinanceSyncError(formatSupabaseError(error));
    }
  };

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
      case "compliance":
        return <ComplianceAuditView />;
      case "members":
        return (
          <FinanceMembersSettings
            workspace={financeWorkspace}
            members={financeMembers}
            error={financeSyncError}
            inviteEmail={inviteEmail}
            inviteRole={inviteRole}
            inviting={inviting}
            onInviteEmailChange={setInviteEmail}
            onInviteRoleChange={setInviteRole}
            onInvite={handleInviteFinanceMember}
            onRemove={handleRemoveFinanceMember}
          />
        );
      default:
        return <DashboardView />;
    }
  };

  return (
    <WelcomeScreen
      appKey="finance"
      title="Advanced Finance Manager"
      description="Powerful ERP capabilities connected to your shared finance workspace."
    >
      <ConnectionErrorModal
        open={connectionErrorOpen}
        message={getConnectionErrorMessage()}
        onClose={() => setConnectionErrorOpen(false)}
      />
      {financeWorkspace === null ? (
        <>
          <FinanceWorkspaceHub
            workspaces={financeWorkspaces}
            loading={loadingWorkspace}
            error={financeSyncError}
            importing={importingWorkspace}
            exportingWorkspaceId={exportingWorkspaceId}
            onSelect={handleSelectWorkspace}
            onCreateClick={() => setIsWorkspaceModalOpen(true)}
            onImport={handleImportFinanceWorkspace}
            onExport={handleExportFinanceWorkspace}
          />
          {isWorkspaceModalOpen && (
            <FinanceWorkspaceCreateModal
              name={newWorkspaceName}
              creating={creatingWorkspace}
              importing={importingWorkspace}
              error={financeSyncError}
              onNameChange={setNewWorkspaceName}
              onClose={() => setIsWorkspaceModalOpen(false)}
              onSubmit={handleCreateFinanceWorkspace}
              onImport={handleImportFinanceWorkspace}
            />
          )}
        </>
      ) : (
      <div className="dd-page">
        <aside className="dd-sidebar-narrow">
          <div className="dd-sidebar-header">
            <div className="flex flex-col gap-4">
              <button
                onClick={() => { setFinanceWorkspace(null); setFinanceMembers([]); setNavSearch(""); }}
                className="flex items-center gap-2 text-xs font-bold text-white/60 transition-colors hover:text-white self-start"
              >
                <ArrowLeft className="h-4 w-4" />
                Hub
              </button>

              <div>
                <h1 className="dd-sidebar-title line-clamp-1">{financeWorkspace.name}</h1>
                <p className="dd-subtext mt-1 line-clamp-2">Finance Workspace</p>
              </div>
            </div>
          </div>

          <div className="px-3 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/35" />
              <input
                value={navSearch}
                onChange={(event) => setNavSearch(event.target.value)}
                placeholder="Search modules..."
                className="w-full rounded-lg border border-neutral-800 bg-neutral-950 py-2 pl-9 pr-3 text-xs text-white outline-none transition-colors placeholder:text-white/35 focus:border-yellow-400/60"
              />
            </div>
          </div>

          <nav className="custom-scrollbar flex-1 overflow-y-auto p-3">
            {FINANCE_NAV_GROUPS.map((group) => {
              const groupItems = filteredNavItems.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="mb-6 last:mb-0">
                  <p className="dd-label-muted mb-2 px-2">{group}</p>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const ItemIcon = item.icon;
                      return (
                        <button
                          key={item.id}
                          onClick={() => setActiveView(item.id)}
                          className={`dd-nav-item-sm ${
                            activeView === item.id ? "dd-nav-item-sm-active" : ""
                          }`}
                        >
                          <ItemIcon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            {filteredNavItems.length === 0 && (
              <p className="px-3 py-4 text-xs font-semibold text-white/40">
                No finance modules match that search.
              </p>
            )}
          </nav>

          <div className="border-t border-neutral-800 p-3">
            <button
              onClick={() => financeWorkspace && handleExportFinanceWorkspace(financeWorkspace)}
              disabled={!financeWorkspace || exportingWorkspaceId === financeWorkspace.id}
              className="dd-nav-item-sm w-full disabled:cursor-wait disabled:opacity-50"
            >
              {exportingWorkspaceId === financeWorkspace.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              <span>Export Project</span>
            </button>
          </div>

          {financeSyncError && (
            <div className="border-t border-neutral-800 p-4">
              <p className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs leading-relaxed text-red-200">
                {financeSyncError}
              </p>
            </div>
          )}
        </aside>

        <main className="relative flex-1 overflow-hidden">
          <header className="dd-topbar">
            <div className="flex items-center gap-3">
              <div className="dd-icon-box-sm">
                <ActiveIcon className="h-4 w-4" />
              </div>
              <div>
                <p className="dd-label-muted">Workspace</p>
                <h2 className="dd-card-title">{activeItem.label}</h2>
              </div>
            </div>
            <FinanceSectionComments
              workspaceId={financeWorkspace?.id}
              section={activeView}
              sectionLabel={activeItem.label}
            />
          </header>

          <div className="custom-scrollbar absolute inset-0 overflow-y-auto">
            <div className="min-h-full pt-16">{renderView()}</div>
          </div>
        </main>
      </div>
      )}
    </WelcomeScreen>
  );
}

function FinanceWorkspaceHub({
  workspaces,
  loading,
  error,
  importing,
  exportingWorkspaceId,
  onSelect,
  onCreateClick,
  onImport,
  onExport,
}: {
  workspaces: FinanceWorkspace[];
  loading: boolean;
  error: string;
  importing: boolean;
  exportingWorkspaceId: string | null;
  onSelect: (workspaceId: string) => void;
  onCreateClick: () => void;
  onImport: () => void;
  onExport: (workspace: FinanceWorkspace) => void;
}) {
  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-8 p-4 sm:p-8">
      <section className="flex flex-col justify-between gap-6 border-b border-neutral-800 pb-6 md:flex-row md:items-end">
        <div className="flex items-center gap-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Finance Projects</h1>
            <p className="mt-1 max-w-xl text-neutral-400">Choose a shared finance workspace or create a new one.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onImport}
            disabled={importing}
            className="flex items-center gap-2 rounded-lg border border-neutral-700 px-4 py-2 text-sm font-bold text-neutral-200 transition-colors hover:bg-neutral-800 disabled:opacity-60"
          >
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            Import JSON
          </button>
          <button onClick={onCreateClick} className="dd-btn-primary">
            <Plus className="h-4 w-4" />
            New Finance Project
          </button>
        </div>
      </section>

      {error && (
        <div className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <section className="custom-scrollbar flex-1 overflow-auto pb-8">
        {loading ? (
          <div className="grid h-64 place-items-center">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-600" />
          </div>
        ) : workspaces.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-neutral-800 bg-neutral-900/20 text-center">
            <Database className="mb-4 h-12 w-12 text-neutral-600" />
            <h3 className="mb-1 text-lg font-medium text-white">No finance projects found</h3>
            <p className="max-w-md text-neutral-400">Create your first finance project to start saving finance data securely.</p>
            <button onClick={onCreateClick} className="dd-btn-primary mt-6">
              <Plus className="h-4 w-4" />
              Create Finance Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                onClick={() => onSelect(workspace.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSelect(workspace.id);
                }}
                role="button"
                tabIndex={0}
                className="group relative flex min-h-[190px] flex-col overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40 p-6 text-left transition-all hover:bg-neutral-800/60 focus:outline-none focus:ring-2 focus:ring-yellow-400/50"
              >
                <div className="absolute left-0 top-0 h-1 w-full bg-yellow-400" />
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-700 bg-neutral-800/80">
                    <Wallet className="h-5 w-5 text-neutral-300 transition-colors group-hover:text-white" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        onExport(workspace);
                      }}
                      className="rounded-md border border-neutral-800 p-1.5 text-neutral-400 transition-colors hover:border-yellow-400/40 hover:bg-yellow-400/10 hover:text-yellow-300"
                      title="Export finance project JSON"
                    >
                      {exportingWorkspaceId === workspace.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="mb-2 line-clamp-1 text-lg font-semibold text-white transition-colors group-hover:text-yellow-400">{workspace.name}</h3>
                  <p className="line-clamp-2 text-sm leading-relaxed text-neutral-400">Shared finance project</p>
                </div>
                <div className="mt-6 border-t border-neutral-800/60 pt-4 text-xs font-medium text-neutral-500">
                  {new Date(workspace.created_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FinanceMembersSettings({
  workspace,
  members,
  error,
  inviteEmail,
  inviteRole,
  inviting,
  onInviteEmailChange,
  onInviteRoleChange,
  onInvite,
  onRemove,
}: {
  workspace: FinanceWorkspace | null;
  members: FinanceMember[];
  error: string;
  inviteEmail: string;
  inviteRole: FinanceMember["role"];
  inviting: boolean;
  onInviteEmailChange: (value: string) => void;
  onInviteRoleChange: (value: FinanceMember["role"]) => void;
  onInvite: (event: React.FormEvent) => void;
  onRemove: (member: FinanceMember) => void;
}) {
  if (!workspace) {
    return (
      <div className="grid min-h-[60vh] place-items-center p-8">
        <div className="max-w-md rounded-xl border border-neutral-800 bg-neutral-900/50 p-8 text-center">
          <Users className="mx-auto mb-4 h-10 w-10 text-yellow-400" />
          <h3 className="text-lg font-bold text-white">No finance project selected</h3>
          <p className="mt-2 text-sm text-white/45">Select a finance project before managing members.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 p-6 animate-in fade-in zoom-in-95 duration-300">
      <section className="rounded-xl border border-neutral-800 bg-neutral-900/45 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="dd-label-muted">Finance Project Settings</p>
            <h3 className="mt-1 text-xl font-bold text-white">{workspace.name}</h3>
            <p className="mt-2 text-sm text-neutral-400">Invite teammates and manage finance workspace access.</p>
          </div>
          <div className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs font-semibold text-neutral-400">
            {workspace.id}
          </div>
        </div>

        {error && (
          <div className="mt-5 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <form onSubmit={onInvite} className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-[1fr_180px_auto]">
          <input
            type="email"
            value={inviteEmail}
            onChange={(event) => onInviteEmailChange(event.target.value)}
            placeholder="teammate@example.com"
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none placeholder:text-neutral-600 focus:border-yellow-400/60"
            required
          />
          <select
            value={inviteRole}
            onChange={(event) => onInviteRoleChange(event.target.value as FinanceMember["role"])}
            className="rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2.5 text-sm text-white outline-none focus:border-yellow-400/60"
          >
            <option value="Accountant">Full access</option>
          </select>
          <button type="submit" disabled={inviting} className="dd-btn-primary">
            {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Invite
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-neutral-800 bg-neutral-900/45 p-6">
        <div className="mb-4 flex items-center justify-between">
          <h4 className="flex items-center gap-2 text-sm font-bold text-white">
            <Users className="h-4 w-4 text-yellow-400" />
            Members
          </h4>
          <span className="rounded-full border border-neutral-800 bg-neutral-950 px-3 py-1 text-xs font-bold text-neutral-400">
            {members.length}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-800 p-8 text-center text-sm text-neutral-400">
            No members found.
          </div>
        ) : (
          <div className="divide-y divide-neutral-800 overflow-hidden rounded-xl border border-neutral-800">
            {members.map((member) => (
              <div key={member.id} className="flex items-center justify-between gap-4 bg-neutral-950/50 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{member.display_name || member.email || member.invited_email || "Pending member"}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{member.role} - {member.status}</p>
                </div>
                {member.role !== "Owner" && (
                  <button
                    onClick={() => onRemove(member)}
                    className="rounded-md p-2 text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function FinanceWorkspaceCreateModal({
  name,
  creating,
  importing,
  error,
  onNameChange,
  onClose,
  onSubmit,
  onImport,
}: {
  name: string;
  creating: boolean;
  importing: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onClose: () => void;
  onSubmit: (event: React.FormEvent) => void;
  onImport: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900 shadow-2xl">
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950/50 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-white">Create Finance Project</h2>
            <p className="mt-0.5 text-sm text-neutral-400">Create a shared finance workspace or import a DawnDesk JSON export.</p>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5 p-6">
          {error && (
            <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-relaxed text-red-200">
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium text-neutral-300">Project Name</label>
            <input
              value={name}
              onChange={(event) => onNameChange(event.target.value)}
              placeholder="e.g. Company Finance"
              className="w-full rounded-lg border border-neutral-800 bg-neutral-950 px-4 py-2.5 text-sm text-white outline-none transition-all placeholder:text-neutral-600 focus:border-yellow-400 focus:ring-1 focus:ring-yellow-400"
              autoFocus
              required
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onImport}
              disabled={importing || creating}
              className="rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-60"
              title="Create from JSON"
            >
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            </button>
            <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-neutral-700 px-4 py-2.5 text-sm font-medium text-neutral-300 transition-colors hover:bg-neutral-800 hover:text-white">
              Cancel
            </button>
            <button type="submit" disabled={creating || !name.trim()} className="dd-btn-primary flex-1">
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
