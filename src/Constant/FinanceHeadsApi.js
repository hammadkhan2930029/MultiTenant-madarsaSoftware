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

export const getFinanceHeads = async (query = '') => {
  const result = await apiRequest(`/finance/heads${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  const data = result?.data;
  return { items: Array.isArray(data?.items) ? data.items : [], meta: data?.meta || null };
};

export const createFinanceHead = async (payload) => {
  const result = await apiRequest('/finance/heads', withJson('POST', payload));
  return result?.data;
};

export const updateFinanceHead = async (id, payload) => {
  const result = await apiRequest(`/finance/heads/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deactivateFinanceHead = async (id) => {
  const result = await apiRequest(`/finance/heads/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
