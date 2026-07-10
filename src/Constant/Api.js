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
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://appapi.madrasasoftware.com/api';
// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://demoapi.madrasasoftware.com/api';


const AUTH_KEY = 'madarsa_admin_auth';
const SESSION_EXPIRED_MESSAGE_KEY = 'madarsa_session_expired_message';
const SESSION_EXPIRED_EVENT = 'madarsa:session-expired';
const PERMISSION_DENIED_EVENT = 'madarsa:permission-denied';
const PERMISSION_DENIED_MESSAGE = 'You do not have permission to perform this action.';

const REQUEST_FAILED_MESSAGE = 'درخواست مکمل نہیں ہو سکی۔';

const SESSION_EXPIRED_BACKEND_MESSAGES = new Set([
  'Authorization token is required.',
  'Invalid or expired token.',
  'Tenant is inactive. Please contact support.',
]);

const TENANT_OR_SESSION_ERROR_PATTERNS = [
  /tenant.*mismatch/i,
  /tenant.*inactive/i,
  /tenant.*not found/i,
  /session/i,
  /token/i,
  /jwt/i,
  /unauthorized/i,
  /account.*inactive/i,
  /user.*inactive/i,
  /role.*inactive/i,
];

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

const notifyPermissionDenied = (message) => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(PERMISSION_DENIED_EVENT, { detail: { message } }));
};

const isSessionExpiredError = (status, rawMessage = '') => {
  if (status === 401) return true;
  if (SESSION_EXPIRED_BACKEND_MESSAGES.has(rawMessage)) return true;
  if (status !== 403) return false;

  return TENANT_OR_SESSION_ERROR_PATTERNS.some((pattern) => pattern.test(rawMessage));
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
    const rawMessage = result?.message || '';
    const shouldExpireSession = authToken && isSessionExpiredError(response.status, rawMessage);
    const isPermissionDenied = response.status === 403 && !shouldExpireSession;
    const message = toUrduNotificationText(
      isPermissionDenied ? PERMISSION_DENIED_MESSAGE : rawMessage,
      REQUEST_FAILED_MESSAGE,
    );

    if (authToken && (response.status === 401 || response.status === 403)) {
      if (shouldExpireSession) {
        expireStoredSession(message);
      } else if (isPermissionDenied) {
        notifyPermissionDenied(message);
      }
    }

    const error = new Error(message);
    error.statusCode = response.status;
    error.response = result;
    error.isPermissionDenied = isPermissionDenied;
    error.isSessionExpired = shouldExpireSession;
    throw error;
  }

  return result;
};

export {
  API_BASE_URL,
  PERMISSION_DENIED_EVENT,
  SESSION_EXPIRED_EVENT,
  SESSION_EXPIRED_MESSAGE_KEY,
};
