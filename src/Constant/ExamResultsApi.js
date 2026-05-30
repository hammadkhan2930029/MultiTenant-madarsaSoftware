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

export const getExamResults = async (query = '') => {
  const result = await apiRequest(`/exam-results${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStudentExamResult = async (studentId, query = '') => {
  const result = await apiRequest(`/exam-results/student/${studentId}${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const saveExamResult = async (payload) => {
  const result = await apiRequest('/exam-results', withJson('POST', payload));
  return result?.data;
};

export const updateExamResult = async (id, payload) => {
  const result = await apiRequest(`/exam-results/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteExamResult = async (id) => {
  const result = await apiRequest(`/exam-results/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
