import { useState, useEffect, useRef } from "react";
import Layout from "../../components/layout/Layout";
import { roleDefinitions } from "../../data/mockUsersData";
import {
  getAllUsers,
  updateUserRole,
  updateUserStatus,
} from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  UserX,
  Search,
  Filter,
  Eye,
  Key,
  Lock,
  CheckCircle2,
  AlertCircle,
  Mail,
  Check,
  X,
  Info,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function UsersRoles() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoleFilter, setSelectedRoleFilter] = useState("All");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("All");

  // Selected User for View Modal
  const [activeUserModal, setActiveUserModal] = useState(null);

  // Role Edit Modal State
  const [roleEditUser, setRoleEditUser] = useState(null);
  const [newRoleValue, setNewRoleValue] = useState("");

  // Action Loading State
  const [actionLoading, setActionLoading] = useState(false);

  // Toast message
  const [toastMessage, setToastMessage] = useState(null);
  const [toastType, setToastType] = useState("success");
  const requestIdRef = useRef(0);
  const requestControllerRef = useRef(null);

  const showToast = (msg, type = "success") => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch users from backend API
  const fetchUsers = async ({ background = false } = {}) => {
    const requestId = ++requestIdRef.current;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;

    try {
      if (!background) setLoading(true);
      setError(null);
      const data = await getAllUsers({ signal: controller.signal });

      if (requestId !== requestIdRef.current) return;

      if (data.success && Array.isArray(data.users)) {
        setUsersList(data.users);
        if (import.meta.env.DEV) {
          const diagnosticEmail = "theunknownrock71@gmail.com";
          console.debug("[UsersRoles] API users count", data.count, {
            diagnosticUser: data.users.find((user) => user.email === diagnosticEmail),
          });
        }
      } else {
        setUsersList([]);
      }
    } catch (err) {
      if (err.code === "ERR_CANCELED" || err.name === "CanceledError") return;
      if (requestId !== requestIdRef.current) return;
      const msg =
        err.response?.data?.message ||
        "Failed to load users. Ensure you are logged in as an administrator.";
      setError(msg);
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();

    const handleFocus = () => {
      fetchUsers({ background: true });
    };

    // Auto-poll every 10 seconds so newly registered pending users automatically appear
    const interval = setInterval(() => {
      fetchUsers({ background: true });
    }, 10000);

    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("focus", handleFocus);
      clearInterval(interval);
      requestControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      const diagnosticEmail = "theunknownrock71@gmail.com";
      console.debug("[UsersRoles] React usersList count", usersList.length, {
        diagnosticUser: usersList.find((user) => user.email === diagnosticEmail),
      });
    }
  }, [usersList]);

  // Handle Approve Pending User
  const handleApproveUser = async (user) => {
    const userId = user._id || user.id;
    try {
      setActionLoading(true);
      const res = await updateUserStatus(userId, "active");
      if (res.success) {
        showToast(`Registration for ${user.name} approved.`, "success");
        setUsersList((prev) =>
          prev.map((u) => ((u._id || u.id) === userId ? { ...u, status: "active" } : u))
        );
        fetchUsers({ background: true });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || `Failed to approve ${user.name}.`;
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Reject Pending User
  const handleRejectUser = async (user) => {
    const userId = user._id || user.id;
    try {
      setActionLoading(true);
      const res = await updateUserStatus(userId, "rejected");
      if (res.success) {
        showToast(`Registration for ${user.name} rejected.`, "success");
        setUsersList((prev) =>
          prev.map((u) => ((u._id || u.id) === userId ? { ...u, status: "rejected" } : u))
        );
        fetchUsers({ background: true });
      }
    } catch (err) {
      const errMsg = err.response?.data?.message || `Failed to reject ${user.name}.`;
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Toggle Activate / Deactivate user status
  const handleToggleStatus = async (user) => {
    const userId = user._id || user.id;
    const currentStatus = (user.status || "active").toLowerCase();
    const nextStatus = currentStatus === "pending" ? "active" : (currentStatus === "active" ? "inactive" : "active");

    try {
      setActionLoading(true);
      const res = await updateUserStatus(userId, nextStatus);
      if (res.success) {
        showToast(
          res.message || `Account status for ${user.name} updated to ${nextStatus}.`,
          "success"
        );
        fetchUsers({ background: true });
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        `Failed to update status for ${user.name}.`;
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Change Role Handler
  const handleSaveRole = async () => {
    if (!roleEditUser || !newRoleValue) return;

    const userId = roleEditUser._id || roleEditUser.id;

    try {
      setActionLoading(true);
      const res = await updateUserRole(userId, newRoleValue);
      if (res.success) {
        showToast(
          res.message || `Role for ${roleEditUser.name} updated to ${newRoleValue.replaceAll('_', ' ')}.`,
          "success"
        );
        setUsersList((prev) =>
          prev.map((u) =>
            (u._id || u.id) === userId
              ? { ...u, role: newRoleValue, status: "active" }
              : u
          )
        );
        setRoleEditUser(null);
      }
    } catch (err) {
      const errMsg =
        err.response?.data?.message ||
        `Failed to update role for ${roleEditUser.name}.`;
      showToast(errMsg, "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Filter users locally by search query, role filter, and status filter
  const filteredUsers = usersList.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    const nameMatch = !query || u.name?.toLowerCase().includes(query);
    const emailMatch = !query || u.email?.toLowerCase().includes(query);
    const idMatch = !query || String(u._id || u.id)?.toLowerCase().includes(query);
    const matchesSearch = nameMatch || emailMatch || idMatch;

    const userRole = (u.role || "pending").toLowerCase();
    const matchesRole =
      selectedRoleFilter === "All" ||
      (selectedRoleFilter.toLowerCase() === "admin" && (userRole === "admin" || userRole === "company_admin")) ||
      userRole === selectedRoleFilter.toLowerCase();

    const userStatus = (u.status || "pending").toLowerCase();
    const matchesStatus =
      selectedStatusFilter === "All" ||
      userStatus === selectedStatusFilter.toLowerCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  useEffect(() => {
    if (import.meta.env.DEV) {
      const diagnosticEmail = "theunknownrock71@gmail.com";
      console.debug("[UsersRoles] filtered users count", filteredUsers.length, {
        diagnosticUser: filteredUsers.find((user) => user.email === diagnosticEmail),
      });
      console.debug("[UsersRoles] rendered users count", filteredUsers.length);
    }
  }, [filteredUsers]);

  // Calculate quick stats
  const activeCount = usersList.filter(
    (u) => (u.status || "").toLowerCase() === "active"
  ).length;
  const adminCount = usersList.filter(
    (u) => {
      const r = (u.role || "").toLowerCase();
      return r === "admin" || r === "company_admin";
    }
  ).length;
  const analystCount = usersList.filter(
    (u) => (u.role || "").toLowerCase() === "forensic_analyst"
  ).length;

  const getRoleDisplayName = (roleKey) => {
    if (!roleKey || roleKey.toLowerCase() === "pending") return "Pending";
    const normalizedKey = roleKey === "company_admin" ? "admin" : roleKey.toLowerCase();
    const def = roleDefinitions[normalizedKey] || roleDefinitions[roleKey];
    return def ? def.name : roleKey.replaceAll("_", " ");
  };

  const getRoleBadgeStyle = (roleKey) => {
    if (!roleKey || roleKey.toLowerCase() === "pending") return "bg-amber-500/10 text-amber-400 border-amber-500/30";
    const normalizedKey = roleKey === "company_admin" ? "admin" : roleKey.toLowerCase();
    const def = roleDefinitions[normalizedKey] || roleDefinitions[roleKey];
    return def ? def.badgeColor : "bg-slate-500/10 text-slate-400 border-slate-500/30";
  };

  return (
    <Layout>
      <div className="space-y-8 pb-12">
        {/* Toast Notification */}
        {toastMessage && (
          <div
            className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-fade-in font-mono text-sm border ${
              toastType === "error"
                ? "bg-[#250b10] border-red-500/40 text-red-400"
                : "bg-[#0c2440] border-[#2b598d] text-emerald-400"
            }`}
          >
            {toastType === "error" ? (
              <AlertCircle size={18} className="text-red-400 shrink-0" />
            ) : (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182a3f] pb-6">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
                <Users size={22} />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                User Access & Role Management (RBAC)
              </h1>
              <span className="px-2.5 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-full text-xs font-semibold font-mono">
                RBAC Enforced
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Manage platform users, assign security roles, toggle account statuses, and approve pending employee registrations.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchUsers()}
              disabled={loading}
              className="bg-[#0b1928] hover:bg-[#152e4a] border border-[#1d324b] px-3.5 py-2 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
              title="Refetch user database"
            >
              <RefreshCw size={15} className={`text-blue-400 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>
            <div className="bg-[#0b1928] border border-[#1d324b] px-3 py-2 rounded-xl text-xs font-mono text-slate-300 flex items-center gap-2">
              <Key size={15} className="text-amber-400" />
              <span>RBAC Token Middleware: Active</span>
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Total Accounts</div>
              <div className="text-2xl font-bold text-white mt-1 font-mono">
                {usersList.length}
              </div>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Users size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Active Accounts</div>
              <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
                {activeCount}
              </div>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <UserCheck size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Admins</div>
              <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">
                {adminCount}
              </div>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="bg-[#091523] border border-[#192b42] p-4 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-xs text-slate-400 font-medium">Forensic Analysts</div>
              <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">
                {analystCount}
              </div>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl">
              <Shield size={20} />
            </div>
          </div>
        </div>

        {/* RBAC Architecture Info Callout */}
        <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-4 flex items-start gap-3.5 text-xs text-slate-300">
          <Info size={20} className="text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold text-blue-300 flex items-center gap-2">
              <span>Role-Based Access Control (RBAC) Architecture</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Security roles (<strong className="text-slate-200">Admin, Lead Investigator, Forensic Analyst, Auditor, Incident Responder</strong>) govern backend API route authorizations. Public signup defaults to <strong className="text-amber-300">Pending Approval</strong>. Only Administrators can approve pending accounts, assign security roles, or deactivate users.
            </p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-xs text-red-400 font-mono">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Search & Multi-Field Filter Bar */}
        <div className="bg-[#091626] border border-[#1b314b] rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, or ID..."
              className="w-full bg-[#050f1b] border border-[#1c324c] rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Role */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Filter size={14} />
              <span>Role:</span>
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-[#050f1b] border border-[#1c324c] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="admin">Admin</option>
                <option value="lead_investigator">Lead Investigator</option>
                <option value="forensic_analyst">Forensic Analyst</option>
                <option value="auditor">Auditor</option>
                <option value="incident_responder">Incident Responder</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-[#050f1b] border border-[#1c324c] rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* User Management Registry Table */}
        <div className="bg-[#091626] border border-[#1b314b] rounded-2xl shadow-2xl overflow-hidden">
          <div className="overflow-x-auto min-h-[350px]">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="bg-[#050d18] text-slate-400 font-mono border-b border-[#14263b]">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Assigned Role</th>
                  <th className="p-4">Account Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#13253b]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-slate-400 font-mono">
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 size={20} className="animate-spin text-blue-400" />
                        <span>Loading ChainShield User Database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-mono">
                      No user accounts match the selected filters or search query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const userId = u._id || u.id;
                    const userRole = (u.role || "pending").toLowerCase();
                    const userStatus = (u.status || "pending").toLowerCase();
                    const roleBadge = getRoleBadgeStyle(userRole);
                    const roleLabel = getRoleDisplayName(userRole);

                    const initials = u.name
                      ? u.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)
                      : "CS";

                    const dateFormatted = u.createdAt
                      ? new Date(u.createdAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : "N/A";

                    return (
                      <tr key={userId} className="hover:bg-[#071526] transition">
                        {/* User Details */}
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md shrink-0">
                              {initials}
                            </div>
                            <div>
                              <div className="font-bold text-white text-sm flex items-center gap-2">
                                <span>{u.name}</span>
                                <span className="font-mono text-[10px] text-slate-500 font-normal">
                                  ({String(userId).slice(-6)})
                                </span>
                              </div>
                              <div className="text-slate-400 text-xs flex items-center gap-1.5 mt-0.5">
                                <Mail size={12} className="text-slate-500" />
                                <span>{u.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Role Badge */}
                        <td className="p-4">
                          <span
                            className={`px-2.5 py-1 rounded-lg border text-xs font-semibold font-mono inline-flex items-center gap-1.5 ${roleBadge}`}
                          >
                            <Shield size={13} />
                            {roleLabel}
                          </span>
                        </td>

                        {/* Status Tag */}
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${
                                userStatus === "active"
                                  ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                                  : userStatus === "pending"
                                  ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)] animate-pulse"
                                  : userStatus === "inactive"
                                  ? "bg-slate-400"
                                  : "bg-red-400"
                              }`}
                            />
                            <span
                              className={`font-semibold capitalize ${
                                userStatus === "active"
                                  ? "text-emerald-400"
                                  : userStatus === "pending"
                                  ? "text-amber-400"
                                  : userStatus === "inactive"
                                  ? "text-slate-400"
                                  : "text-red-400"
                              }`}
                            >
                              {userStatus === "pending" ? "Pending" : userStatus}
                            </span>
                          </div>
                        </td>

                        {/* Created Date */}
                        <td className="p-4 font-mono text-slate-400 text-xs">
                          {dateFormatted}
                        </td>

                        {/* Actions Column */}
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* View User Button */}
                            <button
                              onClick={() => setActiveUserModal(u)}
                              className="px-2.5 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                              title="View full user profile"
                            >
                              <Eye size={13} /> View
                            </button>

                            {userStatus === "pending" ? (
                              <>
                                {/* Approve Button */}
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleApproveUser(u)}
                                  className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Approve user registration"
                                >
                                  <UserCheck size={13} /> Approve
                                </button>

                                {/* Reject Button */}
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleRejectUser(u)}
                                  className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Reject user registration"
                                >
                                  <UserX size={13} /> Reject
                                </button>
                              </>
                            ) : (
                              <>
                                {/* Change Role Button */}
                                <button
                                  onClick={() => {
                                    setRoleEditUser(u);
                                    const validRoles = ["incident_responder", "lead_investigator", "forensic_analyst", "auditor"];
                                    const currentRoleNormalized = (u.role || "").toLowerCase();
                                    const initialRole = validRoles.includes(currentRoleNormalized) ? currentRoleNormalized : "incident_responder";
                                    setNewRoleValue(initialRole);
                                  }}
                                  className="px-2.5 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-slate-300 border border-[#213f63] rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer"
                                  title="Change employee role"
                                >
                                  <Shield size={13} /> Role
                                </button>

                                {/* Activate / Deactivate Toggle Button */}
                                <button
                                  disabled={actionLoading}
                                  onClick={() => handleToggleStatus(u)}
                                  className={`px-2.5 py-1.5 border rounded-lg text-xs font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50 ${
                                    userStatus === "active"
                                      ? "bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30"
                                      : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                                  }`}
                                >
                                  {userStatus === "active" ? (
                                    <>
                                      <UserX size={13} /> Deactivate
                                    </>
                                  ) : (
                                    <>
                                      <UserCheck size={13} /> Activate
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- MODAL 1: VIEW USER INSPECTOR MODAL --- */}
        {activeUserModal && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#081321] border border-[#1b314b] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-fade-in space-y-6 p-6">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#162a40] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-md">
                    {activeUserModal.name?.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {activeUserModal.name}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      {activeUserModal.email}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setActiveUserModal(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#122438] transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-[#050d18] border border-[#14263b] p-3 rounded-xl">
                  <div className="text-slate-400">Database User ID</div>
                  <div className="font-mono font-bold text-blue-400 mt-0.5 truncate">
                    {activeUserModal._id || activeUserModal.id}
                  </div>
                </div>

                <div className="bg-[#050d18] border border-[#14263b] p-3 rounded-xl">
                  <div className="text-slate-400">Assigned Role</div>
                  <div className="font-semibold text-purple-400 mt-0.5">
                    {getRoleDisplayName((activeUserModal.role || "").toLowerCase())}
                  </div>
                </div>

                <div className="bg-[#050d18] border border-[#14263b] p-3 rounded-xl">
                  <div className="text-slate-400">Account Status</div>
                  <div className="font-semibold text-emerald-400 mt-0.5 capitalize">
                    {activeUserModal.status || "active"}
                  </div>
                </div>
              </div>

              {/* SECTION: Decoded JWT Token Payload Preview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <Key size={14} className="text-amber-400" />
                    Decoded JWT Claims
                  </span>
                  <span className="font-mono text-[10px] text-slate-400">
                    Bearer Token Header
                  </span>
                </div>
                <div className="bg-[#040c17] border border-[#15273d] p-3.5 rounded-xl font-mono text-[11px] text-amber-300 overflow-x-auto leading-relaxed shadow-inner">
                  <pre>
                    {JSON.stringify(
                      {
                        id: activeUserModal._id || activeUserModal.id,
                        email: activeUserModal.email,
                        role: activeUserModal.role,
                        status: activeUserModal.status,
                        createdAt: activeUserModal.createdAt,
                      },
                      null,
                      2
                    )}
                  </pre>
                </div>
              </div>

              {/* SECTION: RBAC Permission Matrix */}
              <div className="space-y-2.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  RBAC Permission Scopes for "{getRoleDisplayName((activeUserModal.role || "").toLowerCase())}"
                </div>

                <div className="flex flex-wrap gap-2">
                  {(
                    roleDefinitions[(activeUserModal.role || "").toLowerCase()]?.permissions || [
                      "incidents:read",
                      "evidence:read",
                      "evidence:upload",
                    ]
                  ).map((perm) => (
                    <span
                      key={perm}
                      className="px-2.5 py-1 bg-[#091c30] border border-[#1b3a5c] text-emerald-400 font-mono text-[11px] rounded-lg flex items-center gap-1"
                    >
                      <Check size={12} className="text-emerald-400" />
                      {perm}
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-[#162a40] pt-4 flex justify-end">
                <button
                  onClick={() => setActiveUserModal(null)}
                  className="px-4 py-2 bg-[#0e2238] hover:bg-[#163352] text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Close Inspector
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- MODAL 2: CHANGE ROLE MODAL --- */}
        {roleEditUser && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#081321] border border-[#1b314b] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-fade-in space-y-6 p-6">
              <div className="flex items-center justify-between border-b border-[#162a40] pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield size={18} className="text-purple-400" />
                  Change Role
                </h3>
                <button
                  onClick={() => setRoleEditUser(null)}
                  className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4">
                {/* User Summary Card */}
                <div className="bg-[#050d18] border border-[#14263b] p-3 rounded-xl space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">User:</span>
                    <span className="font-bold text-white">{roleEditUser.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-mono text-slate-300">{roleEditUser.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Current Role:</span>
                    <span className="font-semibold text-purple-400">
                      {getRoleDisplayName((roleEditUser.role || "").toLowerCase())}
                    </span>
                  </div>
                </div>

                {/* Role Selection Radio Cards */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300">Select New Role:</label>
                  <div className="space-y-2">
                    {[
                      "incident_responder",
                      "lead_investigator",
                      "forensic_analyst",
                      "auditor",
                    ].map((roleKey) => {
                      const def = roleDefinitions[roleKey] || {
                        name: roleKey,
                        description: "",
                      };
                      const isSelected = newRoleValue === roleKey;
                      return (
                        <div
                          key={roleKey}
                          onClick={() => setNewRoleValue(roleKey)}
                          className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                            isSelected
                              ? "bg-purple-500/10 border-purple-500/50 text-white"
                              : "bg-[#050d18] border border-[#14263b] text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full border mt-0.5 flex items-center justify-center ${
                              isSelected
                                ? "border-purple-400 bg-purple-500"
                                : "border-slate-600"
                            }`}
                          >
                            {isSelected && (
                              <Check size={10} className="text-black font-bold" />
                            )}
                          </div>
                          <div className="space-y-0.5">
                            <div className="text-xs font-bold">{def.name}</div>
                            <div className="text-[11px] text-slate-400 leading-tight">
                              {def.description}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Footer Buttons */}
              <div className="border-t border-[#162a40] pt-4 flex justify-end gap-3">
                <button
                  onClick={() => setRoleEditUser(null)}
                  className="px-4 py-2 bg-[#0e2238] hover:bg-[#163352] text-slate-300 rounded-xl text-xs font-semibold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  disabled={actionLoading}
                  onClick={handleSaveRole}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-semibold transition shadow-lg shadow-purple-500/20 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {actionLoading && <Loader2 size={14} className="animate-spin" />}
                  <span>{actionLoading ? "Saving..." : "Save Role"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
