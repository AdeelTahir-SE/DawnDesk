import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <Sidebar />

      <main className="pl-64 pt-16">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}