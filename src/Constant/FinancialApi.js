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

export const getFinancialRecords = async (query = '') => {
  const result = await apiRequest(`/finance/financial${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], summary: null, meta: null };
};

export const getFinancialSummary = async (query = '') => {
  const result = await apiRequest(`/finance/financial/summary${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data;
};

export const createFinancialRecord = async (payload) => {
  const result = await apiRequest('/finance/financial', withJson('POST', payload));
  return result?.data;
};

export const updateFinancialRecord = async (id, payload) => {
  const result = await apiRequest(`/finance/financial/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deleteFinancialRecord = async (id) => {
  const result = await apiRequest(`/finance/financial/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
