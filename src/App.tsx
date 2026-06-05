import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import AuthChoice from "./Pages/AuthChoice";
import PhotoEditor from "./Pages/PhotoEditor";
import Settings from "./Pages/Settings";
import VideoEditor from "./Pages/VideoEditor";
// import Loading from "./Pages/Loading";
import PromptManager from "./Pages/PromptManager";
import ProjectManager from "./Pages/ProjectManager";
import DevTools from "./Pages/DevTools";
import FinanceManager from "./Pages/FinanceManager";
import NotesApp from "./Pages/NotesApp";
import RequireGoogleAuth from "./components/RequireGoogleAuth";
// Temporarily disabled for v1 release. Restore this import with the /workflow route below.
// import WorkflowBuilder from "./Pages/WorkflowBuilder";
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAppLogger } from "./utils/LoggerContext";
import { CONNECTION_ERROR_EVENT, type ConnectionErrorDetail } from "./lib/connectionErrors";
import { getInitialDesktopAuthUrl, handleDesktopAuthUrl, listenForDesktopAuthUrl } from "./lib/desktopAuth";

function NavigationLogger() {
  const location = useLocation();
  const { logInfo } = useAppLogger();

  useEffect(() => {
    logInfo("Navigation", `Navigated to ${location.pathname}`, { channel: 'navigation' });
  }, [location.pathname, logInfo]);

  return null;
}

function ThemeBootstrap() {
  useEffect(() => {
    const savedTheme = localStorage.getItem("dawndesk_theme") || "dark";
    const isLight = savedTheme === "light";
    document.documentElement.classList.toggle("light", isLight);
    document.documentElement.classList.toggle("dark", !isLight);
  }, []);

  return null;
}

function ConnectionErrorToastBridge() {
  const { logError } = useAppLogger();

  useEffect(() => {
    const handleConnectionError = (event: Event) => {
      const detail = (event as CustomEvent<ConnectionErrorDetail>).detail;
      logError("Connection error", detail?.rawMessage || "Internet connection error", {
        source: detail?.source === "finance" || detail?.source === "project-manager" ? detail.source : undefined,
      });
    };

    window.addEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
    return () => window.removeEventListener(CONNECTION_ERROR_EVENT, handleConnectionError);
  }, [logError]);

  return null;
}

function DesktopAuthCallbackBridge() {
  const navigate = useNavigate();
  const { logError, logSuccess } = useAppLogger();

  useEffect(() => {
    let isMounted = true;

    const processAuthUrl = async (url: string) => {
      try {
        const handled = await handleDesktopAuthUrl(url);
        if (handled && isMounted) {
          logSuccess("Signed in with Google", "DawnDesk cloud session is ready.", { source: "shell" });
          navigate("/dashboard", { replace: true });
        }
      } catch (error) {
        logError("Google sign-in failed", error instanceof Error ? error.message : String(error), { source: "shell" });
      }
    };

    void getInitialDesktopAuthUrl().then((url) => {
      if (url) void processAuthUrl(url);
    });

    let unlisten: (() => void) | undefined;
    void listenForDesktopAuthUrl((url) => {
      void processAuthUrl(url);
    }).then((nextUnlisten) => {
      unlisten = nextUnlisten;
    });

    return () => {
      isMounted = false;
      unlisten?.();
    };
  }, [logError, logSuccess, navigate]);

  return null;
}

function App() {
  return (
    <>
      <ThemeBootstrap />
      <NavigationLogger />
      <ConnectionErrorToastBridge />
      <DesktopAuthCallbackBridge />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<AuthChoice />} />

      <Route path="/*" element={<AppShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="photo-editor" element={<PhotoEditor />} />
        <Route path="video-editor" element={<VideoEditor />} />
        <Route path="settings" element={<Settings />} />
        <Route path="prompts" element={<PromptManager />} />
        <Route path="project-manager" element={<RequireGoogleAuth moduleName="Project Manager"><ProjectManager /></RequireGoogleAuth>} />
        <Route path="dev-tools" element={<DevTools />} />
        <Route path="finance" element={<RequireGoogleAuth moduleName="Finance Manager"><FinanceManager /></RequireGoogleAuth>} />
        <Route path="notes" element={<NotesApp />} />
        {/* Temporarily disabled for v1 release. Restore when Workflow Builder is ready again. */}
        {/* <Route path="workflow" element={<WorkflowBuilder />} /> */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;
