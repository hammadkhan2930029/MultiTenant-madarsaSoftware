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

export const getSalaryEntries = async (query = '') => {
  const result = await apiRequest(`/finance/salaries${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createSalaryEntry = async (payload) => {
  const result = await apiRequest('/finance/salaries', withJson('POST', payload));
  return result?.data;
};

export const updateSalaryEntry = async (id, payload) => {
  const result = await apiRequest(`/finance/salaries/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deactivateSalaryEntry = async (id) => {
  const result = await apiRequest(`/finance/salaries/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
