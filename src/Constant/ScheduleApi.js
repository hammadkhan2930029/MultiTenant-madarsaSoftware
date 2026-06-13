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

export const getSchedules = async (query = '') => {
  const result = await apiRequest(`/schedules${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createSchedule = async (payload) => {
  const result = await apiRequest('/schedules', withJson('POST', payload));
  return result?.data;
};

export const updateSchedule = async (id, payload) => {
  const result = await apiRequest(`/schedules/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteSchedule = async (id) => {
  const result = await apiRequest(`/schedules/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
