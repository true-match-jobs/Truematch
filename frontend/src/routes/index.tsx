import { Suspense, lazy } from 'react';
import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const AdminApplicationDetailsPage = lazy(() =>
  import('../pages/Admin/AdminApplicationDetailsPage').then((module) => ({ default: module.AdminApplicationDetailsPage }))
);
const AdminDashboardConversationsPage = lazy(() =>
  import('../pages/Admin/AdminDashboardConversationsPage').then((module) => ({ default: module.AdminDashboardConversationsPage }))
);
const AdminDashboardHome = lazy(() => import('../pages/Admin/AdminDashboardHome').then((module) => ({ default: module.AdminDashboardHome })));
const AdminDashboardLayout = lazy(() =>
  import('../pages/Admin/AdminDashboardLayout').then((module) => ({ default: module.AdminDashboardLayout }))
);
const AdminDashboardProfilePage = lazy(() =>
  import('../pages/Admin/AdminDashboardProfilePage').then((module) => ({ default: module.AdminDashboardProfilePage }))
);
const AdminNotificationComposerPage = lazy(() =>
  import('../pages/Admin/AdminNotificationComposerPage').then((module) => ({ default: module.AdminNotificationComposerPage }))
);
const AdminTotalUsersPage = lazy(() =>
  import('../pages/Admin/AdminTotalUsersPage').then((module) => ({ default: module.AdminTotalUsersPage }))
);
const ApplyPage = lazy(() => import('../pages/Apply/ApplyPage').then((module) => ({ default: module.ApplyPage })));
const ApplicationDetailsPage = lazy(() =>
  import('../pages/Application/ApplicationDetailsPage').then((module) => ({ default: module.ApplicationDetailsPage }))
);
const EmploymentApplicationPage = lazy(() =>
  import('../pages/Application/EmploymentApplicationPage').then((module) => ({ default: module.EmploymentApplicationPage }))
);
const DashboardChatPage = lazy(() => import('../pages/Dashboard/DashboardChatPage').then((module) => ({ default: module.DashboardChatPage })));
const LoginPage = lazy(() => import('../pages/Auth/LoginPage').then((module) => ({ default: module.LoginPage })));
const VerifyEmailPage = lazy(() => import('../pages/Auth/VerifyEmailPage').then((module) => ({ default: module.VerifyEmailPage })));
const DashboardApplicationsPage = lazy(() =>
  import('../pages/Dashboard/DashboardApplicationsPage').then((module) => ({ default: module.DashboardApplicationsPage }))
);
const DashboardConversationsPage = lazy(() =>
  import('../pages/Dashboard/DashboardConversationsPage').then((module) => ({ default: module.DashboardConversationsPage }))
);
const DashboardHome = lazy(() => import('../pages/Dashboard/DashboardHome').then((module) => ({ default: module.DashboardHome })));
const DashboardLayout = lazy(() => import('../pages/Dashboard/DashboardLayout').then((module) => ({ default: module.DashboardLayout })));
const DashboardProfilePage = lazy(() =>
  import('../pages/Dashboard/DashboardProfilePage').then((module) => ({ default: module.DashboardProfilePage }))
);
const MyWallet = lazy(() => import('../pages/Dashboard/MyWallet').then((module) => ({ default: module.MyWallet })));
const AdminAllApplicationsPage = lazy(() =>
  import('../pages/Admin/AdminAllApplicationsPage').then((module) => ({ default: module.AdminAllApplicationsPage }))
);
const UserNotificationsPage = lazy(() =>
  import('../pages/Notification/UserNotificationsPage').then((module) => ({ default: module.UserNotificationsPage }))
);
const UserNotificationDetailsPage = lazy(() =>
  import('../pages/Notification/UserNotificationDetailsPage').then((module) => ({ default: module.UserNotificationDetailsPage }))
);
const HomePage = lazy(() => import('../pages/Home/HomePage').then((module) => ({ default: module.HomePage })));
const LogoGeneratorPage = lazy(() =>
  import('../pages/Home/LogoGeneratorPage').then((module) => ({ default: module.LogoGeneratorPage }))
);

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

const HomeRoute = () => {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <HomePage />;
};

export const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingSpinner className="min-h-screen" />}>
      <Routes>
        <Route path="/" element={<HomeRoute />} />
        <Route path="/logo-generator" element={<LogoGeneratorPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardHome />} />
            <Route path="chat" element={<DashboardConversationsPage />} />
            <Route path="applications" element={<DashboardApplicationsPage />} />
            <Route path="profile" element={<DashboardProfilePage />} />
            <Route path="wallet" element={<MyWallet />} />
            <Route path="notifications" element={<UserNotificationsPage />} />
          </Route>
          <Route path="/chat/:conversationId" element={<DashboardChatPage />} />
          <Route path="/notifications/:notificationId" element={<UserNotificationDetailsPage />} />
          <Route path="/notifications" element={<Navigate to="/dashboard/notifications" replace />} />
          <Route path="/chat" element={<Navigate to="/dashboard/chat" replace />} />
          <Route path="/applications/:applicationId" element={<ApplicationDetailsPage />} />
          <Route path="/applications/:applicationId/employment" element={<EmploymentApplicationPage />} />
        </Route>

        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardLayout />}>
            <Route index element={<AdminDashboardHome />} />
            <Route path="chat" element={<AdminDashboardConversationsPage />} />
            <Route path="profile" element={<AdminDashboardProfilePage />} />
          </Route>
          <Route path="/admin/applications/:applicationId" element={<AdminApplicationDetailsPage />} />
          <Route path="/admin/dashboard/applications" element={<AdminAllApplicationsPage />} />
          <Route path="/admin/dashboard/users" element={<AdminTotalUsersPage />} />
          <Route path="/admin/dashboard/notifications/:userId/compose" element={<AdminNotificationComposerPage />} />
          <Route path="/admin/users" element={<AdminTotalUsersPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};
