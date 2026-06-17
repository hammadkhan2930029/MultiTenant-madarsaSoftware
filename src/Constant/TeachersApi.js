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

export const getTeachers = async (query = '') => {
  const result = await apiRequest(`/teachers${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getTeacherById = async (id) => {
  const result = await apiRequest(`/teachers/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getTeacherIncrements = async (id) => {
  const result = await apiRequest(`/teachers/${id}/increments`, withToken({ method: 'GET' }));
  return result?.data || [];
};

export const getAllTeacherIncrements = async (query = '') => {
  const result = await apiRequest(`/teachers/increments${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createTeacherIncrement = async (id, payload) => {
  const result = await apiRequest(`/teachers/${id}/increments`, withJson('POST', payload));
  return result?.data || null;
};

export const createTeacher = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'image') {
      formData.append('image', value);
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest('/teachers', withToken({ method: 'POST', body: formData }));
  return result?.data;
};

export const updateTeacher = async (id, payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'image') {
      formData.append('image', value);
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest(`/teachers/${id}`, withToken({ method: 'PUT', body: formData }));
  return result?.data;
};

export const updateTeacherStatus = async (id, status) => {
  const result = await apiRequest(`/teachers/${id}/status`, withJson('PATCH', { status }));
  return result?.data;
};

export const deleteTeacher = async (id) => {
  const result = await apiRequest(`/teachers/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
