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

export const getTeacherSchedules = async (query = '') => {
  const result = await apiRequest(`/teacher-schedules${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createTeacherSchedule = async (payload) => {
  const result = await apiRequest('/teacher-schedules', withJson('POST', payload));
  return result?.data;
};

export const updateTeacherSchedule = async (id, payload) => {
  const result = await apiRequest(`/teacher-schedules/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteTeacherSchedule = async (id) => {
  const result = await apiRequest(`/teacher-schedules/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
