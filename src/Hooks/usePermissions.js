import { useCallback } from 'react';
import {
  getAdminPermissions,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  isSuperAdmin,
} from '../Constant/AdminAuth';
import { getPagePermission } from '../Constant/Permissions';

export const usePermissions = () => {
  const permissions = getAdminPermissions();
  const superAdmin = isSuperAdmin();

  const hasPermission = useCallback((permission) => checkPermission(permission), []);
  const hasAnyPermission = useCallback((permissionList) => checkAnyPermission(permissionList), []);
  const hasAllPermissions = useCallback((permissionList) => checkAllPermissions(permissionList), []);

  const hasPageAccess = useCallback(
    (path) => {
      const permission = getPagePermission(path);
      return !permission || checkPermission(permission);
    },
    [],
  );

  return {
    permissions,
    isSuperAdmin: superAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasPageAccess,
  };
};
