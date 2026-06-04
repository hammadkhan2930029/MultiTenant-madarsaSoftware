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

export const getStudents = async (query = '') => {
  const result = await apiRequest(`/students${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStudentById = async (id) => {
  const result = await apiRequest(`/students/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getNextAdmissionNumber = async () => {
  const result = await apiRequest('/students/next-admission-number', withToken({ method: 'GET' }));
  return result?.data?.admissionNumber;
};

export const createStudent = async (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'parents') {
      formData.append('parents', JSON.stringify(value));
      return;
    }

    if (key === 'image') {
      formData.append('image', value);
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest('/students', withToken({ method: 'POST', body: formData }));
  return result?.data;
};

export const updateStudent = async (id, payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;

    if (key === 'parents') {
      formData.append('parents', JSON.stringify(value));
      return;
    }

    if (key === 'image') {
      formData.append('image', value);
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest(`/students/${id}`, withToken({ method: 'PUT', body: formData }));
  return result?.data;
};

export const assignStudentClass = async (id, payload) => {
  const result = await apiRequest(`/students/${id}/assign-class`, withJson('POST', payload));
  return result?.data;
};

export const removeStudentClassAssignment = async (assignmentId) => {
  const result = await apiRequest(`/students/class-assignments/${assignmentId}/remove`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const getParents = async (query = '') => {
  const result = await apiRequest(`/parents${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getParentById = async (id) => {
  const result = await apiRequest(`/parents/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const createParent = async (payload) => {
  const result = await apiRequest('/parents', withJson('POST', payload));
  return result?.data;
};

export const updateParent = async (id, payload) => {
  const result = await apiRequest(`/parents/${id}`, withJson('PUT', payload));
  return result?.data;
};

export const deactivateParent = async (id) => {
  const result = await apiRequest(`/parents/${id}/deactivate`, withToken({ method: 'PATCH' }));
  return result?.data;
};
