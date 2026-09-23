import { useState, useEffect } from "react";
import { Bell, Menu, ChevronDown, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAuditLogs } from "../../services/auditService";

export default function Topbar({ onMenu }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const storedUser = (() => {
    try {
      const item = localStorage.getItem("chainshield_user");
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  })();

  const currentUser = user || storedUser;
  const isPlatformAdmin = String(currentUser?.role || "").trim().toLowerCase() === "platform_admin";

  useEffect(() => {
    if (isPlatformAdmin) return;

    let isMounted = true;

    const checkNotifications = async () => {
      const lastViewed = localStorage.getItem("chainshield_audit_last_viewed");

      if (location.pathname === "/audit-logs") {
        localStorage.setItem("chainshield_audit_last_viewed", new Date().toISOString());
        if (isMounted) setUnreadCount(0);
        return;
      }

      if (!lastViewed) {
        localStorage.setItem("chainshield_audit_last_viewed", new Date().toISOString());
        if (isMounted) setUnreadCount(0);
        return;
      }

      try {
        const res = await getAuditLogs({ limit: 50 });
        if (isMounted && res && res.success && Array.isArray(res.logs)) {
          const lastViewedTime = new Date(lastViewed).getTime();
          const unreadLogs = res.logs.filter((log) => {
            const logTime = new Date(log.createdAt || log.timestamp).getTime();
            return !isNaN(logTime) && logTime > lastViewedTime;
          });
          setUnreadCount(unreadLogs.length);
        }
      } catch (err) {
        console.error("[Topbar] Notification fetch error:", err);
      }
    };

    checkNotifications();

    const interval = setInterval(checkNotifications, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [location.pathname, isPlatformAdmin]);

  const handleNotificationClick = () => {
    if (isPlatformAdmin) return;
    localStorage.setItem("chainshield_audit_last_viewed", new Date().toISOString());
    setUnreadCount(0);
    navigate("/audit-logs");
  };

  const initials = currentUser?.name
    ? currentUser.name
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

      {!isPlatformAdmin && (
        <button
          className="icon-button notification"
          onClick={handleNotificationClick}
          title="View Audit Telemetry Notifications"
          aria-label="View Audit Telemetry"
        >
          <Bell size={20} />
          {unreadCount > 0 && <span>{unreadCount}</span>}
        </button>
      )}

      <div
        className="top-profile"
        onClick={() => navigate("/profile")}
        title={`Logged in as ${currentUser?.name || "Investigator"} (${currentUser?.email || ""})`}
      >
        <div className="user-avatar">{initials}</div>
        <span className="top-profile-name">{currentUser?.name || "Investigator"}</span>
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