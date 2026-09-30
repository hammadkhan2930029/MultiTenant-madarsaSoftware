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

export const createFinanceTransaction = async (payload, paymentProof = null) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined) body.append(key, String(value)); });
  if (paymentProof) body.append('paymentProof', paymentProof);
  const result = await apiRequest('/finance/transactions', withToken({ method: 'POST', body }));
  return result?.data;
};

export const updateFinanceTransaction = async (id, payload, paymentProof = null) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined) body.append(key, String(value)); });
  if (paymentProof) body.append('paymentProof', paymentProof);
  const result = await apiRequest(`/finance/transactions/${id}`, withToken({ method: 'PUT', body }));
  return result?.data;
};

export const deactivateFinanceTransaction = async (id) => {
  const result = await apiRequest(`/finance/transactions/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const logFinanceTransactionPrint = async (id) => {
  await apiRequest(`/finance/transactions/${id}/print`, withToken({ method: 'POST' }));
};
