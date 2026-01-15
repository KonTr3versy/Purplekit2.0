import { Routes, Route, Navigate } from 'react-router-dom';

import { useAuthStore } from '@/stores/auth';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';

// Dashboard pages
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { EngagementsPage } from '@/pages/engagements/EngagementsPage';
import { EngagementDetailPage } from '@/pages/engagements/EngagementDetailPage';
import { TechniquesManagementPage } from '@/pages/engagements/TechniquesManagementPage';
import { TechniquesPage } from '@/pages/techniques/TechniquesPage';
import { FindingsPage } from '@/pages/findings/FindingsPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { AnalyticsPage } from '@/pages/analytics/AnalyticsPage';
import { SettingsPage } from '@/pages/settings/SettingsPage';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}

export function App() {
  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/engagements" element={<EngagementsPage />} />
        <Route path="/engagements/:id" element={<EngagementDetailPage />} />
        <Route path="/engagements/:id/techniques" element={<TechniquesManagementPage />} />
        <Route path="/techniques" element={<TechniquesPage />} />
        <Route path="/findings" element={<FindingsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
