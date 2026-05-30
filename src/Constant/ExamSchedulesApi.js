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

export const getExamSchedules = async (query = '') => {
  const result = await apiRequest(`/exam-schedules${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createExamSchedule = async (payload) => {
  const result = await apiRequest('/exam-schedules', withJson('POST', payload));
  return result?.data;
};

export const updateExamSchedule = async (id, payload) => {
  const result = await apiRequest(`/exam-schedules/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteExamSchedule = async (id) => {
  const result = await apiRequest(`/exam-schedules/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
