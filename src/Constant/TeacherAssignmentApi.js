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

export const getTeacherAssignments = async (query = '') => {
  const result = await apiRequest(`/teacher-assignments${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getTeacherAssignmentById = async (id) => {
  const result = await apiRequest(`/teacher-assignments/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getTeacherResponsibilities = async (query = '') => {
  const result = await apiRequest(`/teacher-assignments/responsibilities${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createTeacherAssignments = async (payload) => {
  const result = await apiRequest('/teacher-assignments', withJson('POST', payload));
  return result?.data;
};

export const updateTeacherAssignment = async (id, payload) => {
  const result = await apiRequest(`/teacher-assignments/${id}`, withJson('PATCH', payload));
  return result?.data;
};

export const updateTeacherAssignmentStatus = async (id, status) => {
  const result = await apiRequest(`/teacher-assignments/${id}/status`, withJson('PATCH', { status }));
  return result?.data;
};

export const deleteTeacherAssignment = async (id) => {
  const result = await apiRequest(`/teacher-assignments/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
