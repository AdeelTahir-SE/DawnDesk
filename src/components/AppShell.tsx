import { useCallback, useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { Minimize2 } from "lucide-react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

export default function AppShell() {
  const [showItems, setShowItems] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const syncFullscreenState = useCallback(async () => {
    let nextIsFullscreen = Boolean(document.fullscreenElement);
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      nextIsFullscreen = nextIsFullscreen || await getCurrentWindow().isFullscreen();
    } catch {
      // Browser fallback only.
    }
    setIsFullscreen(nextIsFullscreen);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    const next = !isFullscreen;
    try {
      const { getCurrentWindow } = await import("@tauri-apps/api/window");
      await getCurrentWindow().setFullscreen(next);
      setIsFullscreen(next);
      return;
    } catch {
      if (next && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
        return;
      }
      if (!next && document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  }, [isFullscreen]);

  useEffect(() => {
    void syncFullscreenState();
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, [syncFullscreenState]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {!isFullscreen && (
        <>
          <Navbar isFullscreen={isFullscreen} onToggleFullscreen={toggleFullscreen} />
          <Sidebar
            showItems={showItems}
            onToggleItems={() => setShowItems((prev) => !prev)}
          />
        </>
      )}

      <main
        className={isFullscreen
          ? "min-h-screen transition-all duration-300"
          : `pt-16 pl-20 transition-all duration-300 ${showItems ? "md:pl-44" : "md:pl-20"}`
        }
      >
        {/* decide padding of outlet in here */}
        <div className=""> 
          <Outlet />
        </div>
      </main>

      {isFullscreen && (
        <button
          type="button"
          onClick={() => void toggleFullscreen()}
          className="fixed right-4 top-4 z-[200] inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-950/90 px-3 py-2 text-sm font-bold text-white/75 shadow-2xl shadow-black/40 backdrop-blur transition-colors hover:bg-neutral-900 hover:text-white"
          title="Exit fullscreen"
        >
          <Minimize2 className="h-4 w-4" />
          Exit Fullscreen
        </button>
      )}
    </div>
  );
}
