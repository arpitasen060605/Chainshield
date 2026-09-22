import { useState, useEffect } from "react";
import { CalendarDays, ChevronDown, ShieldAlert, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/layout/Layout";
import StatCard from "../components/common/StatCard";
import SeverityChart from "../components/dashboard/SeverityChart";
import TrendChart from "../components/dashboard/TrendChart";
import Activity from "../components/dashboard/Activity";
import VerificationSummary from "../components/dashboard/VerificationSummary";
import RecentIncidents from "../components/dashboard/RecentIncidents";
import { getDashboardStats } from "../services/dashboardService";
import { useAuth } from "../context/AuthContext";
import PlatformAdminDashboard from "./platform/PlatformAdminDashboard";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const role = String(user?.role || "").trim().toLowerCase();
  if (role === "platform_admin") {
    return <PlatformAdminDashboard />;
  }

  const [statsData, setStatsData] = useState(null);
  const [severityBreakdown, setSeverityBreakdown] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await getDashboardStats();

        if (res.success) {
          if (res.stats) setStatsData(res.stats);
          if (res.severityBreakdown) setSeverityBreakdown(res.severityBreakdown);
          if (Array.isArray(res.recentIncidents)) setRecentIncidents(res.recentIncidents);
          if (Array.isArray(res.recentActivity)) setRecentActivity(res.recentActivity);
        }
      } catch (err) {
        console.error("[Dashboard] Analytics fetch error:", err);
        setError("Unable to load live dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const totalIncidents = statsData?.totalIncidents ?? 0;
  const openIncidents = statsData?.openIncidents ?? 0;
  const closedIncidents = statsData?.closedIncidents ?? 0;
  const criticalIncidents = statsData?.criticalIncidents ?? 0;
  const totalEvidence = statsData?.totalEvidence ?? 0;
  const verifiedEvidence = statsData?.verifiedEvidence ?? 0;
  const pendingVerification = statsData?.pendingVerification ?? 0;

  const dashboardStats = [
    { title: "Total incidents", value: String(totalIncidents), meta: "Live feed", tone: "purple", icon: "file" },
    { title: "Open incidents", value: String(openIncidents), meta: "Active", tone: "red", icon: "shield" },
    { title: "Critical", value: String(criticalIncidents), meta: "Urgent", tone: "red", icon: "alert" },
    { title: "Closed", value: String(closedIncidents), meta: "Resolved", tone: "green", icon: "checkCircle" },
    { title: "Evidence", value: String(totalEvidence), meta: "Vault", tone: "blue", icon: "folder" },
    { title: "Verified", value: String(verifiedEvidence), meta: "Integrity", tone: "green", icon: "check" },
    { title: "Pending", value: String(pendingVerification), meta: "Needs review", tone: "purple", icon: "clock" },
  ];

  const hasNoData = !loading && !error && totalIncidents === 0 && totalEvidence === 0;

  return (
    <Layout>
      <div className="page-heading">
        <div>
          <h1>Security operations dashboard</h1>
          <p>Overview of live incidents, evidence integrity, and operational response status.</p>
        </div>

        <button className="date-button" type="button">
          <CalendarDays size={17} />
          <span>Live telemetry</span>
          <ChevronDown size={15} />
        </button>
      </div>

      {loading && (
        <div className="dashboard-state">
          <ShieldAlert size={18} />
          Loading dashboard metrics...
        </div>
      )}

      {!loading && error && (
        <div className="dashboard-state error">
          <ShieldAlert size={18} />
          {error}
        </div>
      )}

      {!loading && !error && (
        <>
          <section className="stats-grid dashboard-stats-grid">
            {dashboardStats.map((stat) => (
              <StatCard key={stat.title} {...stat} />
            ))}
          </section>

          {hasNoData && (
            <div className="dashboard-state">
              <Sparkles size={18} />
              No operational data is available yet. Your security sources will appear here once activity is recorded.
            </div>
          )}

          {!hasNoData && (
            <>
              <section className="middle-grid">
                <SeverityChart severityBreakdown={severityBreakdown} statsData={statsData} />
                <TrendChart recentIncidents={recentIncidents} />
                <Activity recentActivity={recentActivity} />
              </section>

              <section className="bottom-grid">
                <RecentIncidents recentIncidents={recentIncidents} />
                <VerificationSummary statsData={statsData} />
              </section>
            </>
          )}
        </>
      )}
    </Layout>
  );
}