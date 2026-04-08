import { Outlet } from "react-router-dom";
import Navbar from "./navbar";
import Sidebar from "./sidebar";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <Sidebar />

      <main className="pt-16 md:pl-20 lg:pl-64">
        <div className="p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}