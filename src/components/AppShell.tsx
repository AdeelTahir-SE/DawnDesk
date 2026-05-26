import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { useAppLogger } from "../utils/LoggerContext";

export default function AppShell() {
  const [showItems, setShowItems] = useState(true);
  const location = useLocation();
  const { logInfo } = useAppLogger();

  useEffect(() => {
    logInfo('Navigation', `Navigated to ${location.pathname}`);
  }, [location.pathname, logInfo]);

  return (
    <div className="min-h-screen bg-neutral-950 text-white">
      <Navbar />
      <Sidebar
        showItems={showItems}
        onToggleItems={() => setShowItems((prev) => !prev)}
      />

      <main
        className={`pt-16 pl-20 transition-all duration-300 ${
          showItems ? "md:pl-44" : "md:pl-20"
        }`}
      >
        {/* decide padding of outlet in here */}
        <div className=""> 
          <Outlet />
        </div>
      </main>
    </div>
  );
}