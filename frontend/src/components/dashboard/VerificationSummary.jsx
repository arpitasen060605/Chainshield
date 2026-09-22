import { useNavigate } from "react-router-dom";

export default function VerificationSummary({ statsData }) {
  const navigate = useNavigate();
  const totalEvidence = statsData?.totalEvidence ?? 0;
  const verifiedCount = statsData?.verifiedEvidence ?? 0;
  const pendingCount = statsData?.pendingVerification ?? 0;
  const tamperedCount = statsData?.tamperedEvidence ?? 0;
  const percentage = totalEvidence > 0 ? Math.round((verifiedCount / totalEvidence) * 100) : 0;

  return (
    <div className="panel verification-panel">
      <div className="panel-head">
        <h3>Verification status</h3>
      </div>

      <div className="verification-body">
        <div className="progress-ring" aria-label={`${percentage}% verified`}>
          <div className="progress-value">{percentage}%</div>
        </div>

        <div className="verify-numbers">
          <div>
            <strong>{verifiedCount}</strong>
            <span>Verified</span>
          </div>
          <div>
            <strong className="green-text">{pendingCount}</strong>
            <span>Pending</span>
          </div>
          <div>
            <strong>{totalEvidence}</strong>
            <span>Total</span>
          </div>
          <div>
            <strong className="danger-text">{tamperedCount}</strong>
            <span>Alerts</span>
          </div>
        </div>
      </div>

      <button onClick={() => navigate("/verification")} className="verify-button">
        Go to verification <span>→</span>
      </button>
    </div>
  );
}