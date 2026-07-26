import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppLayout } from "./components/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { UserManagementPage } from "./pages/UserManagementPage";
import { PwdProfilesPage } from "./pages/PwdProfilesPage";
import { PwdProfileViewPage } from "./pages/PwdProfileViewPage";
import { PwdProfileFormPage } from "./pages/PwdProfileFormPage";
import { WelfareDashboardPage } from "./pages/WelfareDashboardPage";
import { WelfareAssessmentPage } from "./pages/WelfareAssessmentPage";
import { AtRiskCasesPage } from "./pages/AtRiskCasesPage";
import { CaseDetailPage } from "./pages/CaseDetailPage";
import { ReferralTrackingPage } from "./pages/ReferralTrackingPage";
import { CreateReferralPage } from "./pages/CreateReferralPage";
import { ReportsPage } from "./pages/ReportsPage";
import { AuditLogsPage } from "./pages/AuditLogsPage";
import { MobileCaseUpdatePage } from "./pages/MobileCaseUpdatePage";
import { CaseNotesPage } from "./pages/CaseNotesPage";
import { SettingsPage } from "./pages/SettingsPage";

/** Shown while the session cookie is being verified against the server. */
function SessionLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-gray-400">
      Loading…
    </div>
  );
}

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  return user ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

/** Blocks the authenticated area until a real session exists. */
function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <SessionLoading />;
  if (!user) return <Navigate to="/" replace />;
  return <AppLayout />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRedirect />} />
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/pwd-profiles" element={<PwdProfilesPage />} />
        <Route path="/pwd-profiles/new" element={<PwdProfileFormPage />} />
        <Route path="/pwd-profiles/:id" element={<PwdProfileViewPage />} />
        <Route path="/pwd-profiles/:id/edit" element={<PwdProfileFormPage />} />
        {/* Welfare: /assessments = dashboard; /assessments/new or /assessments/new/:pwdId = form */}
        <Route path="/assessments" element={<WelfareDashboardPage />} />
        <Route path="/assessments/new" element={<WelfareAssessmentPage />} />
        <Route path="/assessments/new/:pwdId" element={<WelfareAssessmentPage />} />
        <Route path="/at-risk" element={<AtRiskCasesPage />} />
        {/* Case detail — dual risk result + Administrator confirmation */}
        <Route path="/at-risk/:caseId" element={<CaseDetailPage />} />
        <Route path="/referrals" element={<ReferralTrackingPage />} />
        <Route path="/referrals/new" element={<CreateReferralPage />} />
        <Route path="/case-notes" element={<CaseNotesPage />} />
        <Route path="/mobile-update" element={<MobileCaseUpdatePage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/account-settings" element={<UserManagementPage />} />
        <Route path="/audit-logs" element={<AuditLogsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
