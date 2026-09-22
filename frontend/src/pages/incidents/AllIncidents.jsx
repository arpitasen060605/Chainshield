import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { getIncidents } from "../../services/incidentService";
import { useAuth } from "../../context/AuthContext";
import { Shield, Plus, Search, Eye, User, AlertCircle, Loader2 } from "lucide-react";

const formatStatusLabel = (value) => {
  if (!value) return "Active";
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const formatSeverityLabel = (value) => {
  if (!value) return "Medium";
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

export default function AllIncidents() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [incidentsList, setIncidentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const canCreateIncident = ["admin", "lead_investigator", "incident_responder"].includes(
    (user?.role || "").toLowerCase()
  );

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getIncidents({
        severity: severityFilter,
        status: statusFilter,
        search: searchQuery,
        type: typeFilter,
        page,
        limit,
      });

      if (res.success && Array.isArray(res.incidents)) {
        setIncidentsList(res.incidents);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.incidents.length);
      } else {
        setIncidentsList([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("[AllIncidents] Error fetching incidents:", err);
      setError(err.response?.data?.message || "Failed to load incidents from security vault.");
      setIncidentsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter, searchQuery, typeFilter, page]);

  const resetFilters = () => {
    setSearchQuery("");
    setSeverityFilter("All");
    setStatusFilter("All");
    setTypeFilter("All");
    setPage(1);
  };

  return (
    <Layout>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-300/90">
            <Shield size={14} />
            Security Operations
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-50 sm:text-3xl">Incidents</h1>
          <p className="mt-1 text-sm text-slate-400">
            Track and review active security events across your environment.
          </p>
        </div>

        {canCreateIncident && (
          <button
            onClick={() => navigate("/incidents/create")}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white shadow-lg shadow-blue-900/20 transition hover:bg-blue-500"
          >
            <Plus size={16} />
            Create Incident
          </button>
        )}
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-xs text-red-300">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="panel overflow-hidden">
        <div className="flex flex-col gap-4 border-b border-slate-800/80 bg-slate-900/40 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex w-full max-w-xl items-center gap-3 rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5">
            <Search size={15} className="text-slate-400" />
            <input
              type="text"
              placeholder="Search incidents or vectors"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full bg-transparent text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-slate-200 outline-none transition focus:border-blue-500"
            >
              <option value="All">All types</option>
              <option value="Ransomware">Ransomware</option>
              <option value="Phishing">Phishing</option>
              <option value="Malware">Malware</option>
              <option value="Data Breach">Data Breach</option>
              <option value="Unauthorized Access">Unauthorized Access</option>
              <option value="SQL Injection">SQL Injection</option>
              <option value="Network Intrusion">Network Intrusion</option>
              <option value="Insider Threat">Insider Threat</option>
              <option value="Other">Other</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => {
                setSeverityFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-slate-200 outline-none transition focus:border-blue-500"
            >
              <option value="All">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="rounded-lg border border-slate-700 bg-slate-950/80 px-2.5 py-2 text-slate-200 outline-none transition focus:border-blue-500"
            >
              <option value="All">All statuses</option>
              <option value="active">Active</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="containment">Containment</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between border-b border-slate-800/80 px-4 py-3 text-xs text-slate-400">
          <span>{totalCount} incidents</span>
          {totalPages > 1 && <span>Page {page} of {totalPages}</span>}
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
              <Loader2 className="animate-spin text-blue-500" size={28} />
              <span>Loading incidents...</span>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Incident</th>
                    <th>Vector</th>
                    <th>Severity</th>
                    <th>Status</th>
                    <th>Owner</th>
                    <th>Created</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {incidentsList.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center">
                        <div className="space-y-3 text-slate-400">
                          <p>No incidents match the selected filters.</p>
                          <button
                            onClick={resetFilters}
                            className="rounded-lg border border-blue-500/30 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-blue-300 transition hover:bg-slate-800"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    incidentsList.map((inc) => {
                      const incidentIdDisplay = inc.incidentId || (inc._id ? `INC-${inc._id.slice(-6).toUpperCase()}` : "INC-000");
                      const ownerName =
                        Array.isArray(inc.assignedTo) && inc.assignedTo.length > 0
                          ? inc.assignedTo.map((member) => member.name || member.email).join(", ")
                          : inc.createdBy?.name || "Unassigned";

                      const createdDisplay = inc.createdAt
                        ? new Date(inc.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : inc.createdDate || "N/A";

                      const severityKey = (inc.severity || "medium").toLowerCase();
                      const statusKey = (inc.status || "active").toLowerCase().replace(/\s+/g, "-");

                      return (
                        <tr
                          key={inc._id || inc.id}
                          className="cursor-pointer transition hover:bg-slate-900/60"
                          onClick={() => navigate(`/incidents/${inc.incidentId || inc._id || inc.id}`)}
                        >
                          <td className="font-mono text-xs font-semibold text-blue-300">{incidentIdDisplay}</td>
                          <td>
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-100">{inc.title}</span>
                              {inc.type && <span className="mt-1 text-[10px] uppercase tracking-wide text-slate-500">{inc.type}</span>}
                            </div>
                          </td>
                          <td>
                            <span className="inline-flex rounded border border-slate-700 bg-slate-900/80 px-2 py-1 text-[10px] uppercase tracking-wide text-slate-300">
                              {inc.threatVector || inc.type || "Other"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge severity-${severityKey}`}>
                              {formatSeverityLabel(inc.severity || "medium")}
                            </span>
                          </td>
                          <td>
                            <span className={`badge status-${statusKey}`}>
                              {formatStatusLabel(inc.status || "active")}
                            </span>
                          </td>
                          <td>
                            <div className="flex items-center gap-2 text-slate-300">
                              <User size={13} className="text-slate-500" />
                              <span className="max-w-[140px] truncate">{ownerName}</span>
                            </div>
                          </td>
                          <td className="text-slate-400">{createdDisplay}</td>
                          <td className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/incidents/${inc.incidentId || inc._id || inc.id}`);
                              }}
                              className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900/80 px-2.5 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-blue-500 hover:text-blue-300"
                            >
                              <Eye size={13} />
                              View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800/80 bg-slate-950/40 px-4 py-3 text-xs text-slate-400">
                  <span>Showing {incidentsList.length} of {totalCount}</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="rounded border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="rounded border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
