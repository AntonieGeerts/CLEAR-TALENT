import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { Competencies } from './pages/Competencies';
import { RoleProfiles } from './pages/RoleProfiles';
import { Goals } from './pages/Goals';
import { SkillGaps } from './pages/SkillGaps';
import { IDPs } from './pages/IDPs';
import { SystemAdminDashboard } from './pages/SystemAdminDashboard';
import { TenantDetail } from './pages/TenantDetail';
import { OrganizationalGoals } from './pages/OrganizationalGoals';
import { PIPs } from './pages/PIPs';
import { AdminRoles } from './pages/AdminRoles';
import { AdminStaff } from './pages/AdminStaff';
import { AdminAuditLogs } from './pages/AdminAuditLogs';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Public Route Component (redirect if already logged in)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="admin" element={<SystemAdminDashboard />} />
        <Route path="admin/tenants/:tenantId" element={<TenantDetail />} />
        <Route path="admin/roles" element={<AdminRoles />} />
        <Route path="admin/staff" element={<AdminStaff />} />
        <Route path="admin/audit-logs" element={<AdminAuditLogs />} />
        <Route path="organizational-goals" element={<OrganizationalGoals />} />
        <Route path="pips" element={<PIPs />} />
        <Route path="competencies" element={<Competencies />} />
        <Route path="roles" element={<RoleProfiles />} />
        <Route path="goals" element={<Goals />} />
        <Route path="skill-gaps" element={<SkillGaps />} />
        <Route path="idps" element={<IDPs />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
