
import { Maximize2, Minimize2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar({
    isFullscreen = false,
    onToggleFullscreen,
}: {
    isFullscreen?: boolean;
    onToggleFullscreen?: () => void;
}) {
    const [theme, setTheme] = useState(() => localStorage.getItem("dawndesk_theme") || "dark");

    useEffect(() => {
        const isLight = theme === "light";
        document.documentElement.classList.toggle("light", isLight);
        document.documentElement.classList.toggle("dark", !isLight);
        localStorage.setItem("dawndesk_theme", theme);
        window.dispatchEvent(new CustomEvent("dawndesk_theme_changed", { detail: { theme } }));
    }, [theme]);

    useEffect(() => {
        const refreshTheme = () => setTheme(localStorage.getItem("dawndesk_theme") || "dark");
        window.addEventListener("storage", refreshTheme);
        window.addEventListener("dawndesk_theme_changed", refreshTheme);
        return () => {
            window.removeEventListener("storage", refreshTheme);
            window.removeEventListener("dawndesk_theme_changed", refreshTheme);
        };
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                <div className="text-xl font-bold tracking-wide text-yellow-400">DawnDesk</div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={onToggleFullscreen}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:text-white"
                        aria-label={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
                        title={isFullscreen ? "Exit fullscreen" : "Open fullscreen"}
                    >
                        {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                        <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Fullscreen"}</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => setTheme((current) => current === "light" ? "dark" : "light")}
                        className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:text-white"
                        aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                    >
                        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                        <span className="hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
                    </button>
                </div>
            </div>
        </header>
    );
}
