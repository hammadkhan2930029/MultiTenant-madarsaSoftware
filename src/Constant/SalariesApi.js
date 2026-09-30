import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const withPayload = (method, payload, paymentProof = null) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== null && value !== undefined) body.append(key, String(value));
  });
  if (paymentProof) body.append('paymentProof', paymentProof);
  return withToken({ method, body });
};

export const getSalaryEntries = async (query = '') => {
  const result = await apiRequest(`/finance/salaries${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  const data = result?.data;
  return { items: Array.isArray(data?.items) ? data.items : [], meta: data?.meta || null };
};

export const getSalaryTeachers = async (query = '') => {
  const result = await apiRequest(`/finance/salaries/teachers${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  const data = result?.data;
  return { items: Array.isArray(data?.items) ? data.items : [], meta: data?.meta || null };
};

export const createSalaryEntry = async (payload, paymentProof = null) => {
  const result = await apiRequest('/finance/salaries', withPayload('POST', payload, paymentProof));
  return result?.data;
};

export const updateSalaryEntry = async (id, payload, paymentProof = null) => {
  const result = await apiRequest(`/finance/salaries/${id}`, withPayload('PUT', payload, paymentProof));
  return result?.data;
};

export const deactivateSalaryEntry = async (id) => {
  const result = await apiRequest(`/finance/salaries/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
