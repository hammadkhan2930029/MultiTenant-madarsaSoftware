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

export const getFinanceTransactions = async (query = '') => {
  const result = await apiRequest(`/finance/transactions${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createFinanceTransaction = async (payload) => {
  const result = await apiRequest('/finance/transactions', withJson('POST', payload));
  return result?.data;
};

export const updateFinanceTransaction = async (id, payload) => {
  const result = await apiRequest(`/finance/transactions/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deactivateFinanceTransaction = async (id) => {
  const result = await apiRequest(`/finance/transactions/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
