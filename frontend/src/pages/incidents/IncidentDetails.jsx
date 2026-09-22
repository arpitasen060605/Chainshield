import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../../components/layout/Layout";
import InvestigationTimeline from "../../components/incidents/InvestigationTimeline";
import {
  getIncidentById,
  updateIncidentStatus,
  assignIncident,
  updateIncident,
} from "../../services/incidentService";
import { getAllUsers } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import {
  ArrowLeft,
  User,
  FileText,
  FolderCheck,
  Plus,
  CheckCircle2,
  Edit,
  Tag,
  Eye,
  AlertCircle,
  Loader2,
  Shield,
  UserPlus,
  X,
  Server,
  AlertTriangle,
} from "lucide-react";

export default function IncidentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();

  const [incident, setIncident] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [statusUpdating, setStatusUpdating] = useState(false);
  const [assignUpdating, setAssignUpdating] = useState(false);
  const [editUpdating, setEditUpdating] = useState(false);

  // Assignment modal users state
  const [allUsers, setAllUsers] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Edit metadata form state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    severity: "high",
    threatVector: "",
    impact: "",
    affectedSystems: "",
  });

  const canAssign = ["admin", "lead_investigator"].includes(
    (currentUser?.role || "").toLowerCase()
  );

  const fetchIncidentDetails = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getIncidentById(id);
      if (res.success && res.incident) {
        setIncident(res.incident);
        setSelectedUserIds(
          Array.isArray(res.incident.assignedTo)
            ? res.incident.assignedTo.map((u) => u._id || u)
            : []
        );
        setEditForm({
          title: res.incident.title || "",
          description: res.incident.description || "",
          severity: res.incident.severity || "high",
          threatVector: res.incident.threatVector || "",
          impact: res.incident.impact || "",
          affectedSystems: Array.isArray(res.incident.affectedSystems)
            ? res.incident.affectedSystems.join(", ")
            : "",
        });
      } else {
        setError(res.message || "Incident not found");
      }
    } catch (err) {
      console.error("[IncidentDetails] Fetch error:", err);
      setError(
        err.response?.data?.message || "Access denied or failed to load incident details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchIncidentDetails();
    }
  }, [id]);

  // Load user list for assign modal if user has privilege
  const handleOpenAssignModal = async () => {
    setShowAssignModal(true);
    if ((currentUser?.role || "").toLowerCase() === "admin") {
      try {
        const res = await getAllUsers();
        if (res.success && Array.isArray(res.users)) {
          setAllUsers(res.users);
        }
      } catch (err) {
        console.error("Failed to load users for assignment:", err);
      }
    }
  };

  const handleStatusUpdate = async (newStatus) => {
    try {
      setStatusUpdating(true);
      const res = await updateIncidentStatus(id, newStatus);
      if (res.success && res.incident) {
        setIncident(res.incident);
        setShowStatusModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update incident status");
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    try {
      setAssignUpdating(true);
      const res = await assignIncident(id, selectedUserIds);
      if (res.success && res.incident) {
        setIncident(res.incident);
        setShowAssignModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign personnel");
    } finally {
      setAssignUpdating(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      setEditUpdating(true);
      const affectedSystemsArray = editForm.affectedSystems
        ? editForm.affectedSystems
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : [];

      const res = await updateIncident(id, {
        title: editForm.title,
        description: editForm.description,
        severity: editForm.severity,
        threatVector: editForm.threatVector,
        impact: editForm.impact,
        affectedSystems: affectedSystemsArray,
      });

      if (res.success && res.incident) {
        setIncident(res.incident);
        setShowEditModal(false);
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update incident metadata");
    } finally {
      setEditUpdating(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center py-24 text-slate-400 gap-3">
          <Loader2 className="animate-spin text-blue-500" size={36} />
          <span>Retrieving security case details from vault...</span>
        </div>
      </Layout>
    );
  }

  if (error || !incident) {
    return (
      <Layout>
        <div className="mb-6">
          <button
            onClick={() => navigate("/incidents")}
            className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to All Incidents
          </button>
          <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6 text-red-400 space-y-3">
            <div className="flex items-center gap-2 font-bold text-base">
              <AlertCircle size={20} /> Access Denied / Error
            </div>
            <p className="text-xs">{error || "Requested incident could not be found."}</p>
          </div>
        </div>
      </Layout>
    );
  }

  const incidentDisplayId = incident.incidentId || (incident._id
    ? `INC-${incident._id.slice(-6).toUpperCase()}`
    : incident.id);

  const currentStatus = incident.status || "active";
  const createdByName = incident.createdBy?.name || incident.createdBy?.email || "Unknown";
  const createdDateDisplay = incident.createdAt
    ? new Date(incident.createdAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : incident.createdDate || "N/A";

  const updatedDateDisplay = incident.updatedAt
    ? new Date(incident.updatedAt).toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : incident.updatedDate || "N/A";

  return (
    <Layout>
      {/* Header & Navigation */}
      <div className="mb-6">
        <button
          onClick={() => navigate("/incidents")}
          className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 font-medium mb-3 transition cursor-pointer"
        >
          <ArrowLeft size={14} /> Back to All Incidents
        </button>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/30">
                {incidentDisplayId}
              </span>
              <h1 className="text-xl lg:text-2xl font-bold text-white tracking-tight">
                {incident.title}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Threat Vector: <strong className="text-slate-300">{incident.threatVector || "Other"}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-3.5 py-2 bg-[#0c1f36] border border-[#1b3b5f] hover:bg-[#122b4a] text-slate-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Edit size={14} /> Edit Metadata
            </button>

            {canAssign && (
              <button
                onClick={handleOpenAssignModal}
                className="px-3.5 py-2 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600 hover:text-white text-blue-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
              >
                <UserPlus size={14} /> Assign Personnel
              </button>
            )}

            <button
              onClick={() => setShowStatusModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition cursor-pointer"
            >
              <Edit size={14} /> Update Status
            </button>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
        {/* Main Left Content: Details, Timeline */}
        <div className="lg:col-span-8 space-y-6">
          {/* Incident Overview Card */}
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2 border-b border-[#1b2d42] pb-3">
              <FileText size={16} className="text-blue-400" /> Incident Description & Triage Details
            </h3>
            <p className="text-slate-300 leading-relaxed text-xs sm:text-sm whitespace-pre-wrap">
              {incident.description}
            </p>

            {/* Impact & Affected Systems */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="bg-[#071322] p-3 rounded-xl border border-[#172a3e] space-y-1">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <Server size={14} className="text-cyan-400" /> Affected Systems / Assets
                </span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {Array.isArray(incident.affectedSystems) && incident.affectedSystems.length > 0 ? (
                    incident.affectedSystems.map((sys, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-[#0e2136] text-cyan-300 border border-cyan-500/30 rounded text-[10px]"
                      >
                        {sys}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500">None specified</span>
                  )}
                </div>
              </div>

              <div className="bg-[#071322] p-3 rounded-xl border border-[#172a3e] space-y-1">
                <span className="text-slate-400 text-[11px] font-semibold flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-400" /> Initial Impact Analysis
                </span>
                <p className="text-slate-300 text-xs pt-1">
                  {incident.impact || "No impact analysis documented yet."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#071322] p-3.5 rounded-xl border border-[#172a3e] mt-4">
              <div>
                <span className="text-slate-400 text-[10px] block">Severity Rating</span>
                <span className={`badge severity-${(incident.severity || "medium").toLowerCase()} mt-1 inline-block`}>
                  {incident.severity}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Current Status</span>
                <span className={`badge status-${currentStatus.toLowerCase().replaceAll("_", "-")} mt-1 inline-block`}>
                  {currentStatus.replaceAll("_", " ")}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Created On</span>
                <strong className="text-slate-300 block mt-1">{createdDateDisplay}</strong>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Last Updated</span>
                <strong className="text-slate-300 block mt-1">{updatedDateDisplay}</strong>
              </div>
            </div>
          </div>

          {/* Investigation Timeline */}
          <InvestigationTimeline
            events={incident.timeline || []}
          />
        </div>

        {/* Right Sidebar Details */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-white text-sm border-b border-[#1b2d42] pb-3">
              Case Metadata & Custody
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">Logged By (Creator)</span>
                <div className="flex items-center gap-2 text-slate-200 font-semibold mt-1 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                  <User size={15} className="text-blue-400" />
                  <div>
                    <div>{createdByName}</div>
                    {incident.createdBy?.role && (
                      <span className="text-[10px] text-slate-400 font-normal">
                        Role: {incident.createdBy.role}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <span className="text-slate-400 block text-[10px] mb-1">Assigned Personnel</span>
                {Array.isArray(incident.assignedTo) && incident.assignedTo.length > 0 ? (
                  <div className="space-y-1.5">
                    {incident.assignedTo.map((person) => (
                      <div
                        key={person._id || person}
                        className="flex items-center justify-between text-slate-200 bg-[#071322] p-2 rounded-lg border border-[#17283c]"
                      >
                        <div className="flex items-center gap-2">
                          <User size={14} className="text-cyan-400" />
                          <span className="font-medium">{person.name || person.email || person}</span>
                        </div>
                        {person.role && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#102236] text-slate-400 border border-[#1d3550]">
                            {person.role}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-slate-500 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                    No personnel assigned to case yet.
                  </div>
                )}
              </div>

              <div>
                <span className="text-slate-400 block text-[10px]">Threat Vector</span>
                <div className="flex items-center gap-2 text-slate-200 font-semibold mt-1 bg-[#071322] p-2.5 rounded-lg border border-[#17283c]">
                  <Tag size={15} className="text-purple-400" />
                  {incident.threatVector || "Other"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0b1827] border border-[#20344d] rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-xs">
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-base">Update Case Status</h3>
              <button onClick={() => setShowStatusModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            <p className="text-slate-400">Select new status for incident {incidentDisplayId}:</p>
            <div className="space-y-2">
              {[
                { id: "active", label: "Active" },
                { id: "under_investigation", label: "Under Investigation" },
                { id: "containment", label: "Containment" },
                { id: "resolved", label: "Resolved" },
              ].map((st) => (
                <button
                  key={st.id}
                  disabled={statusUpdating}
                  onClick={() => handleStatusUpdate(st.id)}
                  className={`w-full text-left p-2.5 rounded-lg border flex items-center justify-between transition cursor-pointer ${
                    currentStatus === st.id
                      ? "bg-blue-600/20 border-blue-500 text-blue-300 font-bold"
                      : "bg-[#071322] border-[#1d334c] text-slate-300 hover:bg-[#102236]"
                  }`}
                >
                  <span>{st.label}</span>
                  {currentStatus === st.id && <CheckCircle2 size={15} className="text-blue-400" />}
                </button>
              ))}
            </div>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowStatusModal(false)}
                className="px-4 py-2 bg-[#102236] text-slate-300 rounded-lg cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Assignment Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleAssignSubmit}
            className="bg-[#0b1827] border border-[#20344d] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <UserPlus size={18} className="text-blue-400" /> Assign Personnel to Case
              </h3>
              <button type="button" onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <p className="text-slate-400">
              Select users to assign to case <strong className="text-slate-200">{incidentDisplayId}</strong>:
            </p>

            {allUsers.length > 0 ? (
              <div className="max-h-48 overflow-y-auto space-y-2 bg-[#071322] p-3 rounded-lg border border-[#17293d]">
                {allUsers.map((u) => {
                  const isSelected = selectedUserIds.includes(u._id);
                  return (
                    <label
                      key={u._id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer border transition ${
                        isSelected
                          ? "bg-blue-600/20 border-blue-500 text-white"
                          : "border-transparent text-slate-300 hover:bg-[#0f2136]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUserIds([...selectedUserIds, u._id]);
                            } else {
                              setSelectedUserIds(selectedUserIds.filter((id) => id !== u._id));
                            }
                          }}
                          className="accent-blue-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-semibold">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#091728] border border-[#1d344f] text-slate-400">
                        {u.role}
                      </span>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Enter User MongoDB IDs (Comma Separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 64b8f01a..., 64b8f01b..."
                  value={selectedUserIds.join(", ")}
                  onChange={(e) =>
                    setSelectedUserIds(
                      e.target.value
                        .split(",")
                        .map((s) => s.trim())
                        .filter(Boolean)
                    )
                  }
                  className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAssignModal(false)}
                className="px-4 py-2 bg-[#102236] text-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assignUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {assignUpdating ? <Loader2 size={14} className="animate-spin" /> : "Save Assignment"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleEditSubmit}
            className="bg-[#0b1827] border border-[#20344d] rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Edit size={18} className="text-blue-400" /> Edit Incident Details
              </h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Title</label>
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                <select
                  value={editForm.severity}
                  onChange={(e) => setEditForm({ ...editForm, severity: e.target.value })}
                  className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
                >
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Threat Vector</label>
                <input
                  type="text"
                  value={editForm.threatVector}
                  onChange={(e) => setEditForm({ ...editForm, threatVector: e.target.value })}
                  className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Affected Systems (Comma Separated)</label>
              <input
                type="text"
                value={editForm.affectedSystems}
                onChange={(e) => setEditForm({ ...editForm, affectedSystems: e.target.value })}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Impact Analysis</label>
              <input
                type="text"
                value={editForm.impact}
                onChange={(e) => setEditForm({ ...editForm, impact: e.target.value })}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description</label>
              <textarea
                rows="4"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 bg-[#102236] text-slate-300 rounded-lg cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={editUpdating}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg flex items-center gap-2 cursor-pointer"
              >
                {editUpdating ? <Loader2 size={14} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      )}
    </Layout>
  );
}
