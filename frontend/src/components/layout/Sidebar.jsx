import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Shield,
  Folder,
  CircleCheck,
  FileText,
  Users,
  UserRound,
  Settings,
  ChevronDown,
  Sparkles,
  LogOut,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const buildNavGroups = (roleInput) => {
  const role = String(roleInput || "").trim().toLowerCase();

  if (role === "platform_admin") {
    return [
      {
        title: "PLATFORM MANAGEMENT",
        items: [
          { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
          { label: "Companies", icon: Users, path: "/platform/companies" },
        ],
      },
      {
        title: "SYSTEM",
        items: [
          { label: "Settings", icon: Settings, path: "/settings" },
        ],
      },
    ];
  }

  const isAdmin = role === "company_admin" || role === "admin";
  const isIR = role === "incident_responder";
  const isLead = role === "lead_investigator";
  const isForensic = role === "forensic_analyst";
  const isAuditor = role === "auditor";
  return [
    { title: "DASHBOARD", items: [{ label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" }] },
    { title: "OPERATIONS", items: [
      { label: "Incidents", icon: Shield, path: "/incidents", children: [
        { label: "All Incidents", path: "/incidents" },
        ...((isIR || isLead || isAdmin) ? [{ label: "Create Incident", path: "/incidents/create" }] : []),
      ] },
      { label: "Evidence", icon: Folder, path: "/evidence", children: [
        { label: "All Evidence", path: "/evidence" },
        ...((isIR || isForensic || isLead || isAdmin) ? [{ label: "Upload Evidence", path: "/evidence/upload" }] : []),
      ] },
      ...((isForensic || isAuditor || isLead || isAdmin) ? [{ label: "Verification", icon: CircleCheck, path: "/verification", children: [{ label: "Verify Evidence", path: "/verification" }, { label: "Verification History", path: "/verification/history" }] }] : []),
    ] },
    { title: "ACTIVITY", items: [{ label: "Audit Logs", icon: FileText, path: "/audit-logs" }] },
    { title: "OUTPUT", items: [{ label: "Reports", icon: Sparkles, path: "/reports", ai: true }] },
    ...(isAdmin ? [{ title: "ADMINISTRATION", items: [{ label: "Employees & Roles", icon: Users, path: "/users" }, { label: "Settings", icon: Settings, path: "/settings" }] }] : [{ title: "ACCOUNT", items: [{ label: "Settings", icon: Settings, path: "/settings" }] }]),
  ];
};

export default function Sidebar({ onNavigate }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const currentUser = user;
  const effectiveRole = currentUser?.role;
  const navGroups = useMemo(() => buildNavGroups(effectiveRole), [effectiveRole]);

  const initials = currentUser?.name
    ? currentUser.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "CS";

  const [openSection, setOpenSection] = useState(null);

  useEffect(() => {
    if (location.pathname.startsWith("/incidents")) {
      setOpenSection("Incidents");
    } else if (location.pathname.startsWith("/evidence")) {
      setOpenSection("Evidence");
    } else if (location.pathname.startsWith("/verification")) {
      setOpenSection("Verification");
    } else {
      setOpenSection(null);
    }
  }, [location.pathname]);

  const handleParentClick = (item) => {
    if (item.children && item.children.length > 0) {
      const isCurrentlyOpen = openSection === item.label;
      setOpenSection(isCurrentlyOpen ? null : item.label);
    } else if (item.path && item.path !== "#") {
      navigate(item.path);
      if (onNavigate) onNavigate();
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/", { replace: true });
    if (onNavigate) onNavigate();
  };

  return (
    <aside className="sidebar">
      <div
        className="brand"
        onClick={() => {
          navigate("/dashboard");
          if (onNavigate) onNavigate();
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="brand-mark">
          <Shield size={27} strokeWidth={2.4} />
        </div>
        <div>
          <div className="brand-name">ChainShield</div>
          <div className="brand-tag">Secure. Verify. Trust.</div>
        </div>
      </div>

      <nav className="side-nav">
        {navGroups.map((group) => (
          <div key={group.title} className="nav-section">
            <div className="nav-section-label">{group.title}</div>
            <div className="nav-section-items">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isPathActive =
                  item.path &&
                  item.path !== "/" &&
                  (location.pathname === item.path ||
                    location.pathname.startsWith(item.path) ||
                    (item.path === "/dashboard" && location.pathname === "/platform"));
                const isOpen = openSection === item.label;
                const hasChildren = item.children && item.children.length > 0;

                return (
                  <div key={item.label} className="nav-group-item">
                    <div
                      className={`nav-item ${isPathActive ? "active" : ""}`}
                      onClick={() => handleParentClick(item)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="nav-item-icon">
                        <Icon size={18} />
                      </span>
                      <span className="nav-item-label">{item.label}</span>
                      {item.ai && <span className="ai-pill">AI</span>}

                      {hasChildren && (
                        <ChevronDown
                          className={`nav-chevron ${isOpen ? "nav-chevron-open" : ""}`}
                          size={15}
                        />
                      )}
                    </div>

                    {hasChildren && isOpen && (
                      <div className="sub-nav">
                        {item.children.map((child) => {
                          const isChildActive = location.pathname === child.path;

                          return (
                            <div
                              key={child.label}
                              className={`sub-item ${isChildActive ? "active" : ""}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (child.path && child.path !== "#") {
                                  navigate(child.path);
                                  if (onNavigate) onNavigate();
                                }
                              }}
                              style={{ cursor: "pointer" }}
                            >
                              {child.label}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div
          className="profile-mini"
          onClick={() => {
            navigate("/profile");
            if (onNavigate) onNavigate();
          }}
          style={{ cursor: "pointer" }}
        >
          <div className="avatar">{initials}</div>
          <div className="profile-copy">
            <strong>{currentUser?.name || "Investigator"}</strong>
            <span>
              <i /> Profile
            </span>
          </div>
          <ChevronDown size={15} />
        </div>

        <button className="sidebar-logout" onClick={handleLogout} type="button">
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}