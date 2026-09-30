import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const withPayload = (method, payload, paymentProof = null) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key !== 'paymentProof' && key !== 'paymentProofUrl' && value !== null && value !== undefined) body.append(key, String(value));
  });
  if (paymentProof) body.append('paymentProof', paymentProof);
  return withToken({ method, body });
};

export const getFundCollections = async (query = '') => {
  const result = await apiRequest(`/finance/fund-collections${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  const data = result?.data;
  return { items: Array.isArray(data?.items) ? data.items : [], meta: data?.meta || null };
};

export const createFundCollection = async (payload, paymentProof = null) => {
  const body = new FormData();
  Object.entries(payload).forEach(([key, value]) => { if (value !== null && value !== undefined) body.append(key, String(value)); });
  if (paymentProof) body.append('paymentProof', paymentProof);
  const result = await apiRequest('/finance/fund-collections', withToken({ method: 'POST', body }));
  return result?.data;
};

export const updateFundCollection = async (id, payload, paymentProof = null) => {
  const result = await apiRequest(`/finance/fund-collections/${id}`, withPayload('PUT', payload, paymentProof));
  return result?.data;
};

export const deactivateFundCollection = async (id) => {
  const result = await apiRequest(`/finance/fund-collections/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const logFundCollectionPrint = async (id) => {
  await apiRequest(`/finance/fund-collections/${id}/print`, withToken({ method: 'POST' }));
};
