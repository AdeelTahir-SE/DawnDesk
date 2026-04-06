import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                <div className="text-xl font-bold tracking-wide text-yellow-400">DawnDesk</div>

                <nav className="flex items-center gap-5 text-sm font-medium">
                    <NavLink
                        to="/dashboard"
                        className={({ isActive }) =>
                            isActive ? "text-yellow-400" : "text-white/70 hover:text-white"
                        }
                    >
                        Dashboard
                    </NavLink>
                    <NavLink to="/" className="text-white/70 hover:text-white">
                        Landing
                    </NavLink>
                </nav>
            </div>
        </header>
    );
}