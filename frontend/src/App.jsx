import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/common/ProtectedRoute";

import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Register from "./pages/SignUp";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";

// Incident Management Pages
import AllIncidents from "./pages/incidents/AllIncidents";
import CreateIncident from "./pages/incidents/CreateIncident";
import IncidentDetails from "./pages/incidents/IncidentDetails";

// Digital Evidence Management Pages
import AllEvidence from "./pages/evidence/AllEvidence";
import UploadEvidence from "./pages/evidence/UploadEvidence";
import EvidenceDetails from "./pages/evidence/EvidenceDetails";

// Verification Engine Pages
import VerifyEvidence from "./pages/verification/VerifyEvidence";
import VerificationHistory from "./pages/verification/VerificationHistory";

// Audit Telemetry Module Page
import AuditLogs from "./pages/audit/AuditLogs";

// Intelligence Reports Module Pages
import Reports from "./pages/reports/Reports";
import InvestigationReportView from "./pages/reports/InvestigationReportView";

// Users & Roles Module Page
import UsersRoles from "./pages/users/UsersRoles";

// System Settings Module Page
import SettingsPage from "./pages/settings/Settings";

import PlatformAdminRoute from "./components/common/PlatformAdminRoute";
import PlatformAdminDashboard from "./pages/platform/PlatformAdminDashboard";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
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
      </BrowserRouter>
    </AuthProvider>
  );
}