import { API_BASE_URL, SESSION_EXPIRED_MESSAGE_KEY, apiRequest } from './Api';
import { SUPER_ADMIN_ROLE } from './Permissions';

const AUTH_KEY = 'madarsa_admin_auth';
const BRANCH_CONTEXT_KEY = 'madarsa_branch_context';
export const MADRASSA_PROFILE_UPDATED_EVENT = 'madarsa:madrassa-profile-updated';
export const TENANT_BRANDING_UPDATED_EVENT = 'madarsa:tenant-branding-updated';
export const ADMIN_SESSION_UPDATED_EVENT = 'madarsa:admin-session-updated';
export const BRANCH_CONTEXT_UPDATED_EVENT = 'madarsa:branch-context-updated';
const TENANT_SESSION_EXPIRED_MESSAGE = 'آپ کا سیشن اس مدرسہ ڈومین کے لیے درست نہیں ہے۔ براہ کرم دوبارہ لاگ اِن کریں۔';

export const defaultAdminCredentials = {
  username: 'admin',
  password: 'Admin@12345',
};

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const readSession = () => {
  if (!canUseStorage) return null;

  const stored = window.localStorage.getItem(AUTH_KEY);
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
};

const hasFixedBranchContext = (session) => {
  const value = session?.admin?.branchId ?? session?.user?.branchId ?? null;
  const branchId = value === null || value === undefined || value === '' ? null : Number(value);
  return Number.isFinite(branchId) && branchId > 0;
};

const clearBranchContextForFixedBranchSession = (session) => {
  if (!hasFixedBranchContext(session)) return;
  window.localStorage.removeItem(BRANCH_CONTEXT_KEY);
  window.dispatchEvent(new CustomEvent(BRANCH_CONTEXT_UPDATED_EVENT, {
    detail: { branchId: session?.admin?.branchId ?? session?.user?.branchId ?? null, mode: 'fixed' },
  }));
};

const writeSession = (session) => {
  if (!canUseStorage) return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
  clearBranchContextForFixedBranchSession(session);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_UPDATED_EVENT, { detail: session }));
};

const getSessionTenantId = (session) => {
  const value = session?.admin?.tenantId ?? session?.user?.tenantId ?? session?.tenantId ?? null;
  return value === null || value === undefined || value === '' ? null : Number(value);
};

const getCurrentTenantId = (tenantBranding) => {
  const value = tenantBranding?.tenant?.id ?? tenantBranding?.tenantId ?? null;
  return value === null || value === undefined || value === '' ? null : Number(value);
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return Array.from(new Set(permissions
    .map((permission) => {
      if (typeof permission === 'string') return permission;
      return permission?.permissionKey || permission?.permission_key || '';
    })
    .filter(Boolean)));
};

const normalizeRole = (role) => {
  if (!role) return null;

  if (typeof role === 'string') {
    return {
      id: null,
      name: role,
      roleName: role,
    };
  }

  const roleName = role.roleName || role.role_name || role.name || '';

  return {
    ...role,
    id: role.id ?? null,
    name: role.name || roleName,
    roleName,
  };
};

const buildSessionFromAuthData = (data, currentSession = null) => {
  const admin = data?.admin || data?.user || currentSession?.admin || null;
  const user = data?.user || admin;
  const role = normalizeRole(
    data?.role ||
    user?.roleDetails ||
    user?.role ||
    admin?.roleDetails ||
    admin?.role ||
    currentSession?.role ||
    null,
  );
  const permissions = normalizePermissions(
    data?.permissions || user?.permissions || admin?.permissions || currentSession?.permissions || [],
  );

  return {
    ...(currentSession || {}),
    isAuthenticated: true,
    token: data?.token || currentSession?.token,
    admin,
    user,
    role,
    permissions,
    loginAt: currentSession?.loginAt || new Date().toISOString(),
  };
};

const notifyMadrassaProfileUpdated = (profile) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(MADRASSA_PROFILE_UPDATED_EVENT, {
      detail: profile,
    }),
  );
};

const notifyTenantBrandingUpdated = (branding) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent(TENANT_BRANDING_UPDATED_EVENT, {
      detail: branding,
    }),
  );
};

const getRoleNameFromSession = (session) => {
  const role = session?.role || session?.admin?.roleDetails || session?.admin?.role || null;
  const roleName = typeof role === 'string' ? role : role?.roleName || role?.role_name;
  return roleName || session?.admin?.role || session?.user?.role || '';
};

const expireSession = (message = TENANT_SESSION_EXPIRED_MESSAGE) => {
  if (!canUseStorage) return;
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage?.setItem(SESSION_EXPIRED_MESSAGE_KEY, message);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_UPDATED_EVENT, { detail: null }));
};

