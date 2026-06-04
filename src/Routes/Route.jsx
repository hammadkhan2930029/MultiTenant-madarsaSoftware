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
import { AdminLogin } from '../Pages/Auth/AdminLogin';
import { isAdminAuthenticated } from '../Constant/AdminAuth';
import LandingPage from '../Pages/Landing/LandingPage';

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
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="branch-management/create-branch" element={<Navigate to="/dashboard" replace />} />
        <Route path="branch-management/:branchId" element={<Navigate to="/dashboard" replace />} />
        <Route path="HRManagement" element={<HRManagement />} />
        <Route path="staff/list" element={<TeachersList staffType="staff" />} />
        <Route path="finance/*" element={<FinanceRoutes />} />
        <Route path="hifz/*" element={<HifzRoutes />} />

        {DepartmentRoutes}
        {ProfileRoutes}
        {StudentRoutes}
        {SettingRoutes}
        {TeacherRoutes}
        {ExamRoutes}
      </Route>

      <Route path="*" element={<Navigate to={isAdminAuthenticated() ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};
