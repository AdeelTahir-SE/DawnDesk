import { NavLink } from "react-router-dom";
import { 
    X, 
    Menu, 
    LayoutDashboard, 
    Terminal, 
    FolderKanban, 
    Image as ImageIcon, 
    Video, 
    Wrench, 
    Settings,
    LineChart,
    StickyNote,
    // Workflow,
    AtSign,
    Bell,
    Check,
    Loader2,
    XCircle
} from "lucide-react";

type SidebarProps = {
    showItems: boolean;
    onToggleItems: () => void;
};

import { useAppLogger } from "../utils/LoggerContext";
import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured } from "../lib/supabaseClient";
import {
    acceptWorkspaceInvite,
    declineWorkspaceInvite,
    formatSupabaseError,
    listPendingWorkspaceInvites,
    listWorkspaceNotifications,
    markWorkspaceNotificationRead,
    type WorkspaceInviteAlert,
    type WorkspaceNotificationAlert,
} from "../lib/workspaceSync";

export default function Sidebar({ showItems, onToggleItems }: SidebarProps) {
    const { logInfo, logSuccess, logError } = useAppLogger();
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);
    const [invites, setInvites] = useState<WorkspaceInviteAlert[]>([]);
    const [notifications, setNotifications] = useState<WorkspaceNotificationAlert[]>([]);
    const [alertsLoading, setAlertsLoading] = useState(false);
    const [alertsError, setAlertsError] = useState("");
    const [activeInviteId, setActiveInviteId] = useState<string | null>(null);
    const [activeNotificationId, setActiveNotificationId] = useState<string | null>(null);
    const alertCount = invites.length + notifications.length;

    const loadAlerts = useCallback(async () => {
        if (!isSupabaseConfigured) {
            setInvites([]);
            setNotifications([]);
            setAlertsError("");
            return;
        }

        setAlertsLoading(true);
        setAlertsError("");
        try {
            const [nextInvites, nextNotifications] = await Promise.all([
                listPendingWorkspaceInvites(),
                listWorkspaceNotifications(),
            ]);
            setInvites(nextInvites);
            setNotifications(nextNotifications);
        } catch (error) {
            setAlertsError(formatSupabaseError(error));
        } finally {
            setAlertsLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadAlerts();
    }, [loadAlerts]);

    const handleToggle = () => {
        logInfo('Sidebar', `Sidebar ${showItems ? 'collapsed' : 'expanded'}`);
        onToggleItems();
    };

    const handleOpenAlerts = () => {
        setIsAlertsOpen(true);
        void loadAlerts();
    };

    const handleAcceptInvite = async (invite: WorkspaceInviteAlert) => {
        setActiveInviteId(invite.invite_id);
        setAlertsError("");
        try {
            await acceptWorkspaceInvite(invite);
            logSuccess("Invite accepted", `${invite.resource_name} is now available.`, {
                source: invite.invite_type === "finance" ? "finance" : "project-manager",
            });
            await loadAlerts();
        } catch (error) {
            const message = formatSupabaseError(error);
            setAlertsError(message);
            logError("Invite accept failed", message, { source: "settings" });
        } finally {
            setActiveInviteId(null);
        }
    };

    const handleDeclineInvite = async (invite: WorkspaceInviteAlert) => {
        setActiveInviteId(invite.invite_id);
        setAlertsError("");
        try {
            await declineWorkspaceInvite(invite);
            logInfo("Invite declined", invite.resource_name, {
                source: invite.invite_type === "finance" ? "finance" : "project-manager",
            });
            await loadAlerts();
        } catch (error) {
            const message = formatSupabaseError(error);
            setAlertsError(message);
            logError("Invite decline failed", message, { source: "settings" });
        } finally {
            setActiveInviteId(null);
        }
    };

    const handleDismissNotification = async (notification: WorkspaceNotificationAlert) => {
        setActiveNotificationId(notification.id);
        setAlertsError("");
        try {
            await markWorkspaceNotificationRead(notification.id);
            await loadAlerts();
        } catch (error) {
            const message = formatSupabaseError(error);
            setAlertsError(message);
            logError("Alert dismiss failed", message, { source: "settings" });
        } finally {
            setActiveNotificationId(null);
        }
    };

    return (
        <aside
            className={`fixed top-16 left-0 bottom-0 z-20 w-20 border-r border-neutral-800 bg-neutral-900 p-4 block transition-all duration-300 ${
                showItems ? "md:w-44" : "md:w-20"
            }`}
        >
            <div className="mb-4 flex flex-row items-center justify-center w-full gap-6 ">
                <div className={`text-xs uppercase tracking-[0.18em] text-white/40 ${showItems ? "hidden md:block" : "hidden"}`}>
                    Workspace
                </div>
                <button
                    aria-label={showItems ? "Hide items" : "Show items"}
                    className="hidden md:inline-flex p-2 rounded-md hover:bg-neutral-800/70 text-white transition-colors duration-150"
                    onClick={handleToggle}
                    type="button"
                >
                    {showItems ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>
            <nav className="flex flex-col items-start justify-center space-y-2">
                <SidebarLink icon={LayoutDashboard} label="Dashboard" to="/dashboard" showItems={showItems} />
                <SidebarLink icon={Terminal} label="Prompts" to="/prompts" showItems={showItems} />
                <SidebarLink icon={FolderKanban} label="Projects" to="/project-manager" showItems={showItems} />
                <SidebarLink icon={ImageIcon} label="Photo Editor" to="/photo-editor" showItems={showItems} />
                <SidebarLink icon={Video} label="Video Editor" to="/video-editor" showItems={showItems} />
                <SidebarLink icon={LineChart} label="Finance" to="/finance" showItems={showItems} />
                <SidebarLink icon={StickyNote} label="Notes" to="/notes" showItems={showItems} />
                {/* Temporarily hidden for v1 release. Restore after workflow polish resumes. */}
                {/* <SidebarLink icon={Workflow} label="Workflow" to="/workflow" showItems={showItems} /> */}
                <SidebarLink icon={Wrench} label="Dev Tools" to="/dev-tools" showItems={showItems} />
                <SidebarLink icon={Settings} label="Settings" to="/settings" showItems={showItems} />
                <button
                    type="button"
                    onClick={handleOpenAlerts}
                    className={`flex flex-row items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-neutral-800/70 hover:text-white gap-4 ${showItems ? "md:justify-start" : "md:justify-center"}`}
                >
                    <span className="relative">
                        <Bell className="h-5 w-5 text-white/70" />
                        {alertCount > 0 && (
                            <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-yellow-400 px-1 text-[10px] font-black leading-none text-black">
                                {alertCount}
                            </span>
                        )}
                    </span>
                    <span className={showItems ? "hidden md:inline" : "hidden"}>Alerts</span>
                </button>
            </nav>
            {isAlertsOpen && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
                    <section className="w-full max-w-md overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 shadow-2xl shadow-black/60">
                        <header className="flex items-start justify-between gap-4 border-b border-neutral-800 px-5 py-4">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.22em] text-yellow-300">Alerts</p>
                                <h2 className="mt-1 text-xl font-bold text-white">Workspace alerts</h2>
                                <p className="mt-2 text-sm leading-6 text-white/55">
                                    Invites, declined invitations, and @mentions from projects and finance workspaces appear here.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsAlertsOpen(false)}
                                className="rounded-lg p-2 text-white/45 transition-colors hover:bg-neutral-900 hover:text-white"
                            >
                                <XCircle className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="p-5">
                            {alertsError && (
                                <div className="mb-4 rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-200">
                                    {alertsError}
                                </div>
                            )}

                            {alertsLoading ? (
                                <div className="grid min-h-36 place-items-center rounded-xl border border-neutral-800 bg-neutral-900/45">
                                    <Loader2 className="h-6 w-6 animate-spin text-white/45" />
                                </div>
                            ) : alertCount === 0 ? (
                                <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/45 p-5 text-center">
                                    <Bell className="mx-auto h-8 w-8 text-yellow-300" />
                                    <h3 className="mt-3 text-sm font-bold text-white">No alerts yet</h3>
                                    <p className="mt-2 text-sm leading-6 text-white/50">
                                        Invitations, declined invite notices, and comment mentions will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="max-h-[55vh] space-y-3 overflow-y-auto pr-1 custom-scrollbar">
                                    {notifications.map((notification) => {
                                        const isBusy = activeNotificationId === notification.id;
                                        const isMention = notification.alert_type === "mention";
                                        const isFinance = notification.resource_type === "finance";
                                        return (
                                            <article
                                                key={`notification-${notification.id}`}
                                                className="rounded-xl border border-neutral-800 bg-neutral-900/55 p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-yellow-300">
                                                        {isMention ? <AtSign className="h-5 w-5" /> : isFinance ? <LineChart className="h-5 w-5" /> : <FolderKanban className="h-5 w-5" />}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                                                            {isMention ? "Mention" : "Invite declined"} - {isFinance ? "Finance" : "Project"}
                                                        </p>
                                                        <h3 className="mt-1 line-clamp-2 text-sm font-bold text-white">
                                                            {notification.title}
                                                        </h3>
                                                        <p className="mt-1 truncate text-xs font-semibold text-yellow-300/80">
                                                            {notification.resource_name}{notification.section ? ` / ${notification.section}` : ""}
                                                        </p>
                                                        <p className="mt-2 line-clamp-3 text-xs leading-5 text-white/55">
                                                            {notification.body}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 flex justify-end">
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => void handleDismissNotification(notification)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-bold text-white/65 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
                                                    >
                                                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        Dismiss
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                    {invites.map((invite) => {
                                        const isBusy = activeInviteId === invite.invite_id;
                                        const isFinance = invite.invite_type === "finance";
                                        return (
                                            <article
                                                key={`${invite.invite_type}-${invite.invite_id}`}
                                                className="rounded-xl border border-neutral-800 bg-neutral-900/55 p-4"
                                            >
                                                <div className="flex items-start gap-3">
                                                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-neutral-800 bg-neutral-950 text-yellow-300">
                                                        {isFinance ? <LineChart className="h-5 w-5" /> : <FolderKanban className="h-5 w-5" />}
                                                    </span>
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/40">
                                                            {isFinance ? "Finance invite" : "Project invite"}
                                                        </p>
                                                        <h3 className="mt-1 truncate text-sm font-bold text-white">
                                                            {invite.resource_name}
                                                        </h3>
                                                        <p className="mt-1 text-xs leading-5 text-white/50">
                                                            Role: <span className="font-semibold text-white/70">{invite.role}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-2">
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => void handleDeclineInvite(invite)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-neutral-700 px-3 py-2 text-xs font-bold text-white/65 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                        Decline
                                                    </button>
                                                    <button
                                                        type="button"
                                                        disabled={isBusy}
                                                        onClick={() => void handleAcceptInvite(invite)}
                                                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-yellow-400 px-3 py-2 text-xs font-black text-black transition-colors hover:bg-yellow-300 disabled:opacity-50"
                                                    >
                                                        {isBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                        Accept
                                                    </button>
                                                </div>
                                            </article>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            )}
        </aside>
    );
}

function SidebarLink({
    icon: Icon,
    label,
    to,
    showItems,
}: {
    icon: React.ElementType;
    label: string;
    to: string;
    showItems: boolean;
}) {
    return(
        <NavLink
            className={({ isActive }) =>
                `flex flex-row items-center justify-start rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                        ? "bg-neutral-800 text-yellow-300"
                        : "text-white/80 hover:bg-neutral-800/70 hover:text-white"
                } gap-4 ${showItems ? "md:justify-start" : "md:justify-center"}`
            }
            to={to}
        >
            {({ isActive }) => (
                <>
                    <Icon className={`h-5 w-5 ${isActive ? "text-yellow-300" : "text-white/70"}`} />
                    <span className={showItems ? "hidden md:inline" : "hidden"}>{label}</span>
                </>
            )}
        </NavLink>
    );
}
