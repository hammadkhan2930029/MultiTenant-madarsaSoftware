import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({ ...options, token: getAdminToken() });

export const getAffiliateSettings = async () => {
  const result = await apiRequest('/affiliate/settings', withToken({ method: 'GET' }));
  return result?.data || null;
};

export const updateAffiliateSettings = async (payload) => {
  const result = await apiRequest('/affiliate/settings', {
    ...withToken({ method: 'PUT' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data || null;
};

export const getCommissionTiers = async (filters = {}) => {
  const params = new URLSearchParams();
  ['page', 'limit', 'status'].forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
      params.set(key, filters[key]);
    }
  });
  const query = params.toString();
  const result = await apiRequest(`/affiliate/commission-tiers${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createCommissionTier = async (payload) => {
  const result = await apiRequest('/affiliate/commission-tiers', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data || null;
};

export const updateCommissionTier = async (id, payload) => {
  const result = await apiRequest(`/affiliate/commission-tiers/${id}`, {
    ...withToken({ method: 'PUT' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data || null;
};

export const updateCommissionTierStatus = async (id, status) => {
  const result = await apiRequest(`/affiliate/commission-tiers/${id}/status`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return result?.data || null;
};

export const getAffiliateOverview = async (filters = {}) => {
  const params = new URLSearchParams();
  ['page', 'limit', 'search'].forEach((key) => {
    if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') params.set(key, filters[key]);
  });
  const query = params.toString();
  const result = await apiRequest(`/affiliate/overview${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getAffiliateTenantDetail = async (tenantId) => {
  const result = await apiRequest(`/affiliate/overview/${tenantId}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getAffiliateWallet = async () => (await apiRequest('/affiliate/wallet', withToken({ method: 'GET' })))?.data || null;
export const createAffiliatePaymentAccount = async (payload) => (await apiRequest('/affiliate/wallet/accounts', { ...withToken({ method: 'POST' }), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))?.data || null;
export const updateAffiliatePaymentAccount = async (id, payload) => (await apiRequest(`/affiliate/wallet/accounts/${id}`, { ...withToken({ method: 'PUT' }), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))?.data || null;
export const deactivateAffiliatePaymentAccount = async (id) => (await apiRequest(`/affiliate/wallet/accounts/${id}/deactivate`, withToken({ method: 'PATCH' })))?.data || null;
export const createAffiliateWithdrawalRequest = async (payload) => (await apiRequest('/affiliate/wallet/withdrawals', { ...withToken({ method: 'POST' }), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))?.data || null;
export const getAffiliateWithdrawals = async (filters = {}) => {
  const params = new URLSearchParams();
  ['page', 'limit', 'status', 'search'].forEach((key) => { if (filters[key]) params.set(key, filters[key]); });
  const query = params.toString();
  return (await apiRequest(`/affiliate/withdrawals${query ? `?${query}` : ''}`, withToken({ method: 'GET' })))?.data || { items: [], meta: null };
};
export const rejectAffiliateWithdrawal = async (id, adminNote) => (await apiRequest(`/affiliate/withdrawals/${id}/reject`, { ...withToken({ method: 'PATCH' }), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ adminNote }) }))?.data || null;
export const payAffiliateWithdrawal = async (id, payload) => (await apiRequest(`/affiliate/withdrawals/${id}/pay`, { ...withToken({ method: 'POST' }), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }))?.data || null;
export const previewAffiliateCommissionReconciliation = async () => (await apiRequest('/affiliate/commission-reconciliation/preview', withToken({ method: 'GET' })))?.data || null;
export const runAffiliateCommissionReconciliation = async () => (await apiRequest('/affiliate/commission-reconciliation/run', withToken({ method: 'POST' })))?.data || null;
