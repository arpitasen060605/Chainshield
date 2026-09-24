import { memo } from "react";
import { Upload, ShieldCheck, FileText, UserCheck, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

function getActionToneAndIcon(action = "") {
  const act = String(action);
  if (act.includes("Verified") || act.includes("VERIFIED")) return { tone: "green", icon: ShieldCheck };
  if (act.includes("Uploaded") || act.includes("UPLOADED")) return { tone: "blue", icon: Upload };
  if (act.includes("Report") || act.includes("REPORT")) return { tone: "purple", icon: FileText };
  if (act.includes("Created") || act.includes("CREATED")) return { tone: "orange", icon: ShieldAlert };
  return { tone: "blue", icon: UserCheck };
}

const Activity = memo(function Activity({ recentActivity = [] }) {
  const navigate = useNavigate();
  const recentLogs = Array.isArray(recentActivity) ? recentActivity.slice(0, 5) : [];

  return (
    <div className="panel activity-panel">
      <div className="panel-head">
        <h3>Recent activity</h3>
      </div>

      <div className="activity-list">
        {recentLogs.length > 0 ? (
          recentLogs.map((log) => {
            const { tone, icon: Icon } = getActionToneAndIcon(log.action);
            const userStr = typeof log.user === "object" ? log.user?.name || log.user?.email : log.user || log.userName || "";
            const resource = log.resource || log.details || (log.resourceType ? `${log.resourceType}: ${log.resourceId}` : "System event");
            const timeStr = log.timestamp
              ? new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
              : "Live";

            return (
              <div
                className="activity-item"
                key={log._id || log.id || `${log.action}-${timeStr}`}
                onClick={() => navigate("/audit-logs")}
              >
                <div className={`activity-icon ${tone}`}>
                  <Icon size={15} />
                </div>

                <div className="activity-copy">
                  <strong>{log.action}</strong>
                  <span>{userStr ? `${userStr} · ${resource}` : resource}</span>
                </div>

                <time>{timeStr}</time>
              </div>
            );
          })
        ) : (
          <div className="empty-state activity-empty">No recent activity logged in MongoDB.</div>
        )}
      </div>

      <button onClick={() => navigate("/audit-logs")} className="link-button">
        View all activity <span>→</span>
      </button>
    </div>
  );
});

export default Activity;