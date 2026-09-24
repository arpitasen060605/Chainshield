import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";
import PlatformAdminRoute from "./components/common/PlatformAdminRoute";

// Public & General Auth Pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/SignUp"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const Profile = lazy(() => import("./pages/Profile"));

// Incident Management Pages
const AllIncidents = lazy(() => import("./pages/incidents/AllIncidents"));
const CreateIncident = lazy(() => import("./pages/incidents/CreateIncident"));
const IncidentDetails = lazy(() => import("./pages/incidents/IncidentDetails"));

// Digital Evidence Management Pages
const AllEvidence = lazy(() => import("./pages/evidence/AllEvidence"));
const UploadEvidence = lazy(() => import("./pages/evidence/UploadEvidence"));
const EvidenceDetails = lazy(() => import("./pages/evidence/EvidenceDetails"));

// Verification Engine Pages
const VerifyEvidence = lazy(() => import("./pages/verification/VerifyEvidence"));
const VerificationHistory = lazy(() => import("./pages/verification/VerificationHistory"));

// Audit Telemetry Module Page
const AuditLogs = lazy(() => import("./pages/audit/AuditLogs"));

// Intelligence Reports Module Pages
const Reports = lazy(() => import("./pages/reports/Reports"));
const InvestigationReportView = lazy(() => import("./pages/reports/InvestigationReportView"));

// Users & Roles Module Page
const UsersRoles = lazy(() => import("./pages/users/UsersRoles"));

// System Settings Module Page
const SettingsPage = lazy(() => import("./pages/settings/Settings"));

// Platform Administration Page
const PlatformAdminDashboard = lazy(() => import("./pages/platform/PlatformAdminDashboard"));

const PageLoader = () => (
  <div style={{ display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", backgroundColor: "#050d18", color: "#60a5fa", fontFamily: "monospace", fontSize: "0.875rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
      <div style={{ width: "1.25rem", height: "1.25rem", border: "2px solid #2563eb", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
      <span>Loading ChainShield Module...</span>
    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public Authentication Routes */}
            <Route path="/" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Protected Application Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<Profile />} />

              {/* Dedicated Platform Admin Routes */}
              <Route element={<PlatformAdminRoute />}>
                <Route path="/platform" element={<PlatformAdminDashboard />} />
                <Route path="/platform/companies" element={<PlatformAdminDashboard />} />
              </Route>

              {/* Incident Management Module Routes */}
              <Route path="/incidents" element={<AllIncidents />} />
              <Route path="/incidents/create" element={<CreateIncident />} />
              <Route path="/incidents/:id" element={<IncidentDetails />} />

              {/* Connected Incident-Evidence Route */}
              <Route path="/incidents/:incidentId/evidence/upload" element={<UploadEvidence />} />

              {/* Digital Evidence Management Module Routes */}
              <Route path="/evidence" element={<AllEvidence />} />
              <Route path="/evidence/upload" element={<UploadEvidence />} />
              <Route path="/evidence/:id" element={<EvidenceDetails />} />

              {/* Evidence Verification Module Routes */}
              <Route path="/verification" element={<VerifyEvidence />} />
              <Route path="/verification/verify/:evidenceId" element={<VerifyEvidence />} />
              <Route path="/verification/history" element={<VerificationHistory />} />

              {/* Audit Logs Module Route */}
              <Route path="/audit-logs" element={<AuditLogs />} />

              {/* Reports Module Routes */}
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/view/:id" element={<InvestigationReportView />} />
              <Route path="/reports/incident/:incidentId" element={<Reports />} />

              {/* Users & Roles Module Route */}
              <Route path="/users" element={<UsersRoles />} />

              {/* System Settings Module Route */}
              <Route path="/settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}