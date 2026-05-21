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

export const getBranches = async (query = '') => {
  const result = await apiRequest(`/branches${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getDefaultBranch = async () => {
  const result = await getBranches('page=1&limit=100');
  const branches = result.items || [];
  const activeBranches = branches.filter((branch) => branch.status === 'active');
  return (
    activeBranches.find((branch) => String(branch.name || '').trim().toLowerCase() === 'main campus') ||
    activeBranches[0] ||
    branches[0] ||
    null
  );
};

export const createBranch = async (payload) => {
  const result = await apiRequest('/branches', withJson('POST', payload));
  return result?.data;
};

export const updateBranch = async (id, payload) => {
  const result = await apiRequest(`/branches/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const deleteBranch = async (id) => {
  const result = await apiRequest(`/branches/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getClasses = async (query = '') => {
  const result = await apiRequest(`/classes${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createClass = async (payload) => {
  const result = await apiRequest('/classes', withJson('POST', payload));
  return result?.data;
};

export const updateClass = async (id, payload) => {
  const result = await apiRequest(`/classes/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const deleteClass = async (id) => {
  const result = await apiRequest(`/classes/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getSections = async (query = '') => {
  const result = await apiRequest(`/sections${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createSection = async (payload) => {
  const result = await apiRequest('/sections', withJson('POST', payload));
  return result?.data;
};

export const updateSection = async (id, payload) => {
  const result = await apiRequest(`/sections/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const deleteSection = async (id) => {
  const result = await apiRequest(`/sections/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getSessions = async (query = '') => {
  const result = await apiRequest(`/sessions${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createSession = async (payload) => {
  const result = await apiRequest('/sessions', withJson('POST', payload));
  return result?.data;
};

export const updateSession = async (id, payload) => {
  const result = await apiRequest(`/sessions/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const deleteSession = async (id) => {
  const result = await apiRequest(`/sessions/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getSubjects = async (query = '') => {
  const result = await apiRequest(`/subjects${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createSubject = async (payload) => {
  const result = await apiRequest('/subjects', withJson('POST', payload));
  return result?.data;
};

export const updateSubject = async (id, payload) => {
  const result = await apiRequest(`/subjects/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const deleteSubject = async (id) => {
  const result = await apiRequest(`/subjects/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
