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

export const getCities = async (query = '') => {
  const result = await apiRequest(`/cities${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createCity = async (payload) => {
  const result = await apiRequest('/cities', withJson('POST', payload));
  return result?.data || null;
};

export const updateCity = async (id, payload) => {
  const result = await apiRequest(`/cities/${id}`, withJson('PATCH', payload));
  return result?.data || null;
};

export const deactivateCity = async (id) => {
  const result = await apiRequest(`/cities/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data || null;
};
