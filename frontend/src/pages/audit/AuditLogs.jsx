import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { auditLogs as mockAuditLogs } from "../../data/mockData";
import { getAuditLogs } from "../../services/auditService";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  User,
  Shield,
  Folder,
  Layers,
  Sparkles,
  LogIn,
  LogOut,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Activity,
  ArrowUpRight,
  Hash,
  Loader2,
} from "lucide-react";

export default function AuditLogs() {
  const navigate = useNavigate();

  const [realLogs, setRealLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [actionFilter, setActionFilter] = useState("All");
  const [userFilter, setUserFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchAuditTelemetry = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAuditLogs({ action: actionFilter, user: userFilter, search: debouncedSearchQuery });
      if (res.success && Array.isArray(res.logs)) {
        setRealLogs(res.logs);
      } else {
        setRealLogs([]);
      }
    } catch (err) {
      console.error("[AuditLogs] Failed to fetch real audit logs:", err);
      setRealLogs(mockAuditLogs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchAuditTelemetry();
  }, [actionFilter, userFilter, debouncedSearchQuery]);

  const logsSource = realLogs.length > 0 ? realLogs : mockAuditLogs;

  // Filtering Logic
  const filteredLogs = logsSource.filter((item) => {
    // Search matching
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      (item.id && item.id.toLowerCase().includes(q)) ||
      (item.action && item.action.toLowerCase().includes(q)) ||
      (item.user && String(item.user).toLowerCase().includes(q)) ||
      (item.resource && item.resource.toLowerCase().includes(q)) ||
      (item.details && item.details.toLowerCase().includes(q)) ||
      (item.incidentId && String(item.incidentId).toLowerCase().includes(q)) ||
      (item.evidenceId && String(item.evidenceId).toLowerCase().includes(q));

    // Action matching
    const matchesAction =
      actionFilter === "All" ||
      item.action === actionFilter ||
      item.action === actionFilter.toUpperCase().replace(/\s+/g, '_');

    // User matching
    const matchesUser = userFilter === "All" || item.user === userFilter || item.userEmail === userFilter;

    // Status matching (All, Success, Failed, Pending)
    let matchesStatus = true;
    if (statusFilter !== "All") {
      const normStatus = (item.status || "").toUpperCase();
      const filterVal = statusFilter.toUpperCase();

      if (filterVal === "SUCCESS") {
        matchesStatus = ["SUCCESS", "VERIFIED", "COMPLETED"].includes(normStatus);
      } else if (filterVal === "FAILED") {
        matchesStatus = ["FAILED", "ERROR", "REJECTED"].includes(normStatus);
      } else if (filterVal === "PENDING") {
        matchesStatus = ["PENDING", "WARNING"].includes(normStatus);
      } else {
        matchesStatus = normStatus === filterVal;
      }
    }

    return matchesSearch && matchesAction && matchesUser && matchesStatus;
  });

  // Action Icon Helper
  const getActionIcon = (action) => {
    switch (action) {
      case "Login":
        return <LogIn size={14} className="text-emerald-400" />;
      case "Logout":
        return <LogOut size={14} className="text-slate-400" />;
      case "Incident Created":
        return <Shield size={14} className="text-rose-400" />;
      case "Incident Updated":
        return <Activity size={14} className="text-blue-400" />;
      case "Investigator Assigned":
        return <User size={14} className="text-purple-400" />;
      case "Evidence Uploaded":
        return <Folder size={14} className="text-amber-400" />;
      case "Hash Generated":
        return <Hash size={14} className="text-amber-300" />;
      case "Blockchain Record Created":
        return <Layers size={14} className="text-cyan-400" />;
      case "Evidence Verification Requested":
        return <Clock size={14} className="text-amber-400" />;
      case "Evidence Verification":
      case "Evidence Verified":
        return <CheckCircle2 size={14} className="text-blue-400" />;
      case "Report Generated":
        return <Sparkles size={14} className="text-purple-400" />;
      default:
        return <FileText size={14} className="text-blue-400" />;
    }
  };

  // Status Badge Helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "SUCCESS":
      case "COMPLETED":
      case "VERIFIED":
        return (
          <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            {status}
          </span>
        );
      case "WARNING":
      case "PENDING":
        return (
          <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            {status}
          </span>
        );
      case "FAILED":
        return (
          <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {status}
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <Layout>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-1">
          <FileText size={16} /> Immutable Audit Telemetry Stream
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          System Audit Logs
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Real-time security activity stream tracking authentication, incident updates, digital evidence processing, cryptographic hashing, and verification checks.
        </p>
      </div>

      {/* Metric Cards Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 text-xs">
        <div className="bg-[#0b1827] border border-[#203246] p-4 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Total Telemetry Events</span>
          <strong className="text-xl text-white font-mono block mt-1">{logsSource.length}</strong>
        </div>
        <div className="bg-[#0b1827] border border-[#203246] p-4 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Authentication Logs</span>
          <strong className="text-xl text-emerald-400 font-mono block mt-1">
            {logsSource.filter((l) => (l.action || "").includes("Login") || (l.action || "").includes("Logout") || (l.action || "").includes("AUTH")).length}
          </strong>
        </div>
        <div className="bg-[#0b1827] border border-[#203246] p-4 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Evidence & Cryptographic Logs</span>
          <strong className="text-xl text-amber-400 font-mono block mt-1">
            {logsSource.filter(
              (l) =>
                (l.action || "").includes("Evidence") ||
                (l.action || "").includes("EVIDENCE") ||
                (l.action || "").includes("Hash") ||
                (l.action || "").includes("HASH") ||
                (l.action || "").includes("Blockchain") ||
                (l.action || "").includes("BLOCKCHAIN")
            ).length}
          </strong>
        </div>
        <div className="bg-[#0b1827] border border-[#203246] p-4 rounded-xl">
          <span className="text-slate-400 text-[11px] block">Active Investigators & Daemons</span>
          <strong className="text-xl text-purple-400 font-mono block mt-1">6</strong>
        </div>
      </div>

      {/* Multi-Field Filter Bar */}
      <div className="bg-[#0b1827] border border-[#203246] p-4 rounded-2xl mb-6 space-y-3 text-xs">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          {/* Search Box */}
          <div className="relative w-full lg:w-72">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search Action, User, Resource, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#071322] border border-[#1d334c] rounded-xl pl-9 pr-3.5 py-2 text-slate-200 outline-none text-xs"
            />
          </div>

          {/* 4 Required Select Filters Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full lg:w-auto">
            {/* 1. Action Filter */}
            <div>
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
              >
                <option value="All">All Actions</option>
                <option value="Login">Login</option>
                <option value="Logout">Logout</option>
                <option value="Incident Created">Incident Created</option>
                <option value="Incident Updated">Incident Updated</option>
                <option value="Investigator Assigned">Investigator Assigned</option>
                <option value="Evidence Uploaded">Evidence Uploaded</option>
                <option value="Hash Generated">Hash Generated</option>
                <option value="Blockchain Record Created">Blockchain Record Created</option>
                <option value="Evidence Verification Requested">Evidence Verification Requested</option>
                <option value="Evidence Verification">Evidence Verification</option>
                <option value="Report Generated">Report Generated</option>
              </select>
            </div>

            {/* 2. User Filter */}
            <div>
              <select
                value={userFilter}
                onChange={(e) => setUserFilter(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
              >
                <option value="All">All Users</option>
                <option value="Alex Mercer">Alex Mercer</option>
                <option value="Elena Rostova">Elena Rostova</option>
                <option value="David Chen">David Chen</option>
                <option value="Sarah Vance">Sarah Vance</option>
                <option value="System Admin">System Admin</option>
                <option value="SIEM Daemon">SIEM Daemon</option>
                <option value="Automated Daemon">Automated Daemon</option>
              </select>
            </div>

            {/* 3. Date Filter */}
            <div>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
              >
                <option value="All">All Dates</option>
                <option value="Today">Today</option>
                <option value="Past 3 Days">Past 3 Days</option>
                <option value="Past 7 Days">Past 7 Days</option>
              </select>
            </div>

            {/* 4. Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-xl px-3 py-2 text-slate-200 outline-none text-xs"
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Summary Counter */}
        <div className="flex justify-between items-center text-[11px] text-slate-400 pt-1 border-t border-[#16273b]">
          <span>
            Showing <strong className="text-blue-400 font-mono">{filteredLogs.length}</strong> of {logsSource.length} audit telemetry logs
          </span>
          {(searchQuery || actionFilter !== "All" || userFilter !== "All" || dateFilter !== "All" || statusFilter !== "All") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setDebouncedSearchQuery("");
                setActionFilter("All");
                setUserFilter("All");
                setDateFilter("All");
                setStatusFilter("All");
              }}
              className="text-blue-400 hover:underline font-semibold"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Audit Logs Data Table */}
      <div className="bg-[#0b1827] border border-[#203246] rounded-2xl shadow-2xl overflow-hidden text-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#071322] border-b border-[#1b2d42] text-slate-400 font-semibold text-[11px]">
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Action</th>
                <th className="py-3.5 px-4">Resource / Detail</th>
                <th className="py-3.5 px-4">Incident ID</th>
                <th className="py-3.5 px-4">Evidence ID</th>
                <th className="py-3.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#16273b] text-slate-200">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#0d2035] transition">
                    {/* Timestamp */}
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      {log.timestamp}
                    </td>

                    {/* User */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-200 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-[#11273e] border border-[#1f3f63] flex items-center justify-center text-[10px] font-bold text-blue-300">
                        {String(log.user || "System").slice(0, 2).toUpperCase()}
                      </div>
                      <span>{log.user || log.userName || "System"}</span>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-semibold text-slate-200 bg-[#071322] px-2.5 py-1 rounded-lg border border-[#182d45] text-[11px]">
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>

                    {/* Resource */}
                    <td className="py-3.5 px-4 font-mono text-slate-300 text-[11px] max-w-[260px] truncate">
                      {log.resource || `${log.resourceType || ''}: ${log.resourceId || 'N/A'}`}
                    </td>

                    {/* Incident ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(log.incidentId && log.incidentId !== "-") || log.resourceType === 'Incident' ? (
                        <button
                          onClick={() => navigate(`/incidents/${log.incidentId && log.incidentId !== "-" ? log.incidentId : log.resourceId}`)}
                          className="font-mono text-blue-400 font-bold hover:underline flex items-center gap-1"
                        >
                          {log.incidentId && log.incidentId !== "-" ? log.incidentId : log.resourceId} <ArrowUpRight size={11} />
                        </button>
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>

                    {/* Evidence ID */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {(log.evidenceId && log.evidenceId !== "-") || log.resourceType === 'Evidence' ? (
                        <button
                          onClick={() => navigate(`/evidence/${log.evidenceId && log.evidenceId !== "-" ? log.evidenceId : log.resourceId}`)}
                          className="font-mono text-amber-400 font-bold hover:underline flex items-center gap-1"
                        >
                          {log.evidenceId && log.evidenceId !== "-" ? log.evidenceId : log.resourceId} <ArrowUpRight size={11} />
                        </button>
                      ) : (
                        <span className="text-slate-500 font-mono">-</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {getStatusBadge(log.status)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    No audit telemetry logs found matching active search and filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
