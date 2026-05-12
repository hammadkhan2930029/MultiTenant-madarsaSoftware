import { API_BASE_URL, apiRequest } from './Api';

const AUTH_KEY = 'madarsa_admin_auth';

export const defaultAdminCredentials = {
  username: 'admin',
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

export const getAdminCredentials = () => defaultAdminCredentials;

export const getAdminSession = () => readSession();

export const getAdminToken = () => readSession()?.token || '';

export const isAdminAuthenticated = () => Boolean(getAdminToken());

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

  const session = {
    isAuthenticated: true,
    token: result?.data?.token,
    admin: result?.data?.admin || null,
    loginAt: new Date().toISOString(),
  };

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
  const nextSession = {
    ...(currentSession || {}),
    isAuthenticated: true,
    token,
    admin: result?.data || null,
  };

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

  return result?.data || null;
};

export const getApiAssetUrl = (assetPath) => {
  if (!assetPath) return '';
  if (/^https?:\/\//i.test(assetPath)) return assetPath;

  const apiOrigin = API_BASE_URL.replace(/\/api\/?$/, '');
  return `${apiOrigin}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
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

  return result?.data || null;
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
