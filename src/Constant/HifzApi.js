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

const getData = (result, fallback) => result?.data ?? fallback;

export const getDailyHifzEntries = async (query = '') => {
  const result = await apiRequest(`/hifz/daily${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return getData(result, { items: [], meta: null });
};

export const createDailyHifzEntry = async (payload) => {
  const result = await apiRequest('/hifz/daily', withJson('POST', payload));
  return getData(result, null);
};

export const updateDailyHifzEntry = async (id, payload) => {
  const result = await apiRequest(`/hifz/daily/${id}`, withJson('PUT', payload));
  return getData(result, null);
};

export const deactivateDailyHifzEntry = async (id) => {
  const result = await apiRequest(`/hifz/daily/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return getData(result, null);
};

export const getWeeklyHifzEntries = async (query = '') => {
  const result = await apiRequest(`/hifz/weekly${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return getData(result, { items: [], meta: null });
};

export const createWeeklyHifzEntry = async (payload) => {
  const result = await apiRequest('/hifz/weekly', withJson('POST', payload));
  return getData(result, null);
};

export const updateWeeklyHifzEntry = async (id, payload) => {
  const result = await apiRequest(`/hifz/weekly/${id}`, withJson('PUT', payload));
  return getData(result, null);
};

export const deactivateWeeklyHifzEntry = async (id) => {
  const result = await apiRequest(`/hifz/weekly/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return getData(result, null);
};

export const getMonthlyHifzEntries = async (query = '') => {
  const result = await apiRequest(`/hifz/monthly${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return getData(result, { items: [], meta: null });
};

export const createMonthlyHifzEntry = async (payload) => {
  const result = await apiRequest('/hifz/monthly', withJson('POST', payload));
  return getData(result, null);
};

export const updateMonthlyHifzEntry = async (id, payload) => {
  const result = await apiRequest(`/hifz/monthly/${id}`, withJson('PUT', payload));
  return getData(result, null);
};

export const deactivateMonthlyHifzEntry = async (id) => {
  const result = await apiRequest(`/hifz/monthly/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return getData(result, null);
};

export const getSiparaHifzEntries = async (query = '') => {
  const result = await apiRequest(`/hifz/sipara${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return getData(result, { items: [], meta: null });
};

export const createSiparaHifzEntry = async (payload) => {
  const result = await apiRequest('/hifz/sipara', withJson('POST', payload));
  return getData(result, null);
};

export const updateSiparaHifzEntry = async (id, payload) => {
  const result = await apiRequest(`/hifz/sipara/${id}`, withJson('PUT', payload));
  return getData(result, null);
};

export const deactivateSiparaHifzEntry = async (id) => {
  const result = await apiRequest(`/hifz/sipara/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return getData(result, null);
};
