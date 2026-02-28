import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { AdminApplicationDetailsPage } from '../pages/Admin/AdminApplicationDetailsPage';
import { AdminDashboardConversationsPage } from '../pages/Admin/AdminDashboardConversationsPage';
import { AdminDashboardHome } from '../pages/Admin/AdminDashboardHome';
import { AdminDashboardLayout } from '../pages/Admin/AdminDashboardLayout';
import { ApplyPage } from '../pages/Apply/ApplyPage';
import { ApplicationDetailsPage } from '../pages/Application/ApplicationDetailsPage';
import { DashboardChatPage } from '../pages/Dashboard/DashboardChatPage';
import { LoginPage } from '../pages/Auth/LoginPage';
import { DashboardApplicationsPage } from '../pages/Dashboard/DashboardApplicationsPage';
import { DashboardHome } from '../pages/Dashboard/DashboardHome';
import { DashboardLayout } from '../pages/Dashboard/DashboardLayout';
import { DashboardProfilePage } from '../pages/Dashboard/DashboardProfilePage';
import { HomePage } from '../pages/Home/HomePage';

const ProtectedRoute = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const AdminRoute = () => {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'ADMIN') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/apply" element={<ApplyPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="chat" element={<DashboardChatPage />} />
          <Route path="applications" element={<DashboardApplicationsPage />} />
          <Route path="profile" element={<DashboardProfilePage />} />
        </Route>
        <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
        <Route path="/applications/:applicationId" element={<ApplicationDetailsPage />} />
      </Route>

      <Route element={<AdminRoute />}>
        <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
          <Route index element={<AdminDashboardHome />} />
          <Route path="chat" element={<AdminDashboardConversationsPage />} />
          <Route path="chat/:conversationId" element={<DashboardChatPage />} />
        </Route>
        <Route path="/admin/applications/:applicationId" element={<AdminApplicationDetailsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
