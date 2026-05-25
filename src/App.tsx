import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import PhotoEditor from "./Pages/PhotoEditor";
import PhotoEditorHelp from "./Pages/PhotoEditorHelp";
import ProjectsManager from "./Pages/ProjectsManager";
import Settings from "./Pages/Settings";
import VideoEditor from "./Pages/VideoEditor";
// import Loading from "./Pages/Loading";
import Todo from "./Pages/Todo";
import PromptManager from "./Pages/PromptManager";
import ProjectManager from "./Pages/ProjectManager";
import DevTools from "./Pages/DevTools";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/*" element={<AppShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="photo-editor" element={<PhotoEditor />} />
        <Route path="photo-editor/help" element={<PhotoEditorHelp />} />
        <Route path="projects" element={<ProjectsManager />} />
        <Route path="video-editor" element={<VideoEditor />} />
        <Route path="settings" element={<Settings />} />
        <Route path="todo" element={<Todo />} />
        <Route path="prompts" element={<PromptManager />} />
        <Route path="project-manager" element={<ProjectManager />} />
        <Route path="dev-tools" element={<DevTools />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
