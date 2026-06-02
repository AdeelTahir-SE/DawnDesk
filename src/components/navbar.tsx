import { Download, Loader2, Maximize2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { checkForAppUpdate, installAvailableAppUpdate, type AppUpdateInfo } from "../lib/appUpdater";

export default function Navbar({
    showFullscreen = false,
    onOpenFullscreen,
}: {
    showFullscreen?: boolean;
    onOpenFullscreen?: () => void;
}) {
    const [theme, setTheme] = useState(() => localStorage.getItem("dawndesk_theme") || "dark");
    const [availableUpdate, setAvailableUpdate] = useState<AppUpdateInfo | null>(null);
    const [isUpdating, setIsUpdating] = useState(false);

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

    useEffect(() => {
        let isMounted = true;
        checkForAppUpdate()
            .then((update) => {
                if (isMounted) setAvailableUpdate(update);
            })
            .catch(() => {
                if (isMounted) setAvailableUpdate(null);
            });

        return () => {
            isMounted = false;
        };
    }, []);

    const handleInstallUpdate = async () => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            const installed = await installAvailableAppUpdate();
            if (!installed) {
                setAvailableUpdate(null);
            }
        } catch (error) {
            console.error("Failed to install DawnDesk update", error);
            setIsUpdating(false);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 h-16 bg-neutral-900 border-b border-neutral-800 z-30">
            <div className="h-full px-6 flex items-center justify-between">
                <div className="text-xl font-bold tracking-wide text-yellow-400">DawnDesk</div>
                <div className="flex items-center gap-2">
                    {availableUpdate && (
                        <button
                            type="button"
                            onClick={() => void handleInstallUpdate()}
                            disabled={isUpdating}
                            className="inline-flex items-center gap-2 rounded-lg border border-yellow-400/40 bg-yellow-400 px-3 py-2 text-sm font-black text-black shadow-lg shadow-yellow-500/10 transition-colors hover:bg-yellow-300 disabled:cursor-wait disabled:opacity-70"
                            aria-label={`Install DawnDesk ${availableUpdate.version}`}
                            title={`Install DawnDesk ${availableUpdate.version}`}
                        >
                            {isUpdating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                            <span className="hidden sm:inline">{isUpdating ? "Updating..." : "Update Available"}</span>
                        </button>
                    )}
                    {showFullscreen && (
                        <button
                            type="button"
                            onClick={onOpenFullscreen}
                            className="inline-flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-2 text-sm font-bold text-white/70 transition-colors hover:text-white"
                            aria-label="Open app fullscreen"
                            title="Open app fullscreen"
                        >
                            <Maximize2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Fullscreen</span>
                        </button>
                    )}
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
