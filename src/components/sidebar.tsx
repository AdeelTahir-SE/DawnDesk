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
    Workflow,
    Bell,
    XCircle
} from "lucide-react";

type SidebarProps = {
    showItems: boolean;
    onToggleItems: () => void;
};

import { useAppLogger } from "../utils/LoggerContext";
import { useState } from "react";

export default function Sidebar({ showItems, onToggleItems }: SidebarProps) {
    const { logInfo } = useAppLogger();
    const [isAlertsOpen, setIsAlertsOpen] = useState(false);

    const handleToggle = () => {
        logInfo('Sidebar', `Sidebar ${showItems ? 'collapsed' : 'expanded'}`);
        onToggleItems();
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
                <SidebarLink icon={Workflow} label="Workflow" to="/workflow" showItems={showItems} />
                <SidebarLink icon={Wrench} label="Dev Tools" to="/dev-tools" showItems={showItems} />
                <SidebarLink icon={Settings} label="Settings" to="/settings" showItems={showItems} />
                <button
                    type="button"
                    onClick={() => setIsAlertsOpen(true)}
                    className={`flex flex-row items-center justify-start rounded-md px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-neutral-800/70 hover:text-white gap-4 ${showItems ? "md:justify-start" : "md:justify-center"}`}
                >
                    <span className="relative">
                        <Bell className="h-5 w-5 text-white/70" />
                        <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-yellow-400" />
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
                                <h2 className="mt-1 text-xl font-bold text-white">Mention notifications</h2>
                                <p className="mt-2 text-sm leading-6 text-white/55">
                                    When someone mentions you in a project or finance comment, you will see it here with the person who mentioned you and the section where it happened.
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
                            <div className="rounded-xl border border-dashed border-neutral-800 bg-neutral-900/45 p-5 text-center">
                                <Bell className="mx-auto h-8 w-8 text-yellow-300" />
                                <h3 className="mt-3 text-sm font-bold text-white">No alerts yet</h3>
                                <p className="mt-2 text-sm leading-6 text-white/50">
                                    You are mentioned here by that person when someone uses your @name. Other DawnDesk notifications will appear here too.
                                </p>
                            </div>
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
