import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import { getEvidence } from "../../services/evidenceService";
import { getIncidents } from "../../services/incidentService";
import {
  Folder,
  Upload,
  Search,
  Filter,
  Eye,
  File,
  AlertCircle,
  Loader2,
  Copy,
  Check,
} from "lucide-react";

export default function AllEvidence() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [evidenceList, setEvidenceList] = useState([]);
  const [incidentsList, setIncidentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [fileTypeFilter, setFileTypeFilter] = useState("All");
  const [incidentFilter, setIncidentFilter] = useState(searchParams.get("incidentId") || "All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [copiedId, setCopiedId] = useState(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchIncidentsDropdown = async () => {
    try {
      const res = await getIncidents({ limit: 100 });
      if (res.success && Array.isArray(res.incidents)) {
        setIncidentsList(res.incidents);
      }
    } catch (err) {
      console.error("[AllEvidence] Error fetching incidents dropdown:", err);
    }
  };

  const fetchEvidenceList = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getEvidence({
        incidentId: incidentFilter,
        evidenceType: fileTypeFilter,
        status: statusFilter,
        search: debouncedSearchQuery,
        page,
        limit,
      });

      if (res.success && Array.isArray(res.evidence)) {
        setEvidenceList(res.evidence);
        setTotalPages(res.totalPages || 1);
        setTotalCount(res.total || res.evidence.length);
      } else {
        setEvidenceList([]);
        setTotalPages(1);
        setTotalCount(0);
      }
    } catch (err) {
      console.error("[AllEvidence] Error fetching evidence:", err);
      setError(err.response?.data?.message || "Failed to load evidence artifacts from vault.");
      setEvidenceList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidentsDropdown();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchEvidenceList();
  }, [incidentFilter, fileTypeFilter, statusFilter, debouncedSearchQuery, page]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return "0 B";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Folder className="text-blue-500" size={28} /> Digital Evidence Vault
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized evidence artifacts linked to security incident cases.
          </p>
        </div>
        <button
          onClick={() => navigate("/evidence/upload")}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-lg shadow-blue-900/30 transition shrink-0 cursor-pointer"
        >
          <Upload size={16} /> Upload New Evidence
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-6 flex items-center gap-3 text-red-400 text-xs">
          <AlertCircle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-[#0b1827] border border-[#203246] rounded-xl p-4 mb-6 flex flex-col gap-3 text-xs">
        <div className="flex items-center gap-2 bg-[#081522] border border-[#1f3449] rounded-lg px-3 py-2 w-full">
          <Search size={15} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search by Evidence ID, Name, SHA-256 Hash, File Name..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            className="bg-transparent text-slate-200 outline-none w-full placeholder:text-slate-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-400" />
            <span className="text-slate-400 font-medium">Incident:</span>
            <select
              value={incidentFilter}
              onChange={(e) => {
                setIncidentFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#081522] border border-[#1f3449] text-slate-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer max-w-[200px] truncate"
            >
              <option value="All">All Incidents</option>
              {incidentsList.map((inc) => (
                <option key={inc._id} value={inc._id}>
                  {inc.incidentId || inc._id}: {inc.title.slice(0, 20)}...
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">File Type:</span>
            <select
              value={fileTypeFilter}
              onChange={(e) => {
                setFileTypeFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#081522] border border-[#1f3449] text-slate-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="All">All Types</option>
              <option value="document">Document</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
              <option value="log">Log File</option>
              <option value="memory_dump">Memory Dump</option>
              <option value="disk_image">Disk Image</option>
              <option value="network_capture">Network Capture</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="bg-[#081522] border border-[#1f3449] text-slate-300 rounded-lg px-2.5 py-1.5 outline-none cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="collected">Collected</option>
              <option value="under_investigation">Under Investigation</option>
              <option value="verified">Verified</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Evidence Table */}
      <div className="panel overflow-hidden">
        <div className="panel-head border-b border-[#1b2d42] px-5 py-4 flex items-center justify-between">
          <h3 className="font-semibold text-slate-200">Evidence Vault Artifacts ({totalCount})</h3>
          <span className="text-xs text-slate-400">Page {page} of {totalPages}</span>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 gap-3">
              <Loader2 className="animate-spin text-blue-500" size={32} />
              <span>Fetching evidence records from vault...</span>
            </div>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Evidence ID</th>
                    <th>Parent Incident</th>
                    <th>Name / File</th>
                    <th>Type</th>
                    <th>Size</th>
                    <th>Collected By</th>
                    <th>SHA-256 Hash</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {evidenceList.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-10 text-slate-400">
                        <div className="space-y-2">
                          <div>No matching evidence artifacts found.</div>
                          <button
                            onClick={() => {
                              setSearchQuery("");
                              setDebouncedSearchQuery("");
                              setFileTypeFilter("All");
                              setIncidentFilter("All");
                              setStatusFilter("All");
                              setPage(1);
                            }}
                            className="px-3.5 py-1.5 bg-[#0e2238] hover:bg-[#163352] text-blue-400 border border-blue-500/30 rounded-lg text-xs font-semibold transition cursor-pointer"
                          >
                            Reset Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    evidenceList.map((ev) => {
                      const evDisplayId = ev.evidenceId || (ev._id ? `EVD-${ev._id.slice(-6).toUpperCase()}` : "EVD-000");
                      const parentIncDisplay = ev.incidentId?.incidentId || ev.incidentId?._id || ev.incidentId || "N/A";
                      const collectorName = ev.collectedBy?.name || ev.collectedBy?.email || "Unknown";
                      const sha256 = ev.sha256Hash || ev.sha256 || "";

                      return (
                        <tr
                          key={ev._id || ev.id}
                          className="hover:bg-[#0e1d2f] transition cursor-pointer text-xs"
                          onClick={() => navigate(`/evidence/${ev.evidenceId || ev._id || ev.id}`)}
                        >
                          <td className="font-bold text-blue-400 font-mono">{evDisplayId}</td>
                          <td>
                            <span
                              onClick={(e) => {
                                e.stopPropagation();
                                if (ev.incidentId?._id || ev.incidentId) {
                                  navigate(`/incidents/${ev.incidentId?.incidentId || ev.incidentId?._id || ev.incidentId}`);
                                }
                              }}
                              className="font-bold text-slate-300 hover:text-blue-400 underline font-mono"
                            >
                              {parentIncDisplay}
                            </span>
                          </td>
                          <td className="font-medium text-slate-200">
                            <div className="flex items-center gap-2">
                              <File size={14} className="text-slate-400 shrink-0" />
                              <span className="truncate max-w-[180px]">{ev.name || ev.originalFileName}</span>
                            </div>
                          </td>
                          <td>
                            <span className="px-2 py-0.5 rounded bg-[#10243b] border border-[#1e3857] text-slate-300 text-[10px] capitalize">
                              {(ev.evidenceType || "other").replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="text-slate-400 font-mono">{formatFileSize(ev.fileSize)}</td>
                          <td className="text-slate-300">{collectorName}</td>
                          <td>
                            {sha256 ? (
                              <div className="flex items-center gap-1.5 font-mono text-[10px] text-slate-400">
                                <span>{sha256.slice(0, 8)}...{sha256.slice(-6)}</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    copyToClipboard(sha256, ev._id || ev.id);
                                  }}
                                  className="text-slate-400 hover:text-white"
                                  title="Copy SHA-256"
                                >
                                  {copiedId === (ev._id || ev.id) ? (
                                    <Check size={12} className="text-emerald-400" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                            ) : (
                              <span className="text-slate-500">N/A</span>
                            )}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                ev.status === "verified"
                                  ? "severity-low"
                                  : ev.status === "under_investigation"
                                  ? "severity-medium"
                                  : "severity-high"
                              }`}
                            >
                              {(ev.status || "collected").replaceAll("_", " ")}
                            </span>
                          </td>
                          <td className="text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/evidence/${ev.evidenceId || ev._id || ev.id}`);
                              }}
                              className="view-button inline-flex hover:border-blue-500 hover:text-white"
                              title="View Details"
                            >
                              <Eye size={15} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {/* Pagination Footer Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-[#1b2d42] text-xs text-slate-400 bg-[#081522]">
                  <span>Showing Page {page} of {totalPages} ({totalCount} total)</span>
                  <div className="flex items-center gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="px-3 py-1 bg-[#0c1f36] border border-[#1b3b5f] disabled:opacity-40 rounded text-slate-300 cursor-pointer"
                    >
                      Previous
                    </button>
                    <button
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="px-3 py-1 bg-[#0c1f36] border border-[#1b3b5f] disabled:opacity-40 rounded text-slate-300 cursor-pointer"
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
