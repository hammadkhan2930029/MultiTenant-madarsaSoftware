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

export const createSuggestion = async (payload) => {
  const result = await apiRequest('/suggestions', withJson('POST', payload));
  return result?.data || null;
};

export const getSuggestions = async (query = '') => {
  const result = await apiRequest(`/suggestions${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};
