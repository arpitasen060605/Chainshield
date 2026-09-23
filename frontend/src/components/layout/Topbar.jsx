import { Bell, Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CS";

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
  };

  return (
    <header className="topbar">
      <button className="icon-button mobile-menu" onClick={onMenu} aria-label="Open navigation menu">
        <Menu size={21} />
      </button>

      <div className="topbar-spacer" />

      <button
        className="icon-button notification"
        onClick={() => navigate("/audit-logs")}
        title="View Audit Telemetry Notifications"
        aria-label="View Audit Telemetry"
      >
        <Bell size={20} />
        <span>3</span>
      </button>

      <div
        className="top-profile"
        onClick={() => navigate("/profile")}
        title={`Logged in as ${user?.name || "Investigator"} (${user?.email || ""})`}
      >
        <div className="user-avatar">{initials}</div>
        <span className="top-profile-name">{user?.name || "Investigator"}</span>
        <ChevronDown size={16} />
      </div>

      <button
        onClick={handleLogout}
        className="logout-button"
        title="Sign Out"
        aria-label="Sign Out"
      >
        <LogOut size={18} />
      </button>
    </header>
  );
}