import { Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function RecentIncidents({ recentIncidents = [] }) {
  const navigate = useNavigate();

  return (
    <div className="panel incidents-panel">
      <div className="panel-head">
        <h3>Recent incidents</h3>
        <button onClick={() => navigate("/incidents")} className="link-button">
          View all <span>→</span>
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Severity</th>
              <th>Status</th>
              <th>Logged</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(recentIncidents) && recentIncidents.length > 0 ? (
              recentIncidents.slice(0, 5).map((incident) => {
                const idVal = incident.incidentId || incident._id || incident.id;
                const statusKey = (incident.status || "active").toLowerCase().replaceAll(" ", "-");
                const severityKey = (incident.severity || "medium").toLowerCase();
                const dateVal = incident.createdAt
                  ? new Date(incident.createdAt).toISOString().slice(0, 10)
                  : incident.createdDate || incident.date || "N/A";

                return (
                  <tr
                    key={incident._id || incident.incidentId || idVal}
                    className="table-row"
                    onClick={() => navigate(`/incidents/${idVal}`)}
                  >
                    <td className="incident-id">{idVal}</td>
                    <td className="incident-title">{incident.title}</td>
                    <td>
                      <span className={`badge severity-${severityKey}`}>{incident.severity || "medium"}</span>
                    </td>
                    <td>
                      <span className={`badge status-${statusKey}`}>{incident.status || "active"}</span>
                    </td>
                    <td>{dateVal}</td>
                    <td>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/incidents/${idVal}`);
                        }}
                        className="view-button"
                        aria-label={`View ${incident.title}`}
                      >
                        <Eye size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="empty-state">
                  No recent incidents recorded in MongoDB.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}