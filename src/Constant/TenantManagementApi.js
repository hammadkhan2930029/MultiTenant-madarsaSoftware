import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  ['page', 'limit', 'search', 'status'].forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });

  return params.toString();
};

export const getTenants = async (filters = {}) => {
  const query = buildQuery(filters);
  const result = await apiRequest(`/tenants${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getTenantById = async (id) => {
  const result = await apiRequest(`/tenants/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const createTenant = async (payload) => {
  const result = await apiRequest('/tenants', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data || null;
};

export const updateTenant = async (id, payload) => {
  const result = await apiRequest(`/tenants/${id}`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data || null;
};
