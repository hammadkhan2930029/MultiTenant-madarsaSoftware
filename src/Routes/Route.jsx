import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { SideBar } from '../Components/SideBar/sidebar';
import { Dashboard } from '../Pages/Dashboard/dashboard';
import { StudentRoutes } from './StudentRoutes';
import { TeacherRoutes } from './TeacherRoutes';
import { DepartmentRoutes } from './DepartmentRoutes';
import { ProfileRoutes } from './ProfileRoutes';
import { CreateBranch } from '../Pages/CreateBranches/CreateBranches';
import { HRManagement } from '../Pages/HRManagement/HRManagement';
import { SettingRoutes } from './SettingRoutes';
import { FinanceRoutes } from './FinanceRoutes';
import { HifzRoutes } from './HifzRoutes';
import { AdminLogin } from '../Pages/Auth/AdminLogin';
import { isAdminAuthenticated } from '../Constant/AdminAuth';

const LoginRoute = () => {
  if (isAdminAuthenticated()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AdminLogin />;
};

const ProtectedAppShell = () => {
  const location = useLocation();

  if (!isAdminAuthenticated()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <SideBar />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />

      <Route path="/" element={<ProtectedAppShell />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="branch-management/create-branch" element={<CreateBranch />} />
        <Route path="branch-management/campus-1" element={<CreateBranch />} />
        <Route path="branch-management/campus-2" element={<CreateBranch />} />
        <Route path="branch-management/campus-3" element={<CreateBranch />} />
        <Route path="HRManagement" element={<HRManagement />} />
        <Route path="finance/*" element={<FinanceRoutes />} />
        <Route path="hifz/*" element={<HifzRoutes />} />

        {DepartmentRoutes}
        {ProfileRoutes}
        {StudentRoutes}
        {SettingRoutes}
        {TeacherRoutes}
      </Route>

      <Route path="*" element={<Navigate to={isAdminAuthenticated() ? '/dashboard' : '/login'} replace />} />
    </Routes>
  );
};
