import { Bell, Moon, Sun, Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
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

      <button
        className="icon-button"
        onClick={toggleTheme}
        title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        aria-label="Toggle Theme"
      >
        {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
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