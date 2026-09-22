import { useState } from "react";
import Layout from "../../components/layout/Layout";
import { useTheme } from "../../context/ThemeContext";
import {
  defaultAccountSettings,
  defaultNotificationSettings,
  initialActiveSessions,
  defaultNodeSettings,
} from "../../data/mockSettingsData";
import {
  Settings as SettingsIcon,
  User,
  Bell,
  Shield,
  Key,
  Lock,
  Smartphone,
  Globe,
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  X,
  Copy,
  Check,
  Eye,
  EyeOff,
  Cpu,
  Layers,
  Sun,
  Moon,
} from "lucide-react";

import { updatePassword } from "../../services/authService";
import { getSettings, updateSettings as apiUpdateSettings } from "../../services/settingsService";
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";

export default function SettingsPage() {
  const { theme, setTheme, toggleTheme } = useTheme();
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("account");

  // State management
  const [account, setAccount] = useState(() => ({
    fullName: user?.name || defaultAccountSettings.fullName,
    email: user?.email || defaultAccountSettings.email,
    investigatorId: user?._id || user?.id || defaultAccountSettings.investigatorId,
    department: defaultAccountSettings.department,
    timezone: defaultAccountSettings.timezone,
    language: defaultAccountSettings.language,
  }));

  const [notifications, setNotifications] = useState(defaultNotificationSettings);
  const [sessions, setSessions] = useState(initialActiveSessions);
  const [nodeSettings, setNodeSettings] = useState(defaultNodeSettings);

  // Fetch real system settings from backend
  useEffect(() => {
    const fetchSystemSettings = async () => {
      try {
        const res = await getSettings();
        if (res.success && res.settings) {
          if (res.settings.notifications) {
            setNotifications(res.settings.notifications);
          }
          if (res.settings.nodeSettings) {
            setNodeSettings(res.settings.nodeSettings);
          }
          setAccount((prev) => ({
            ...prev,
            department: res.settings.department || prev.department,
            timezone: res.settings.timezone || prev.timezone,
            language: res.settings.language || prev.language,
          }));
        }
      } catch (err) {
        console.error("[Settings] Fetch settings error:", err);
      }
    };

    fetchSystemSettings();
  }, []);

  useEffect(() => {
    if (user) {
      setAccount((prev) => ({
        ...prev,
        fullName: user.name || prev.fullName,
        email: user.email || prev.email,
        investigatorId: user._id || user.id || prev.investigatorId,
      }));
    }
  }, [user]);

  // Password Change UI state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // 2FA Modal state
  const [showBackupCodesModal, setShowBackupCodesModal] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Password Strength Calculation Helper
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, label: "None", color: "bg-slate-700" };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score, label: "Weak", color: "bg-red-500" };
    if (score <= 4) return { score, label: "Strong", color: "bg-amber-400" };
    return { score, label: "Cyber Fortified", color: "bg-emerald-400" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  // Password Update Submit Handler (Connected to backend API)
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      showToast("New password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match!");
      return;
    }
    if (currentPassword === newPassword) {
      showToast("New password cannot be the same as current password.");
      return;
    }

    try {
      setPasswordLoading(true);
      const res = await updatePassword({ currentPassword, newPassword });
      if (res.success) {
        showToast(res.message || "Security Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        showToast(res.message || "Failed to update password.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Current password is incorrect";
      showToast(msg);
    } finally {
      setPasswordLoading(false);
    }
  };


  // Save Account Profile
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!account.fullName.trim() || !account.email.trim()) {
      showToast("Full name and email address are required.");
      return;
    }

    try {
      const res = await updateProfile({
        name: account.fullName,
        email: account.email,
      });

      // Also persist department, timezone, language in system settings
      await apiUpdateSettings({
        department: account.department,
        timezone: account.timezone,
        language: account.language,
      });

      if (res.success) {
        showToast(res.message || "Investigator account profile updated successfully!");
      } else {
        showToast(res.message || "Failed to update profile.");
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to update profile.";
      showToast(msg);
    }
  };

  // Save Notifications to MongoDB
  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    try {
      const res = await apiUpdateSettings({ notifications });
      if (res.success) {
        showToast("Notification rules and alert thresholds persisted to MongoDB.");
      } else {
        showToast(res.message || "Failed to save notifications.");
      }
    } catch (err) {
      console.error("[Settings] Save notifications error:", err);
      showToast(err.response?.data?.message || "Failed to save notification preferences.");
    }
  };

  // Save Node Settings to MongoDB
  const handleSaveNodeSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await apiUpdateSettings({ nodeSettings });
      if (res.success) {
        showToast("Web3 RPC & IPFS gateway configurations persisted to MongoDB.");
      } else {
        showToast(res.message || "Failed to save node settings.");
      }
    } catch (err) {
      console.error("[Settings] Save node settings error:", err);
      showToast(err.response?.data?.message || "Failed to save node configuration.");
    }
  };

  // Revoke Session
  const handleRevokeSession = (sessionId) => {
    setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    showToast(`Security session ${sessionId} revoked.`);
  };

  // Backup codes
  const mockBackupCodes = [
    "8F29-10AB-94C2",
    "3A78-[#9]-1984",
    "7B21-8842-EVD9",
    "4C12-9011-CS26",
    "9E55-2026-CIRT",
    "1D99-HASH-77A1",
  ];

  const handleCopyCodes = () => {
    navigator.clipboard.writeText(mockBackupCodes.join("\n"));
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-[#0c2440] border border-[#2b598d] text-emerald-400 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182a3f] pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <SettingsIcon size={22} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">System & Account Settings</h1>
              <span className="px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-full text-xs font-semibold font-mono">
                ChainShield v2.4
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Configure investigator security policies, notification dispatch triggers, 2FA authentication, and Web3 RPC provider endpoints.
            </p>
          </div>
        </div>

        {/* Settings Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#182b40] overflow-x-auto scrollbar-none pb-1">
          {[
            { id: "account", label: "Account Profile", icon: User },
            { id: "notifications", label: "Notification Preferences", icon: Bell },
            { id: "security", label: "Security & Auth", icon: Lock },
            { id: "node", label: "Node & Infrastructure", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition flex items-center gap-2 cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-[#091626]"
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACCOUNT SETTINGS */}
        {activeTab === "account" && (
          <form onSubmit={handleSaveAccount} className="space-y-6 animate-fade-in">
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-[#15283f] pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <User size={18} className="text-blue-400" />
                  Investigator Account Information
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Update your identity details bound to audit log signatures and digital evidence uploads.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Full Name</label>
                  <input
                    type="text"
                    value={account.fullName}
                    onChange={(e) => setAccount({ ...account, fullName: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Investigator ID (Read-only)</label>
                  <input
                    type="text"
                    value={account.investigatorId}
                    disabled
                    className="w-full bg-[#030912] border border-[#132438] rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Email Address</label>
                  <input
                    type="email"
                    value={account.email}
                    onChange={(e) => setAccount({ ...account, email: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Department / Unit</label>
                  <input
                    type="text"
                    value={account.department}
                    onChange={(e) => setAccount({ ...account, department: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Preferred Timezone</label>
                  <select
                    value={account.timezone}
                    onChange={(e) => setAccount({ ...account, timezone: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer font-mono"
                  >
                    <option value="UTC+00:00 (London)">UTC+00:00 (London)</option>
                    <option value="UTC+01:00 (Europe/Frankfurt)">UTC+01:00 (Europe/Frankfurt)</option>
                    <option value="UTC-05:00 (New York)">UTC-05:00 (New York)</option>
                    <option value="UTC+08:00 (Singapore)">UTC+08:00 (Singapore)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Interface Language</label>
                  <select
                    value={account.language}
                    onChange={(e) => setAccount({ ...account, language: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="English (US)">English (US)</option>
                    <option value="German (DE)">German (DE)</option>
                    <option value="French (FR)">French (FR)</option>
                    <option value="Japanese (JP)">Japanese (JP)</option>
                  </select>
                </div>
              </div>

              <div className="border-t border-[#15283f] pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Save Account Profile
                </button>
              </div>
            </div>

            {/* GLOBAL APPEARANCE & THEME MODE SECTION */}
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="border-b border-[#15283f] pb-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Sun size={18} className="text-amber-400" />
                  Global Appearance & Theme Mode
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Choose your preferred application color theme. Selection applies immediately across all pages and survives page reloads.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div
                  onClick={() => setTheme("dark")}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    theme === "dark"
                      ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                      : "bg-[#050f1b] border-[#1c324c] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-[#0c1a2b] border border-[#1e344d] text-amber-400">
                      <Moon size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Dark Cybersecurity Theme</div>
                      <div className="text-[11px] text-slate-400">Deep `#07111f` dark palette with high-contrast neon accents</div>
                    </div>
                  </div>
                  {theme === "dark" && <Check size={18} className="text-blue-400 shrink-0" />}
                </div>

                <div
                  onClick={() => setTheme("light")}
                  className={`p-4 rounded-xl border cursor-pointer transition flex items-center justify-between ${
                    theme === "light"
                      ? "bg-blue-600/10 border-blue-500 text-white shadow-lg shadow-blue-900/20"
                      : "bg-[#050f1b] border-[#1c324c] text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-amber-400/10 border border-amber-400/30 text-amber-500">
                      <Sun size={18} />
                    </div>
                    <div>
                      <div className="text-xs font-bold">Light Clean Theme</div>
                      <div className="text-[11px] text-slate-400">Clean slate light mode with optimized text readability and contrast</div>
                    </div>
                  </div>
                  {theme === "light" && <Check size={18} className="text-blue-400 shrink-0" />}
                </div>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: NOTIFICATION PREFERENCES */}
        {activeTab === "notifications" && (
          <form onSubmit={handleSaveNotifications} className="space-y-6 animate-fade-in">
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-[#15283f] pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Bell size={18} className="text-amber-400" />
                  Security Alert & Dispatch Preferences
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure automated alert notifications dispatched via email, EDR webhooks, or SOC console overlays.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  {
                    key: "criticalIncidentAlerts",
                    label: "Critical Severity Incident Alerts",
                    desc: "Instant notification when Critical or High severity ransomware/intrusion alerts trigger.",
                  },
                  {
                    key: "evidenceTamperAlerts",
                    label: "Evidence Tamper & SHA-256 Hash Mismatch Warnings",
                    desc: "Priority warning when audit hash fails verification against original Web Crypto digest.",
                  },
                  {
                    key: "dailyAuditDigest",
                    label: "Daily Audit Telemetry Digest",
                    desc: "Receive daily PDF summary digest of all logged system activities and user logins.",
                  },
                  {
                    key: "web3BlockAnchorNotices",
                    label: "Web3 Merkle Block Anchor Confirmations",
                    desc: "Notification when evidence Merkle proofs successfully anchor to block headers.",
                  },
                  {
                    key: "userRoleChangeAlerts",
                    label: "User Access & Role Modification Notices",
                    desc: "Alert when administrator updates user access permissions or re-issues JWT token claims.",
                  },
                ].map((item) => (
                  <div
                    key={item.key}
                    className="bg-[#050f1b] border border-[#172c44] rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5">
                      <div className="text-xs font-bold text-white">{item.label}</div>
                      <div className="text-[11px] text-slate-400">{item.desc}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setNotifications({
                          ...notifications,
                          [item.key]: !notifications[item.key],
                        })
                      }
                      className={`w-12 h-6 rounded-full p-1 transition-colors cursor-pointer shrink-0 ${
                        notifications[item.key] ? "bg-blue-600" : "bg-slate-700"
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-full bg-white transition-transform ${
                          notifications[item.key] ? "translate-x-6" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>

              <div className="border-t border-[#15283f] pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  Save Notification Preferences
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: SECURITY, PASSWORD & 2FA */}
        {activeTab === "security" && (
          <div className="space-y-8 animate-fade-in">
            {/* 1. PASSWORD CHANGE SECTION */}
            <form onSubmit={handleUpdatePassword} className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-[#15283f] pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Key size={18} className="text-purple-400" />
                  Password & Identity Authentication
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Update your authentication credentials. Enforcement requires minimum 8 characters with upper, lower, and symbols.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Current Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Password Strength Meter */}
                  {newPassword && (
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Strength:</span>
                        <span className="font-bold text-white">{passwordStrength.label}</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#050d18] rounded-full overflow-hidden flex gap-1">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 transition-all ${
                              level <= passwordStrength.score ? passwordStrength.color : "bg-slate-800"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Confirm New Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div className="border-t border-[#15283f] pt-4 flex justify-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800/50 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-2"
                >
                  {passwordLoading ? "Updating..." : "Update Security Password"}
                </button>
              </div>
            </form>

            {/* 2. TWO-FACTOR AUTHENTICATION PLACEHOLDER */}
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#15283f] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Smartphone size={18} className="text-emerald-400" />
                    <h2 className="text-base font-bold text-white">Two-Factor Authentication (2FA) Status</h2>
                    <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded">
                      TOTP Enabled
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Hardware key and TOTP Authenticator application protection is active for account <strong className="text-slate-200">{account.email}</strong>.
                  </p>
                </div>

                <button
                  onClick={() => setShowBackupCodesModal(true)}
                  className="px-4 py-2 bg-[#0e2238] hover:bg-[#163352] text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer w-fit"
                >
                  <Key size={14} /> Manage Backup Recovery Keys
                </button>
              </div>

              <div className="bg-[#050f1b] border border-[#15283f] p-4 rounded-xl flex items-center justify-between text-xs text-slate-300">
                <div className="space-y-0.5">
                  <div className="font-semibold text-white">Primary 2FA Method: Authenticator TOTP App</div>
                  <div className="text-slate-400 text-[11px]">YubiKey 5 NFC / Google Authenticator registered on May 31, 2026.</div>
                </div>
                <div className="text-xs font-mono text-emerald-400 font-bold">Active Shield</div>
              </div>
            </div>

            {/* 3. ACTIVE SECURITY SESSIONS INSPECTOR */}
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-4 shadow-2xl">
              <div className="border-b border-[#15283f] pb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Globe size={18} className="text-blue-400" />
                    Active Logged-in Web & System Sessions ({sessions.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Inspect active web console JWT sessions and revoke unauthorized device access.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="bg-[#050f1b] border border-[#15273e] p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{session.device}</span>
                        {session.current && (
                          <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px] font-mono rounded">
                            This Device
                          </span>
                        )}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px] flex items-center gap-3">
                        <span>IP: {session.ip}</span>
                        <span>•</span>
                        <span>Location: {session.location}</span>
                        <span>•</span>
                        <span>Last Active: {session.lastActive}</span>
                      </div>
                    </div>

                    {!session.current && (
                      <button
                        onClick={() => handleRevokeSession(session.id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-semibold transition flex items-center gap-1.5 cursor-pointer w-fit"
                      >
                        <Trash2 size={13} /> Revoke Session
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: NODE & INFRASTRUCTURE SETTINGS */}
        {activeTab === "node" && (
          <form onSubmit={handleSaveNodeSettings} className="space-y-6 animate-fade-in">
            <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-6 space-y-6 shadow-2xl">
              <div className="border-b border-[#15283f] pb-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Database size={18} className="text-emerald-400" />
                  Web3 RPC Node & Storage Infrastructure
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Configure blockchain RPC gateway endpoints, decentralized IPFS storage nodes, and SHA-256 Web Crypto providers.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Ethereum Mainnet RPC Endpoint URL</label>
                  <input
                    type="text"
                    value={nodeSettings.rpcEndpoint}
                    onChange={(e) => setNodeSettings({ ...nodeSettings, rpcEndpoint: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-emerald-400 font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">IPFS Storage Gateway URL</label>
                  <input
                    type="text"
                    value={nodeSettings.ipfsGateway}
                    onChange={(e) => setNodeSettings({ ...nodeSettings, ipfsGateway: e.target.value })}
                    className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl px-4 py-2.5 text-xs text-blue-400 font-mono focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Web Crypto Digest Engine Algorithm</label>
                  <input
                    type="text"
                    value={nodeSettings.hashAlgorithm}
                    disabled
                    className="w-full bg-[#030912] border border-[#132438] rounded-xl px-4 py-2.5 text-xs text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="border-t border-[#15283f] pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-emerald-500/20 cursor-pointer"
                >
                  Save Node & RPC Configuration
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- MODAL: 2FA BACKUP CODES PLACEHOLDER MODAL --- */}
        {showBackupCodesModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#081321] border border-[#1b314b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in space-y-6 p-6">
              <div className="flex items-center justify-between border-b border-[#162a40] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Key size={18} className="text-emerald-400" />
                  2FA Backup Recovery Codes
                </h3>
                <button
                  onClick={() => setShowBackupCodesModal(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                Store these single-use recovery codes in a secure vault. If you lose access to your 2FA authenticator app, these keys will restore access to your investigator account.
              </p>

              <div className="bg-[#040c17] border border-[#15273d] p-4 rounded-xl font-mono text-xs text-emerald-400 grid grid-cols-2 gap-2 shadow-inner">
                {mockBackupCodes.map((code, idx) => (
                  <div key={idx} className="bg-[#071626] p-2 rounded border border-[#15283f] text-center">
                    {code}
                  </div>
                ))}
              </div>

              <div className="border-t border-[#162a40] pt-4 flex justify-between items-center">
                <button
                  onClick={handleCopyCodes}
                  className="px-3.5 py-2 bg-[#0e2238] hover:bg-[#163352] text-slate-200 border border-[#213f63] rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedCode ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  {copiedCode ? "Copied All Keys" : "Copy Keys"}
                </button>

                <button
                  onClick={() => setShowBackupCodesModal(false)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
