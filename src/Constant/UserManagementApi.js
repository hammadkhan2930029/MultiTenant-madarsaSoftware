import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const buildQuery = (filters = {}) => {
  const params = new URLSearchParams();

  ['page', 'limit', 'search', 'status', 'roleId'].forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });

  return params.toString();
};

export const getUsers = async (filters = {}) => {
  const query = buildQuery(filters);
  const result = await apiRequest(`/users${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getUserById = async (id) => {
  const result = await apiRequest(`/users/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const createUser = async (payload) => {
  const result = await apiRequest('/users', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const updateUser = async (id, payload) => {
  const result = await apiRequest(`/users/${id}`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const assignUserRole = async (id, roleId) => {
  const result = await apiRequest(`/users/${id}/role`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ roleId }),
  });
  return result?.data;
};