const attachTenantBrandingToSession = (brandingData) => {
  const currentSession = readSession();
  if (!currentSession) return;

  writeSession({
    ...currentSession,
    currentTenant: brandingData?.tenant || null,
    tenantBranding: brandingData?.branding || null,
  });
};

const assertSessionMatchesTenant = (session, tenantBranding) => {
  if (!session?.token || !tenantBranding?.tenant) return;

  const currentTenantId = getCurrentTenantId(tenantBranding);
  const sessionTenantId = getSessionTenantId(session);
  const roleName = String(getRoleNameFromSession(session)).trim().toLowerCase();
  const isGlobalSuperAdmin = roleName === SUPER_ADMIN_ROLE && !sessionTenantId;

  if (isGlobalSuperAdmin) return;

  if (!sessionTenantId || (currentTenantId && sessionTenantId !== currentTenantId)) {
    expireSession();
    throw new Error(TENANT_SESSION_EXPIRED_MESSAGE);
  }
};

export const getAdminCredentials = () => defaultAdminCredentials;

export const getAdminSession = () => readSession();

export const getAdminToken = () => readSession()?.token || '';

export const isAdminAuthenticated = () => Boolean(getAdminToken());

export const getAdminRole = () => {
  const session = readSession();
  return normalizeRole(session?.role || session?.admin?.roleDetails || session?.user?.role || session?.admin?.role || null);
};

export const getAdminPermissions = () => {
  const session = readSession();
  return normalizePermissions(session?.permissions || session?.user?.permissions || session?.admin?.permissions || []);
};

export const isSuperAdmin = () => {
  const role = getAdminRole();
  const roleName = typeof role === 'string' ? role : role?.roleName || role?.role_name;
  const legacyRoleName = readSession()?.admin?.role;

  return roleName === SUPER_ADMIN_ROLE || legacyRoleName === SUPER_ADMIN_ROLE;
};

export const isTenantAdmin = () => {
  const session = readSession();
  if (getSessionBranchId(session)) return false;

  const role = getAdminRole();
  const roleName = typeof role === 'string' ? role : role?.roleName || role?.role_name;
  const legacyRoleName = session?.admin?.role;

  return roleName === 'admin' || legacyRoleName === 'admin';
};

export const getSessionBranchId = (session = readSession()) => {
  const value = session?.admin?.branchId ?? session?.user?.branchId ?? null;
  return value === null || value === undefined || value === '' ? null : Number(value);
};

export const getTenantBranchSettings = (session = readSession()) => ({
  ...(session?.tenantBranding?.settings || {}),
  ...(session?.currentTenant || {}),
});

export const isBranchSystemEnabled = (session = readSession()) => Boolean(
  getTenantBranchSettings(session)?.branchEnabled,
);

export const isBranchScopedSession = (session = readSession()) => {
  const branchId = getSessionBranchId(session);
  if (!branchId || isSuperAdmin()) return false;

  const role = normalizeRole(session?.role || session?.admin?.roleDetails || session?.user?.role || session?.admin?.role || null);
  const roleName = String(role?.roleName || session?.admin?.role || session?.user?.role || '').trim().toLowerCase();
  return roleName !== 'super_admin';
};

export const canAccessBranchManagement = (session = readSession()) => (
  isBranchSystemEnabled(session) &&
  isTenantAdmin() &&
  !isSuperAdmin() &&
  !isBranchScopedSession(session)
);

export const canUseTenantBranchContext = (session = readSession()) => (
  isBranchSystemEnabled(session) &&
  isTenantAdmin() &&
  !isSuperAdmin() &&
  !isBranchScopedSession(session)
);

export const getSelectedBranchContext = (session = readSession()) => {
  const tenantId = getSessionTenantId(session);
  const fallback = { tenantId, branchId: null, mode: 'all' };

  if (!canUseStorage || !canUseTenantBranchContext(session) || !tenantId) return fallback;

  try {
    const stored = JSON.parse(window.localStorage.getItem(BRANCH_CONTEXT_KEY) || 'null');
    if (!stored || Number(stored.tenantId) !== tenantId) return fallback;

    const branchId = stored.branchId === null || stored.branchId === undefined || stored.branchId === ''
      ? null
      : Number(stored.branchId);

    return {
      tenantId,
      branchId: Number.isFinite(branchId) && branchId > 0 ? branchId : null,
      mode: Number.isFinite(branchId) && branchId > 0 ? 'branch' : 'all',
    };
  } catch {
    return fallback;
  }
};

