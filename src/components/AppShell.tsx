import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Minimize2 } from "lucide-react";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { AppToaster } from "../utils/LoggerContext";

const FULLSCREEN_SUB_APP_PATHS = new Set([
  "/photo-editor",
  "/video-editor",
  "/prompts",
  "/project-manager",
  "/dev-tools",
  "/finance",
  "/notes",
  "/workflow",
]);

const SUB_APP_LABELS: Record<string, string> = {
  "/photo-editor": "Photo Editor",
  "/video-editor": "Video Editor",
  "/prompts": "Prompt Manager",
  "/project-manager": "Project Manager",
  "/dev-tools": "Dev Tools",
  "/finance": "Finance Manager",
  "/notes": "Notes",
  "/workflow": "Workflow",
};

export default function AppShell() {
  const [showItems, setShowItems] = useState(true);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  const appContentRef = useRef<HTMLElement | null>(null);
  const location = useLocation();
  const showFullscreen = FULLSCREEN_SUB_APP_PATHS.has(location.pathname);
  const activeSubAppLabel = SUB_APP_LABELS[location.pathname] ?? "DawnDesk";

  useEffect(() => {
    const syncFullscreenState = () => {
      setIsAppFullscreen(document.fullscreenElement === appContentRef.current);
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  const openAppFullscreen = async () => {
    if (!appContentRef.current || !appContentRef.current.requestFullscreen) return;
    await appContentRef.current.requestFullscreen();
  };

  const exitAppFullscreen = async () => {
    if (document.fullscreenElement && document.exitFullscreen) {
      await document.exitFullscreen();
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      {!isAppFullscreen && (
        <>
          <Navbar showFullscreen={showFullscreen} onOpenFullscreen={() => void openAppFullscreen()} />
          <Sidebar
            showItems={showItems}
            onToggleItems={() => setShowItems((prev) => !prev)}
          />
        </>
      )}

      <main
        ref={appContentRef}
        className={
          isAppFullscreen
            ? "flex h-screen flex-col overflow-hidden bg-neutral-950 text-white"
            : `pt-16 pl-20 transition-all duration-300 ${showItems ? "md:pl-44" : "md:pl-20"}`
        }
      >
        {isAppFullscreen && (
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-neutral-800 bg-neutral-950 px-4 shadow-lg shadow-black/20">
            <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/45">{activeSubAppLabel}</span>
            <button
              type="button"
              onClick={() => void exitAppFullscreen()}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm font-bold text-white/75 transition-colors hover:bg-neutral-800 hover:text-white"
              title="Exit app fullscreen"
            >
              <Minimize2 className="h-4 w-4" />
              Exit Fullscreen
            </button>
          </div>
        )}
        {/* decide padding of outlet in here */}
        <div className={isAppFullscreen ? "min-h-0 flex-1 overflow-hidden" : ""}> 
          <Outlet />
        </div>
        <AppToaster />
        {isAppFullscreen && (
          <p className="sr-only">Press Escape to leave fullscreen.</p>
        )}
      </main>
    </div>
  );
}
