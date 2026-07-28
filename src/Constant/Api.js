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

const AUTH_KEY = 'madarsa_admin_auth';
const BRANCH_CONTEXT_KEY = 'madarsa_branch_context';
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

const BRANCH_FILTERED_GET_PREFIXES = [
  '/students',
  '/parents',
  '/roles',
  '/users',
  '/teachers',
  '/attendance',
  '/hifz',
  '/finance',
  '/financial',
  '/fees',
  '/store',
  '/reports',
  '/exam',
  '/exams',
  '/exam-results',
  '/exam-schedules',
  '/schedules',
  '/teacher-schedules',
  '/teacher-assignments',
  '/classes',
  '/sections',
  '/shifts',
  '/departments',
  '/qualifications',
  '/result-grades',
  '/subjects',
  '/sessions',
  '/audit-logs',
  '/support',
  '/suggestions',
];

const BODY_BRANCH_ASSIGNMENT_PREFIXES = [
  '/users',
];

const getRoleNameFromSession = (session) => {
  const role = session?.role || session?.admin?.roleDetails || session?.admin?.role || session?.user?.role || null;
  if (typeof role === 'string') return role;
  return role?.roleName || role?.role_name || role?.name || '';
};

const getRoleScopeFromSession = (session) => {
  const role = session?.role || session?.admin?.roleDetails || session?.user?.roleDetails || session?.admin?.role || session?.user?.role || null;
  if (!role || typeof role === 'string') return '';

  const explicitScope = role.scope || role.roleScope || role.role_scope || session?.admin?.roleScope || session?.user?.roleScope || '';
  if (explicitScope) return String(explicitScope).trim().toLowerCase();

  const tenantId = role.tenantId ?? role.tenant_id ?? null;
  const branchId = role.branchId ?? role.branch_id ?? null;
  if (tenantId === null || tenantId === undefined || tenantId === '') return 'system';
  return branchId === null || branchId === undefined || branchId === '' ? 'tenant' : 'branch';
};

const getSessionTenantId = (session) => {
  const value = session?.admin?.tenantId ?? session?.user?.tenantId ?? session?.tenantId ?? null;
  return value === null || value === undefined || value === '' ? null : Number(value);
};

const getSessionBranchId = (session) => {
  const value = session?.admin?.branchId ?? session?.user?.branchId ?? null;
  return value === null || value === undefined || value === '' ? null : Number(value);
};

const normalizeBranchId = (value) => {
  if (value === null || value === undefined || value === '') return null;
  const branchId = Number(value);
  return Number.isFinite(branchId) && branchId > 0 ? branchId : null;
};

const getBranchIdFromSelector = () => {
  if (typeof document === 'undefined') return null;
  return normalizeBranchId(document.getElementById('tenant-branch-context')?.value);
};

const isTenantAdminSession = (session) => (
  Boolean(getSessionTenantId(session)) &&
  !isSuperAdminSession(session) &&
  (
    String(getRoleNameFromSession(session)).trim().toLowerCase() === 'admin' ||
    getRoleScopeFromSession(session) === 'tenant'
  )
);

const isSuperAdminSession = (session) => String(getRoleNameFromSession(session)).trim().toLowerCase() === 'super_admin';

const isBranchScopedSession = (session) => {
  const branchId = getSessionBranchId(session);
  const roleScope = getRoleScopeFromSession(session);
  return (roleScope === 'branch' || Boolean(branchId)) && !isSuperAdminSession(session) && !isTenantAdminSession(session);
};

const isBranchSystemExplicitlyDisabled = (session) => (
  session?.tenantBranding?.settings?.branchEnabled === false ||
  session?.currentTenant?.branchEnabled === false
);

const getSelectedTenantBranchId = () => {
  if (!canUseStorage) return null;

  try {
    const session = JSON.parse(window.localStorage.getItem(AUTH_KEY) || 'null');
    if (
      !session ||
      !isTenantAdminSession(session) ||
      isSuperAdminSession(session) ||
      isBranchScopedSession(session) ||
      isBranchSystemExplicitlyDisabled(session)
    ) {
      return null;
    }

    const tenantId = getSessionTenantId(session);
    const sessionBranchId = normalizeBranchId(getSessionBranchId(session));
    const selectorBranchId = getBranchIdFromSelector();
    const stored = JSON.parse(window.localStorage.getItem(BRANCH_CONTEXT_KEY) || 'null');
    const branchId = normalizeBranchId(stored?.branchId);

    if (!tenantId) {
      return null;
    }

    if (Number(stored?.tenantId) === tenantId && branchId) {
      return branchId;
    }

    return selectorBranchId || sessionBranchId || null;
  } catch {
    return null;
  }
};