export const setSelectedBranchContext = (branchId = null, session = readSession()) => {
  if (!canUseStorage || !canUseTenantBranchContext(session)) return getSelectedBranchContext(session);

  const tenantId = getSessionTenantId(session);
  const normalizedBranchId = branchId === null || branchId === undefined || branchId === ''
    ? null
    : Number(branchId);
  const nextContext = {
    tenantId,
    branchId: Number.isFinite(normalizedBranchId) && normalizedBranchId > 0 ? normalizedBranchId : null,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(BRANCH_CONTEXT_KEY, JSON.stringify(nextContext));
  window.dispatchEvent(new CustomEvent(BRANCH_CONTEXT_UPDATED_EVENT, { detail: nextContext }));

  return getSelectedBranchContext(session);
};

export const clearSelectedBranchContext = () => {
  if (!canUseStorage) return;
  window.localStorage.removeItem(BRANCH_CONTEXT_KEY);
  window.dispatchEvent(new CustomEvent(BRANCH_CONTEXT_UPDATED_EVENT, { detail: { branchId: null, mode: 'all' } }));
};

export const hasPermission = (permission) => {
  if (!permission || isSuperAdmin() || isTenantAdmin()) return true;
  return getAdminPermissions().includes(permission);
};

export const hasAnyPermission = (permissions = []) => {
  if (isSuperAdmin() || isTenantAdmin()) return true;
  if (!permissions.length) return true;
  const availablePermissions = getAdminPermissions();
  return permissions.some((permission) => availablePermissions.includes(permission));
};

export const hasAllPermissions = (permissions = []) => {
  if (isSuperAdmin() || isTenantAdmin()) return true;
  if (!permissions.length) return true;
  const availablePermissions = getAdminPermissions();
  return permissions.every((permission) => availablePermissions.includes(permission));
};

export const can = (permission) => hasPermission(permission);

export const canAny = (permissions = []) => hasAnyPermission(permissions);

export const canAll = (permissions = []) => hasAllPermissions(permissions);

export const loginAdmin = async ({ username, password }) => {
  const tenantBranding = await fetchCurrentTenantBranding();
  const result = await apiRequest('/auth/login', {
    method: 'POST',
    skipAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity: String(username || '').trim(),
      password: String(password || ''),
    }),
  });

  const session = buildSessionFromAuthData(result?.data);

  if (!session.token) {
    throw new Error('لاگ اِن ٹوکن نہیں ملا۔ براہ کرم دوبارہ کوشش کریں۔');
  }

  assertSessionMatchesTenant(session, tenantBranding);
  writeSession(session);
  attachTenantBrandingToSession(tenantBranding);

  return { success: true, session };
};

export const requestForgotPassword = async ({ identity, contactEmail }) => {
  const result = await apiRequest('/auth/forgot-password', {
    method: 'POST',
    skipAuth: true,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      identity: String(identity || '').trim(),
      contactEmail: String(contactEmail || '').trim(),
    }),
  });

  return {
    success: Boolean(result?.success ?? true),
    data: result?.data || null,
    message: result?.message || 'Password reset request submitted successfully.',
  };
};

export const validateCurrentTenantSession = async () => {
  const session = readSession();
  const tenantBranding = await fetchCurrentTenantBranding();

  if (session?.token) {
    assertSessionMatchesTenant(session, tenantBranding);
    attachTenantBrandingToSession(tenantBranding);
  }

  return tenantBranding;
};

export const fetchCurrentAdminProfile = async () => {
  const token = getAdminToken();

  if (!token) {
    throw new Error('ایڈمن سیشن نہیں ملا۔ براہ کرم دوبارہ لاگ اِن کریں۔');
  }

  const result = await apiRequest('/auth/me', {
    method: 'GET',
    token,
  });

  const currentSession = readSession();
  const nextSession = buildSessionFromAuthData(
    {
      token,
      admin: result?.data || null,
      user: result?.data || null,
      role: result?.data?.roleDetails || result?.data?.role || null,
      permissions: result?.data?.permissions || [],
    },
    currentSession,
  );

  writeSession(nextSession);

  return result?.data || null;
};

export const refreshPermissions = async () => {
  try {
    return await fetchCurrentAdminProfile();
  } catch (error) {
    if (error?.statusCode === 401 || error?.statusCode === 403) {
      expireSession(error.message);
    }
    throw error;
  }
};

export const fetchMadrassaProfile = async () => {
  const token = getAdminToken();

  if (!token) {
    throw new Error('ایڈمن سیشن نہیں ملا۔ براہ کرم دوبارہ لاگ اِن کریں۔');
  }

  const result = await apiRequest('/auth/profile', {
    method: 'GET',
    token,
  });

  const profile = result?.data || null;
  const currentSession = readSession();

  if (currentSession) {
    writeSession({
      ...currentSession,
      madrassaProfile: profile,
    });
    notifyMadrassaProfileUpdated(profile);
  }

  return profile;
};

