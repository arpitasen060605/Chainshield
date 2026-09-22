import { useState } from "react";
import {
  ShieldAlert,
  UserCheck,
  Upload,
  Hash,
  Database,
  CheckCircle2,
  RefreshCw,
  CheckCheck,
  Clock,
  Plus,
  User,
  X,
  FileText,
  Tag,
} from "lucide-react";

// Icon and color mapping per action type
const getActionMeta = (action) => {
  switch (action) {
    case "Incident Created":
      return { icon: ShieldAlert, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    case "Investigator Assigned":
      return { icon: UserCheck, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/30" };
    case "Evidence Uploaded":
      return { icon: Upload, color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30" };
    case "Evidence Hash Generated":
      return { icon: Hash, color: "text-amber-400 bg-amber-500/10 border-amber-500/30" };
    case "Blockchain Record Created":
      return { icon: Database, color: "text-purple-400 bg-purple-500/10 border-purple-500/30" };
    case "Evidence Verified":
      return { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    case "Investigation Updated":
      return { icon: RefreshCw, color: "text-blue-400 bg-blue-500/10 border-blue-500/30" };
    case "Incident Resolved":
      return { icon: CheckCheck, color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30" };
    default:
      return { icon: Clock, color: "text-slate-400 bg-slate-500/10 border-slate-500/30" };
  }
};

const getStatusBadgeClass = (status) => {
  switch (status?.toUpperCase()) {
    case "VERIFIED":
    case "RESOLVED":
    case "COMPLETED":
      return "bg-emerald-500/10 border-emerald-500/30 text-emerald-400";
    case "IN_PROGRESS":
    case "UNDER INVESTIGATION":
      return "bg-blue-500/10 border-blue-500/30 text-blue-400";
    case "PENDING":
    case "OPEN":
      return "bg-amber-500/10 border-amber-500/30 text-amber-400";
    default:
      return "bg-slate-500/10 border-slate-500/30 text-slate-300";
  }
};

export default function InvestigationTimeline({ events = [], onAddEvent }) {
  const [timelineEvents, setTimelineEvents] = useState(events);
  const [showAddModal, setShowAddModal] = useState(false);

  const [newEvent, setNewEvent] = useState({
    action: "Investigation Updated",
    user: "Alex Mercer",
    status: "COMPLETED",
    description: "",
  });

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newEvent.action) return;

    const now = new Date();
    const formattedTime =
      now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
      " - " +
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const createdEvent = {
      action: newEvent.action,
      user: newEvent.user || "Investigator",
      timestamp: formattedTime,
      status: newEvent.status || "COMPLETED",
      description: newEvent.description || "Timeline event recorded manually.",
    };

    const updatedList = [createdEvent, ...timelineEvents];
    setTimelineEvents(updatedList);

    if (onAddEvent) {
      onAddEvent(createdEvent);
    }

    setNewEvent({
      action: "Investigation Updated",
      user: "Alex Mercer",
      status: "COMPLETED",
      description: "",
    });
    setShowAddModal(false);
  };

  return (
    <div className="bg-[#0b1827] border border-[#203246] rounded-2xl p-5 shadow-2xl space-y-5 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
        <div>
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Clock size={17} className="text-purple-400" /> Investigation Timeline
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Chronological audit trail of investigation actions, evidence status, and case updates.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600 hover:text-white text-blue-300 rounded-lg text-xs font-semibold transition"
        >
          <Plus size={14} /> Add Timeline Event
        </button>
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-7 space-y-6 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-[#182b3f]">
        {timelineEvents && timelineEvents.length > 0 ? (
          timelineEvents.map((evt, idx) => {
            const actionText = evt.action || "Timeline Event";
            const meta = getActionMeta(actionText);
            const Icon = meta.icon;

            const performerName =
              typeof evt.performedBy === "object" && evt.performedBy?.name
                ? evt.performedBy.name
                : evt.performedBy || evt.user || "Investigator";

            const formattedTime = evt.timestamp
              ? new Date(evt.timestamp).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Just now";

            return (
              <div key={evt._id || idx} className="relative group">
                {/* Node Icon Circle */}
                <div
                  className={`absolute -left-7 top-0 w-6 h-6 rounded-full border flex items-center justify-center ${meta.color} shadow-md`}
                >
                  <Icon size={12} />
                </div>

                {/* Event Card */}
                <div className="bg-[#071322] border border-[#17293d] hover:border-[#253f5c] rounded-xl p-3.5 transition space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 text-xs sm:text-sm">{actionText}</span>
                      {evt.status && (
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(
                            evt.status
                          )}`}
                        >
                          {evt.status}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock size={11} className="text-slate-500" /> {formattedTime}
                    </span>
                  </div>

                  {evt.description && (
                    <p className="text-slate-300 leading-relaxed text-[11px] bg-[#050e18] p-2.5 rounded-lg border border-[#122336]">
                      {evt.description}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-[#122336]">
                    <span className="flex items-center gap-1.5 font-medium text-slate-300">
                      <User size={12} className="text-blue-400" /> Performed by: {performerName}
                    </span>
                    <span className="text-slate-500 font-mono">Event #{timelineEvents.length - idx}</span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-slate-400 text-center py-6">No timeline events recorded for this incident yet.</p>
        )}
      </div>

      {/* Add Event Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <form
            onSubmit={handleAddSubmit}
            className="bg-[#0b1827] border border-[#20344d] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl text-xs"
          >
            <div className="flex items-center justify-between border-b border-[#1b2d42] pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Plus size={16} className="text-blue-400" /> Record Timeline Event
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Action Type *</label>
              <select
                value={newEvent.action}
                onChange={(e) => setNewEvent({ ...newEvent, action: e.target.value })}
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3 py-2 text-slate-200 outline-none"
              >
                <option value="Incident Created">Incident Created</option>
                <option value="Investigator Assigned">Investigator Assigned</option>
                <option value="Evidence Uploaded">Evidence Uploaded</option>
                <option value="Evidence Hash Generated">Evidence Hash Generated</option>
                <option value="Blockchain Record Created">Blockchain Record Created</option>
                <option value="Evidence Verified">Evidence Verified</option>
                <option value="Investigation Updated">Investigation Updated</option>
                <option value="Incident Resolved">Incident Resolved</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">User / Investigator</label>
                <input
                  type="text"
                  value={newEvent.user}
                  onChange={(e) => setNewEvent({ ...newEvent, user: e.target.value })}
                  placeholder="e.g. Alex Mercer"
                  className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3 py-2 text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Status</label>
                <select
                  value={newEvent.status}
                  onChange={(e) => setNewEvent({ ...newEvent, status: e.target.value })}
                  className="w-full bg-[#071322] border border-[#1d334c] rounded-lg px-3 py-2 text-slate-200 outline-none"
                >
                  <option value="COMPLETED">COMPLETED</option>
                  <option value="VERIFIED">VERIFIED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="PENDING">PENDING</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Description / Notes</label>
              <textarea
                rows="3"
                value={newEvent.description}
                onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                placeholder="Optional notes or details regarding this timeline action..."
                className="w-full bg-[#071322] border border-[#1d334c] rounded-lg p-2.5 text-slate-200 outline-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#102236] text-slate-300 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg shadow-lg"
              >
                Save Timeline Event
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
