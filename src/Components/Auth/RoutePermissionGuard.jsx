import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { can, canAccessBranchManagement, getAdminSession, isBranchScopedSession, isSuperAdmin } from '../../Constant/AdminAuth';
import { getPagePermission } from '../../Constant/Permissions';

export const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4" dir="rtl">
      <div
        className="w-full max-w-2xl rounded-2xl border p-8 text-center shadow-[0_20px_45px_-25px_rgba(15,23,42,0.35)]"
        style={{
          backgroundColor: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-main)',
        }}
        role="alert"
      >
        <div
          className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border"
          style={{
            backgroundColor: 'var(--color-bg)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-primary)',
          }}
        >
          <span className="text-2xl font-black leading-none">!</span>
        </div>
        <p className="text-xl font-black leading-loose">
          You do not have permission to access this page.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="min-w-32 rounded-xl border px-5 py-3 text-sm font-black transition-all hover:opacity-90"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-main)',
              backgroundColor: 'var(--color-bg)',
            }}
          >
            Back
          </button>
          <button
            type="button"
            onClick={() => navigate('/dashboard', { replace: true })}
            className="min-w-32 rounded-xl px-5 py-3 text-sm font-black text-white transition-all hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export const RoutePermissionGuard = ({ children }) => {
  const location = useLocation();
  const currentSession = getAdminSession();
  const normalizedPath = location.pathname || '';
  const requiredPermission = getPagePermission(location.pathname);
  const superAdminOnly = normalizedPath.startsWith('/tenant-management');
  const branchManagementRoute = normalizedPath.startsWith('/branch-management');
  const branchScopedBlockedRoute = ['/tenant-management', '/branch-management']
    .some((path) => normalizedPath.startsWith(path));

  if (superAdminOnly && !isSuperAdmin()) {
    return <AccessDeniedPage />;
  }

  if (branchManagementRoute && !canAccessBranchManagement(currentSession)) {
    return <AccessDeniedPage />;
  }

  if (isBranchScopedSession(currentSession) && branchScopedBlockedRoute) {
    return <AccessDeniedPage />;
  }

  if (requiredPermission && !can(requiredPermission)) {
    return <AccessDeniedPage />;
  }

  return children;
};
