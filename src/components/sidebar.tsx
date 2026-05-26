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
    StickyNote
} from "lucide-react";

type SidebarProps = {
    showItems: boolean;
    onToggleItems: () => void;
};

export default function Sidebar({ showItems, onToggleItems }: SidebarProps) {

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
                    onClick={onToggleItems}
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
                <SidebarLink icon={Wrench} label="Dev Tools" to="/dev-tools" showItems={showItems} />
                <SidebarLink icon={Settings} label="Settings" to="/settings" showItems={showItems} />
            </nav>
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