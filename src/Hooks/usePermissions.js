import { useCallback, useEffect, useState } from 'react';
import {
  ADMIN_SESSION_UPDATED_EVENT,
  can,
  canAll,
  canAny,
  getAdminPermissions,
  hasAllPermissions as checkAllPermissions,
  hasAnyPermission as checkAnyPermission,
  hasPermission as checkPermission,
  isSuperAdmin,
  refreshPermissions as refreshSessionPermissions,
} from '../Constant/AdminAuth';
import { getPagePermission } from '../Constant/Permissions';

export const usePermissions = () => {
  const [, setSessionVersion] = useState(0);

  useEffect(() => {
    const handleSessionUpdated = () => setSessionVersion((version) => version + 1);
    window.addEventListener(ADMIN_SESSION_UPDATED_EVENT, handleSessionUpdated);
    return () => window.removeEventListener(ADMIN_SESSION_UPDATED_EVENT, handleSessionUpdated);
  }, []);

  const permissions = getAdminPermissions();
  const superAdmin = isSuperAdmin();

  const hasPermission = useCallback((permission) => checkPermission(permission), []);
  const hasAnyPermission = useCallback((permissionList) => checkAnyPermission(permissionList), []);
  const hasAllPermissions = useCallback((permissionList) => checkAllPermissions(permissionList), []);
  const canAccess = useCallback((permission) => can(permission), []);
  const canAccessAny = useCallback((permissionList) => canAny(permissionList), []);
  const canAccessAll = useCallback((permissionList) => canAll(permissionList), []);
  const refreshPermissions = useCallback(() => refreshSessionPermissions(), []);

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
    refreshPermissions,
    hasPageAccess,
  };
};
