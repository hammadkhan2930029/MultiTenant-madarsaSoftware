import { toUrduNotificationText } from './notificationUtils';

const getApiBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;
  if (configuredBaseUrl) return configuredBaseUrl;

  if (typeof window !== 'undefined') {
    const apiPort = import.meta.env.VITE_API_PORT || '5002';
    return `${window.location.protocol}//${window.location.hostname}:${apiPort}/api`;
  }

  return 'http://localhost:5002/api';
};

const API_BASE_URL = getApiBaseUrl();
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demoapi.madrasasoftware.com/api';

const AUTH_KEY = 'madarsa_admin_auth';
const SESSION_EXPIRED_MESSAGE_KEY = 'madarsa_session_expired_message';
const SESSION_EXPIRED_EVENT = 'madarsa:session-expired';

const canUseStorage = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';

const getStoredToken = () => {
  if (!canUseStorage) return '';

  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_KEY) || 'null');
    return session?.token || '';
  } catch {
    return '';
  }
};

const expireStoredSession = (message) => {
  if (!canUseStorage) return;
  window.localStorage.removeItem(AUTH_KEY);
  window.sessionStorage?.setItem(SESSION_EXPIRED_MESSAGE_KEY, message);
  window.dispatchEvent(new CustomEvent(SESSION_EXPIRED_EVENT, { detail: { message } }));
};

const buildHeaders = (headers = {}, token) => {
  const nextHeaders = { ...headers };

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
};

export const apiRequest = async (endpoint, options = {}) => {
  const { token, headers, skipAuth = false, ...restOptions } = options;
  const authToken = token || (!skipAuth ? getStoredToken() : '');

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: buildHeaders(headers, authToken),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    const message = toUrduNotificationText(result?.message, 'درخواست مکمل نہیں ہو سکی۔');

    if (authToken && (response.status === 401 || response.status === 403)) {
      const shouldExpireSession = [
        'Authorization token is required.',
        'Invalid or expired token.',
        'Tenant is inactive. Please contact support.',
      ].includes(result?.message);

      if (shouldExpireSession) {
        expireStoredSession(message);
      }
    }

    throw new Error(message);
  }

  return result;
};

export { API_BASE_URL, SESSION_EXPIRED_EVENT, SESSION_EXPIRED_MESSAGE_KEY };
