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

export const getResultGrades = async (query = '') => {
  const result = await apiRequest(`/result-grades${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createResultGrade = async (payload) => {
  const result = await apiRequest('/result-grades', withJson('POST', payload));
  return result?.data;
};

export const updateResultGrade = async (id, payload) => {
  const result = await apiRequest(`/result-grades/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteResultGrade = async (id) => {
  const result = await apiRequest(`/result-grades/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
