import { API_BASE_URL, apiRequest } from './Api';
import { SUPER_ADMIN_ROLE } from './Permissions';

const AUTH_KEY = 'madarsa_admin_auth';
export const MADRASSA_PROFILE_UPDATED_EVENT = 'madarsa:madrassa-profile-updated';

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

const writeSession = (session) => {
  if (!canUseStorage) return;
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(session));
};

const normalizePermissions = (permissions) => {
  if (!Array.isArray(permissions)) return [];

  return permissions
    .map((permission) => {
      if (typeof permission === 'string') return permission;
      return permission?.permissionKey || permission?.permission_key || '';
    })
    .filter(Boolean);
};

const buildSessionFromAuthData = (data, currentSession = null) => {
  const admin = data?.admin || data?.user || currentSession?.admin || null;
  const role = data?.role || admin?.roleDetails || admin?.role || currentSession?.role || null;
  const permissions = normalizePermissions(
    data?.permissions || admin?.permissions || currentSession?.permissions || [],
  );

  return {
    ...(currentSession || {}),
    isAuthenticated: true,
    token: data?.token || currentSession?.token,
    admin,
    user: data?.user || admin,
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

export const getAdminCredentials = () => defaultAdminCredentials;

export const getAdminSession = () => readSession();

export const getAdminToken = () => readSession()?.token || '';

export const isAdminAuthenticated = () => Boolean(getAdminToken());

export const getAdminRole = () => {
  const session = readSession();
  return session?.role || session?.admin?.roleDetails || session?.admin?.role || null;
};

export const getAdminPermissions = () => {
  const session = readSession();
  return normalizePermissions(session?.permissions || session?.admin?.permissions || []);
};

export const isSuperAdmin = () => {
  const role = getAdminRole();
  const roleName = typeof role === 'string' ? role : role?.roleName || role?.role_name;
  const legacyRoleName = readSession()?.admin?.role;

  return roleName === SUPER_ADMIN_ROLE || legacyRoleName === SUPER_ADMIN_ROLE;
};

export const hasPermission = (permission) => {
  if (!permission || isSuperAdmin()) return true;
  return getAdminPermissions().includes(permission);
};

export const hasAnyPermission = (permissions = []) => {
  if (isSuperAdmin()) return true;
  if (!permissions.length) return true;
  const availablePermissions = getAdminPermissions();
  return permissions.some((permission) => availablePermissions.includes(permission));
};

export const hasAllPermissions = (permissions = []) => {
  if (isSuperAdmin()) return true;
  if (!permissions.length) return true;
  const availablePermissions = getAdminPermissions();
  return permissions.every((permission) => availablePermissions.includes(permission));
};

export const loginAdmin = async ({ username, password }) => {
  const result = await apiRequest('/auth/login', {
    method: 'POST',
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

  writeSession(session);

  return { success: true, session };
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

export const getApiAssetUrl = (assetPath) => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;

  try {
    const apiUrl = new URL(API_BASE_URL);

    if (typeof window !== 'undefined') {
      const currentHostName = window.location.hostname;
      const isLocalApiHost = ['localhost', '127.0.0.1'].includes(apiUrl.hostname);

      if (isLocalApiHost && currentHostName && !['localhost', '127.0.0.1'].includes(currentHostName)) {
        return `${window.location.protocol}//${currentHostName}:${apiUrl.port}${normalizedAssetPath}`;
      }
    }

    return new URL(normalizedAssetPath, `${apiUrl.origin}/`).toString();
  } catch {
    const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
    return `${apiOrigin}${normalizedAssetPath}`;
  }
};

const buildAssetCandidates = (assetPath) => {
  if (!assetPath) return [];
  if (/^https?:\/\//i.test(assetPath)) return [assetPath];

  const normalizedAssetPath = assetPath.startsWith('/') ? assetPath : `/${assetPath}`;
  const candidates = new Set();

  try {
    const apiUrl = new URL(API_BASE_URL);
    candidates.add(new URL(normalizedAssetPath, `${apiUrl.origin}/`).toString());

    if (['localhost', '127.0.0.1'].includes(apiUrl.hostname)) {
      candidates.add(`http://localhost:${apiUrl.port}${normalizedAssetPath}`);
      candidates.add(`http://127.0.0.1:${apiUrl.port}${normalizedAssetPath}`);
    }
  } catch {
    candidates.add(getApiAssetUrl(normalizedAssetPath));
  }

  if (typeof window !== 'undefined') {
    candidates.add(`${window.location.origin}${normalizedAssetPath}`);
  }

  return Array.from(candidates).filter(Boolean);
};

export const resolveApiAssetUrl = async (assetPath) => {
  const candidates = buildAssetCandidates(assetPath);

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate, { method: 'GET' });
      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }
    } catch {
      // Try next candidate URL.
    }
  }

  return getApiAssetUrl(assetPath);
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
};
