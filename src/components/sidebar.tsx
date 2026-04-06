import { NavLink } from "react-router-dom";

export default function Sidebar() {
    const linkClass = ({ isActive }: { isActive: boolean }) =>
        [
            "block rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
            isActive
                ? "bg-yellow-400 text-neutral-900"
                : "text-white/75 hover:text-white hover:bg-white/10",
        ].join(" ");

    return (
        <aside className="fixed top-16 left-0 bottom-0 w-64 bg-neutral-900 border-r border-neutral-800 p-4 z-20">
            <div className="text-xs uppercase tracking-[0.18em] text-white/40 mb-4">Workspace</div>
            <nav className="space-y-2">
                <NavLink to="/dashboard" className={linkClass}>
                    Dashboard
                </NavLink>
            </nav>
        </aside>
    );
}