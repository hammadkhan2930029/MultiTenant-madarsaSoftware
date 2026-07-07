import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SideBar } from '../Components/SideBar/sidebar';
import { Dashboard } from '../Pages/Dashboard/dashboard';
import { StudentRoutes } from './StudentRoutes';
import { TeacherRoutes } from './TeacherRoutes';
import { DepartmentRoutes } from './DepartmentRoutes';
import { ProfileRoutes } from './ProfileRoutes';
import { HRManagement } from '../Pages/HRManagement/HRManagement';
import { TeachersList } from '../Pages/Teachers/TeacherList/TeachersList';
import { SettingRoutes } from './SettingRoutes';
import { FinanceRoutes } from './FinanceRoutes';
import { HifzRoutes } from './HifzRoutes';
import { ExamRoutes } from './ExamRoutes';
import { StoreRoutes } from './StoreRoutes';
import { AdminLogin, UserLogin } from '../Pages/Auth/AdminLogin';
import { getDefaultRouteForSession } from '../Pages/Auth/authLandingRoutes';
import { getAdminSession, isAdminAuthenticated, validateCurrentTenantSession } from '../Constant/AdminAuth';
import { SESSION_EXPIRED_EVENT } from '../Constant/Api';
import { StudentAttendanceHistory } from '../Pages/Students/AttendancePage/StudentAttendanceHistory';
import { RequirePermission } from '../Components/Auth/RequirePermission';
import { RoutePermissionGuard } from '../Components/Auth/RoutePermissionGuard';
import { withPermission } from '../Components/Auth/permissionGuards';
import { RoleManagement } from '../Pages/RoleManagement/RoleManagement';
import { UserManagement } from '../Pages/RoleManagement/UserManagement';
import { TenantManagement } from '../Pages/TenantManagement/TenantManagement';

const LoginRoute = () => {
  if (isAdminAuthenticated()) {
    return <Navigate to={getDefaultRouteForSession(getAdminSession())} replace />;
  }

  return <AdminLogin />;
};

const UserLoginRoute = () => {
  if (isAdminAuthenticated()) {
    return <Navigate to={getDefaultRouteForSession(getAdminSession())} replace />;
  }

  return <UserLogin />;
};

const ProtectedAppShell = () => {
  const location = useLocation();
  const [isCheckingSession, setIsCheckingSession] = React.useState(true);
  const [sessionExpired, setSessionExpired] = React.useState(false);

  React.useEffect(() => {
    let isMounted = true;

    const handleSessionExpired = () => {
      if (isMounted) setSessionExpired(true);
    };

    window.addEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);

    validateCurrentTenantSession()
      .then(() => {
        if (isMounted) setIsCheckingSession(false);
      })
      .catch(() => {
        if (isMounted) {
          setSessionExpired(true);
          setIsCheckingSession(false);
        }
      });

    return () => {
      isMounted = false;
      window.removeEventListener(SESSION_EXPIRED_EVENT, handleSessionExpired);
    };
  }, [location.pathname]);

  if (isCheckingSession) {
    return null;
  }

  if (sessionExpired || !isAdminAuthenticated()) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return (
    <RoutePermissionGuard>
      <SideBar />
    </RoutePermissionGuard>
  );
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin" replace />} />
      <Route path="/contact" element={<Navigate to="/admin" replace />} />
      <Route path="/admin" element={<LoginRoute />} />
      <Route path="/login" element={<UserLoginRoute />} />

      <Route path="/" element={<ProtectedAppShell />}>
        <Route path="dashboard" element={withPermission(<Dashboard />, 'dashboard.view')} />
        <Route path="branch-management/create-branch" element={<Navigate to="/dashboard" replace />} />
        <Route path="branch-management/:branchId" element={<Navigate to="/dashboard" replace />} />
        <Route path="HRManagement" element={<RequirePermission anyPermissions={['teachers.create', 'staff.create']}><HRManagement /></RequirePermission>} />
        <Route path="staff/list" element={withPermission(<TeachersList staffType="staff" />, 'staff.view')} />
        <Route path="students/attendance-history/:id" element={withPermission(<StudentAttendanceHistory />, 'attendance.history.view')} />
        <Route path="role-management" element={withPermission(<RoleManagement />, 'role_management.view')} />
        <Route path="role-management/create" element={withPermission(<RoleManagement />, 'roles.manage')} />
        <Route path="role-management/:roleId" element={withPermission(<RoleManagement />, 'roles.view')} />
        <Route path="role-management/:roleId/edit" element={withPermission(<RoleManagement />, 'roles.manage')} />
        <Route path="role-management/users" element={withPermission(<UserManagement />, 'users.view')} />
        <Route path="role-management/users/create" element={withPermission(<UserManagement />, 'users.manage')} />
        <Route path="role-management/users/:userId" element={withPermission(<UserManagement />, 'users.view')} />
        <Route path="role-management/users/:userId/edit" element={withPermission(<UserManagement />, 'users.manage')} />
        <Route path="tenant-management" element={withPermission(<TenantManagement />, 'tenant_management.view')} />
        <Route path="tenant-management/create" element={withPermission(<TenantManagement />, 'tenant_management.view')} />
        <Route path="tenant-management/:tenantId" element={withPermission(<TenantManagement />, 'tenant_management.view')} />
        <Route path="tenant-management/:tenantId/edit" element={withPermission(<TenantManagement />, 'tenant_management.view')} />
        <Route path="finance/*" element={<FinanceRoutes />} />
        <Route path="hifz/*" element={<HifzRoutes />} />

        {DepartmentRoutes}
        {ProfileRoutes}
        {StudentRoutes}
        {SettingRoutes}
        {TeacherRoutes}
        {ExamRoutes}
        {StoreRoutes}
      </Route>

      <Route path="*" element={<Navigate to={isAdminAuthenticated() ? '/dashboard' : '/admin'} replace />} />
    </Routes>
  );
};
