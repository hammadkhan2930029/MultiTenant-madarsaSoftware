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

export const getStudentAttendance = async (query = '') => {
  const result = await apiRequest(`/attendance/students${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const saveStudentAttendance = async (payload) => {
  const result = await apiRequest('/attendance/students', withJson('POST', payload));
  return result?.data;
};

export const getTeacherAttendance = async (query = '') => {
  const result = await apiRequest(`/attendance/teachers${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const saveTeacherAttendance = async (payload) => {
  const result = await apiRequest('/attendance/teachers', withJson('POST', payload));
  return result?.data;
};
