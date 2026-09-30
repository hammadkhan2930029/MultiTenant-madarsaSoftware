import { apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({ ...options, token: getAdminToken() });

export const getAuditLogs = async (query = '') => {
  const result = await apiRequest(`/audit-logs${query ? `?${query}` : ''}`, withToken({ method: 'GET', skipBranchContext: true }));
  return result?.data || { items: [], meta: null };
};
