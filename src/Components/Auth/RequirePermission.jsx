import React from 'react';
import { hasAllPermissions, hasAnyPermission, hasPermission } from '../../Constant/AdminAuth';
import { AccessDeniedPage } from './RoutePermissionGuard';

export const RequirePermission = ({ permission, anyPermissions, allPermissions, children }) => {
  const allowed =
    (permission ? hasPermission(permission) : true) &&
    (anyPermissions ? hasAnyPermission(anyPermissions) : true) &&
    (allPermissions ? hasAllPermissions(allPermissions) : true);

  if (!allowed) {
    return <AccessDeniedPage />;
  }

  return children;
};
