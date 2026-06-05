import { Download, Loader2, Maximize2, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { checkForAppUpdate, installAvailableAppUpdate, type AppUpdateInfo } from "../lib/appUpdater";

type UpdateDownloadEvent = {
    event?: string;
    data?: {
        chunkLength?: number;
        contentLength?: number;
    };
};

function formatBytes(bytes: number) {
    if (!Number.isFinite(bytes) || bytes <= 0) return "0 MB";
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

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
    const [updateStatus, setUpdateStatus] = useState("Preparing update...");
    const [downloadedBytes, setDownloadedBytes] = useState(0);
    const [totalBytes, setTotalBytes] = useState<number | null>(null);

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
        setUpdateStatus("Preparing update...");
        setDownloadedBytes(0);
        setTotalBytes(null);
        try {
            const installed = await installAvailableAppUpdate((event) => {
                const updateEvent = event as UpdateDownloadEvent;
                if (updateEvent.event === "Started") {
                    setDownloadedBytes(0);
                    setTotalBytes(updateEvent.data?.contentLength ?? null);
                    setUpdateStatus("Downloading update...");
                    return;
                }

                if (updateEvent.event === "Progress") {
                    const chunkLength = updateEvent.data?.chunkLength ?? 0;
                    setDownloadedBytes((current) => current + chunkLength);
                    setUpdateStatus("Downloading update...");
                    return;
                }

                if (updateEvent.event === "Finished") {
                    setUpdateStatus("Installing update...");
                }
            });
            if (!installed) {
                setAvailableUpdate(null);
                setIsUpdating(false);
            }
        } catch (error) {
            console.error("Failed to install DawnDesk update", error);
            setUpdateStatus("Update failed. You can try again.");
            setIsUpdating(false);
        }
    };

    const updateProgress =
        totalBytes && totalBytes > 0
            ? Math.min(100, Math.round((downloadedBytes / totalBytes) * 100))
            : null;

    return (
        <>
            {isUpdating && (
                <div
                    className="fixed inset-0 flex items-center justify-center px-6 text-white"
                    style={{ backgroundColor: "#000", zIndex: 2147483647 }}
                    role="alertdialog"
                    aria-modal="true"
                    aria-busy="true"
                    aria-labelledby="dawndesk-update-title"
                    aria-describedby="dawndesk-update-status"
                >
                    <div className="flex w-full max-w-md flex-col items-center text-center">
                        <Loader2 className="mb-7 h-12 w-12 animate-spin text-yellow-400" />
                        <h1 id="dawndesk-update-title" className="font-heading text-3xl font-black tracking-tight text-white">
                            Updating DawnDesk...
                        </h1>
                        <p id="dawndesk-update-status" className="mt-4 text-sm font-semibold text-white/70">
                            {updateStatus}
                        </p>
                        {updateProgress !== null && (
                            <div className="mt-7 w-full" aria-label={`Update download is ${updateProgress}% complete`}>
                                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                                    <div
                                        className="h-full rounded-full bg-yellow-400 transition-[width] duration-300"
                                        style={{ width: `${updateProgress}%` }}
                                    />
                                </div>
                                <div className="mt-3 flex items-center justify-between text-xs font-semibold text-white/45">
                                    <span>{updateProgress}%</span>
                                    <span>
                                        {formatBytes(downloadedBytes)} / {formatBytes(totalBytes ?? 0)}
                                    </span>
                                </div>
                            </div>
                        )}
                        <p className="mt-7 max-w-sm text-xs leading-6 text-white/45">
                            Please keep DawnDesk open. The app may restart automatically when the installation is complete.
                        </p>
                    </div>
                </div>
            )}
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
        </>
    );
}
