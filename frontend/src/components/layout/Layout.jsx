import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-shell">
      <div
        className={mobileOpen ? "mobile-overlay show" : "mobile-overlay"}
        onClick={() => setMobileOpen(false)}
      />
      <div className={mobileOpen ? "sidebar-wrap open" : "sidebar-wrap"}>
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>
      <div className="main-area">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="dashboard">{children}</main>
      </div>
    </div>
  );
}
