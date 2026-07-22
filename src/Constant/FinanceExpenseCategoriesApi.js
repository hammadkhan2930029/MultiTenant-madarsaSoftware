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

export const getFinanceExpenseCategories = async (query = '') => {
  const result = await apiRequest(`/finance/expense-categories${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createFinanceExpenseCategory = async (payload) => {
  const result = await apiRequest('/finance/expense-categories', withJson('POST', payload));
  return result?.data;
};

export const updateFinanceExpenseCategory = async (id, payload) => {
  const result = await apiRequest(`/finance/expense-categories/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deactivateFinanceExpenseCategory = async (id) => {
  const result = await apiRequest(`/finance/expense-categories/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
