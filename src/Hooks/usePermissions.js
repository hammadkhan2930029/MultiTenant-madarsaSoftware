import { useCallback } from 'react';
import {
  can,
  canAll,
  canAny,
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
  const canAccess = useCallback((permission) => can(permission), []);
  const canAccessAny = useCallback((permissionList) => canAny(permissionList), []);
  const canAccessAll = useCallback((permissionList) => canAll(permissionList), []);

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
    can: canAccess,
    canAny: canAccessAny,
    canAll: canAccessAll,
    hasPageAccess,
  };
};
