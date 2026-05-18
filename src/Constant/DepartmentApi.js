import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const withJson = (method, body) =>
  withToken({
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

export const getDepartments = async (query = '') => {
  const result = await apiRequest(`/departments${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createDepartment = async (payload) => {
  const result = await apiRequest('/departments', withJson('POST', payload));
  return result?.data || null;
};

export const updateDepartment = async (id, payload) => {
  const result = await apiRequest(`/departments/${id}`, withJson('PATCH', payload));
  return result?.data || null;
};

export const deleteDepartment = async (id) => {
  const result = await apiRequest(`/departments/${id}`, withToken({ method: 'DELETE' }));
  return result?.data || null;
};
