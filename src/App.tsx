import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import PhotoEditor from "./Pages/PhotoEditor";
import PhotoEditorHelp from "./Pages/PhotoEditorHelp";
import Settings from "./Pages/Settings";
import VideoEditor from "./Pages/VideoEditor";
// import Loading from "./Pages/Loading";
import PromptManager from "./Pages/PromptManager";
import ProjectManager from "./Pages/ProjectManager";
import DevTools from "./Pages/DevTools";
import FinanceManager from "./Pages/FinanceManager";
import NotesApp from "./Pages/NotesApp";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAppLogger } from "./utils/LoggerContext";

function NavigationLogger() {
  const location = useLocation();
  const { logInfo } = useAppLogger();

  useEffect(() => {
    logInfo("Navigation", `Navigated to ${location.pathname}`);
  }, [location.pathname, logInfo]);

  return null;
}

function App() {
  return (
    <>
      <NavigationLogger />
      <Routes>
        <Route path="/" element={<Home />} />

      <Route path="/*" element={<AppShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="photo-editor" element={<PhotoEditor />} />
        <Route path="photo-editor/help" element={<PhotoEditorHelp />} />
        <Route path="video-editor" element={<VideoEditor />} />
        <Route path="settings" element={<Settings />} />
        <Route path="prompts" element={<PromptManager />} />
        <Route path="project-manager" element={<ProjectManager />} />
        <Route path="dev-tools" element={<DevTools />} />
        <Route path="finance" element={<FinanceManager />} />
        <Route path="notes" element={<NotesApp />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
      </Routes>
    </>
  );
}

export default App;
