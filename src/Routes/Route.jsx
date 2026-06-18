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
import { AdminLogin } from '../Pages/Auth/AdminLogin';
import { isAdminAuthenticated } from '../Constant/AdminAuth';
import LandingPage from '../Pages/Landing/LandingPage';
import { StudentAttendanceHistory } from '../Pages/Students/AttendancePage/StudentAttendanceHistory';
import { RequirePermission, withPermission } from '../Components/Auth/RequirePermission';
import { RoleManagement } from '../Pages/RoleManagement/RoleManagement';
import { UserManagement } from '../Pages/RoleManagement/UserManagement';

const LoginRoute = () => {
  if (isAdminAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLogin />;
};

const ProtectedAppShell = () => {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/admin" replace state={{ from: location }} />;
  }

  return <SideBar />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<LandingPage />} />
      <Route path="/admin" element={<LoginRoute />} />
      <Route path="/login" element={<Navigate to="/admin" replace />} />

      <Route path="/" element={<ProtectedAppShell />}>
        <Route path="dashboard" element={withPermission(<Dashboard />, 'dashboard.view')} />
        <Route path="branch-management/create-branch" element={<Navigate to="/dashboard" replace />} />
        <Route path="branch-management/:branchId" element={<Navigate to="/dashboard" replace />} />
        <Route path="HRManagement" element={<RequirePermission anyPermissions={['teachers.create', 'staff.create']}><HRManagement /></RequirePermission>} />
        <Route path="staff/list" element={withPermission(<TeachersList staffType="staff" />, 'staff.view')} />
        <Route path="students/attendance-history/:id" element={withPermission(<StudentAttendanceHistory />, 'attendance.history.view')} />
        <Route path="role-management" element={withPermission(<RoleManagement />, 'role_management.view')} />
        <Route path="role-management/create" element={withPermission(<RoleManagement />, 'roles.create')} />
        <Route path="role-management/:roleId" element={withPermission(<RoleManagement />, 'roles.view')} />
        <Route path="role-management/:roleId/edit" element={withPermission(<RoleManagement />, 'roles.edit')} />
        <Route path="role-management/users" element={withPermission(<UserManagement />, 'users.view')} />
        <Route path="role-management/users/create" element={withPermission(<UserManagement />, 'users.create')} />
        <Route path="role-management/users/:userId" element={withPermission(<UserManagement />, 'users.view')} />
        <Route path="role-management/users/:userId/edit" element={withPermission(<UserManagement />, 'users.edit')} />
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

      <Route path="*" element={<Navigate to={isAdminAuthenticated() ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};
