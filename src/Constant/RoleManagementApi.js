import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  ['page', 'limit', 'search'].forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });

  return params.toString();
};

export const getRoles = async (filters = {}) => {
  const query = buildQuery(filters);
  const result = await apiRequest(`/roles${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getRoleById = async (id) => {
  const result = await apiRequest(`/roles/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getRolePermissions = async () => {
  const result = await apiRequest('/roles/permissions', withToken({ method: 'GET' }));
  return result?.data || [];
};

export const createRole = async (payload) => {
  const result = await apiRequest('/roles', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const updateRole = async (id, payload) => {
  const result = await apiRequest(`/roles/${id}`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const deleteRole = async (id) => {
  const result = await apiRequest(`/roles/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const assignRolePermissions = async (id, payload) => {
  const result = await apiRequest(`/roles/${id}/permissions`, {
    ...withToken({ method: 'PUT' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};