export const fetchCurrentTenantBranding = async () => {
  const result = await apiRequest('/tenant/current', {
    method: 'GET',
    skipAuth: true,
  });

  const brandingData = result?.data || null;
  attachTenantBrandingToSession(brandingData);
  notifyTenantBrandingUpdated(brandingData);
  return brandingData;
};

const appendAssetCacheKey = (url, cacheKey = '') => {
  if (!cacheKey) return url;

  try {
    const nextUrl = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
    nextUrl.searchParams.set('v', String(cacheKey));
    return nextUrl.toString();
  } catch {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${encodeURIComponent(String(cacheKey))}`;
  }
};

export const getApiAssetUrl = (assetPath, cacheKey = '') => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return appendAssetCacheKey(assetPath, cacheKey);

  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  try {
    const apiUrl = new URL(API_BASE_URL);

    if (typeof window !== 'undefined') {
      const currentHostName = window.location.hostname;
      const isLocalApiHost = ['localhost', '127.0.0.1'].includes(apiUrl.hostname);

      if (isLocalApiHost && currentHostName && !['localhost', '127.0.0.1'].includes(currentHostName)) {
        return appendAssetCacheKey(`${window.location.protocol}//${currentHostName}:${apiUrl.port}${normalizedAssetPath}`, cacheKey);
      }
    }

    return appendAssetCacheKey(new URL(normalizedAssetPath, `${apiUrl.origin}/`).toString(), cacheKey);
  } catch {
    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return appendAssetCacheKey(`${apiOrigin}${normalizedAssetPath}`, cacheKey);
  }
};

const buildAssetCandidates = (assetPath, cacheKey = '') => {
  if (!assetPath) return [];
  if (/^https?:\/\//i.test(assetPath)) return [appendAssetCacheKey(assetPath, cacheKey)];

  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const candidates = new Set();

  try {
    const apiUrl = new URL(API_BASE_URL);
    candidates.add(appendAssetCacheKey(new URL(normalizedAssetPath, `${apiUrl.origin}/`).toString(), cacheKey));

    if (['localhost', '127.0.0.1'].includes(apiUrl.hostname)) {
      candidates.add(appendAssetCacheKey(`http://localhost:${apiUrl.port}${normalizedAssetPath}`, cacheKey));
      candidates.add(appendAssetCacheKey(`http://127.0.0.1:${apiUrl.port}${normalizedAssetPath}`, cacheKey));
    }
  } catch {
    candidates.add(getApiAssetUrl(normalizedAssetPath, cacheKey));
  }

  if (typeof window !== 'undefined') {
    candidates.add(appendAssetCacheKey(`${window.location.origin}${normalizedAssetPath}`, cacheKey));
  }

  return Array.from(candidates).filter(Boolean);
};

export const resolveApiAssetUrl = async (assetPath, cacheKey = '') => {
  const candidates = buildAssetCandidates(assetPath, cacheKey);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Try next candidate URL.
    }
  }

  return getApiAssetUrl(assetPath, cacheKey);
};

export const updateMadrassaProfile = async (profileData) => {
  const token = getAdminToken();

  if (!token) {
    throw new Error('ایڈمن سیشن نہیں ملا۔ براہ کرم دوبارہ لاگ اِن کریں۔');
  }

  const isFormData = typeof FormData !== 'undefined' && profileData instanceof FormData;

  const result = await apiRequest('/auth/profile', isFormData ? {
    method: 'PUT',
    token,
    body: profileData,
  } : {
    method: 'PUT',
    token,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(profileData),
  });

  const profile = result?.data || null;
  const currentSession = readSession();

  if (currentSession) {
    writeSession({
      ...currentSession,
      madrassaProfile: profile,
    });
    notifyMadrassaProfileUpdated(profile);
  }

  return profile;
};

export const changeAdminPassword = async ({ currentPassword, newPassword }) => {
  const token = getAdminToken();

  if (!token) {
    return { success: false, message: 'ایڈمن سیشن نہیں ملا۔ براہ کرم دوبارہ لاگ اِن کریں۔' };
  }

  try {
    await apiRequest('/auth/change-password', {
      method: 'POST',
      token,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentPassword,
        newPassword,
        confirmPassword: newPassword,
      }),
    });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'پاس ورڈ اپڈیٹ نہیں ہو سکا۔',
    };
  }
};

export const logoutAdmin = () => {
  if (!canUseStorage) return;
  window.localStorage.removeItem(AUTH_KEY);
  window.dispatchEvent(new CustomEvent(ADMIN_SESSION_UPDATED_EVENT, { detail: null }));
};
