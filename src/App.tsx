import "./App.css";
import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import PhotoEditor from "./Pages/PhotoEditor";
import Settings from "./Pages/Settings";
import VideoEditor from "./Pages/VideoEditor";
import AI from "./Pages/AI";
import Storage from "./Pages/Storage";
import Loading from "./Pages/Loading";
import PDFTools from "./Pages/PDFTools";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/*" element={<AppShell />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="photo-editor" element={<PhotoEditor />} />
        <Route path="video-editor" element={<VideoEditor />} />
        <Route path="ai" element={<AI />} />
        <Route path="storage" element={<Storage />} />
        <Route path="settings" element={<Settings />} />
          <Route path="pdf-tools" element={<PDFTools />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default App;