const shouldApplyBranchFilter = (endpoint, method = 'GET') => {
  if (String(method || 'GET').toUpperCase() !== 'GET') return false;
  if (!endpoint || endpoint.includes('branchId=')) return false;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BRANCH_FILTERED_GET_PREFIXES.some((prefix) => (
    normalizedEndpoint === prefix ||
    normalizedEndpoint.startsWith(`${prefix}/`) ||
    normalizedEndpoint.startsWith(`${prefix}?`)
  ));
};

const shouldApplyBranchContext = (endpoint) => {
  if (!endpoint || endpoint.includes('branchId=')) return false;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BRANCH_FILTERED_GET_PREFIXES.some((prefix) => (
    normalizedEndpoint === prefix ||
    normalizedEndpoint.startsWith(`${prefix}/`) ||
    normalizedEndpoint.startsWith(`${prefix}?`)
  ));
};

const shouldPreserveBodyBranchId = (endpoint, method = 'GET') => {
  if (!['POST', 'PUT', 'PATCH'].includes(String(method || 'GET').toUpperCase())) return false;
  if (!endpoint) return false;

  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return BODY_BRANCH_ASSIGNMENT_PREFIXES.some((prefix) => (
    normalizedEndpoint === prefix ||
    normalizedEndpoint.startsWith(`${prefix}/`) ||
    normalizedEndpoint.startsWith(`${prefix}?`)
  ));
};

const appendSelectedBranchFilter = (endpoint, options = {}) => {
  const method = options.method || 'GET';
  const branchId = shouldApplyBranchFilter(endpoint, method) ? getSelectedTenantBranchId() : null;
  if (!branchId) return endpoint;

  const separator = endpoint.includes('?') ? '&' : '?';
  return `${endpoint}${separator}branchId=${encodeURIComponent(String(branchId))}`;
};

export const appendApiBranchContext = (endpoint, options = {}) => appendSelectedBranchFilter(endpoint, options);

const buildBranchScopedRequest = (endpoint, options = {}) => {
  const method = String(options.method || 'GET').toUpperCase();
  const branchId = shouldApplyBranchContext(endpoint) ? getSelectedTenantBranchId() : null;

  if (!branchId) {
    return {
      endpoint: appendSelectedBranchFilter(endpoint, options),
      options,
    };
  }

  if (method === 'GET' || method === 'DELETE') {
    const separator = endpoint.includes('?') ? '&' : '?';
    return {
      endpoint: `${endpoint}${separator}branchId=${encodeURIComponent(String(branchId))}`,
      options,
    };
  }

  if (!['POST', 'PUT', 'PATCH'].includes(method) || !options.body) {
    return { endpoint, options };
  }

  if (typeof FormData !== 'undefined' && options.body instanceof FormData) {
    const preserveBranchId = shouldPreserveBodyBranchId(endpoint, method);
    const nextBody = new FormData();
    let hasPayloadBranchId = false;
    options.body.forEach((value, key) => {
      if (key === 'branchId') {
        hasPayloadBranchId = true;
        if (preserveBranchId) nextBody.append(key, value);
        return;
      }
      nextBody.append(key, value);
    });
    if (!preserveBranchId || !hasPayloadBranchId) {
      nextBody.append('branchId', String(branchId));
    }

    return {
      endpoint,
      options: {
        ...options,
        body: nextBody,
      },
    };
  }

  try {
    const parsedBody = typeof options.body === 'string' ? JSON.parse(options.body) : null;
    if (!parsedBody || typeof parsedBody !== 'object' || Array.isArray(parsedBody)) {
      return { endpoint, options };
    }

    return {
      endpoint,
      options: {
        ...options,
        body: JSON.stringify({
          ...parsedBody,
          branchId: shouldPreserveBodyBranchId(endpoint, method) &&
            Object.prototype.hasOwnProperty.call(parsedBody, 'branchId')
            ? parsedBody.branchId
            : branchId,
        }),
      },
    };
  } catch {
    return { endpoint, options };
  }
};

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
  const scopedRequest = buildBranchScopedRequest(endpoint, restOptions);

  const response = await fetch(`${API_BASE_URL}${scopedRequest.endpoint}`, {
    ...scopedRequest.options,
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
