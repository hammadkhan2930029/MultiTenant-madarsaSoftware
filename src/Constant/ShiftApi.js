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

export const getShifts = async (query = '') => {
  const result = await apiRequest(`/shifts${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createShift = async (payload) => {
  const result = await apiRequest('/shifts', withJson('POST', payload));
  return result?.data || null;
};

export const updateShift = async (id, payload) => {
  const result = await apiRequest(`/shifts/${id}`, withJson('PATCH', payload));
  return result?.data || null;
};

export const deleteShift = async (id) => {
  const result = await apiRequest(`/shifts/${id}`, withToken({ method: 'DELETE' }));
  return result?.data || null;
};
