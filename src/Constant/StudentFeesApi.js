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

export const generateStudentFees = async (payload) => {
  const result = await apiRequest('/finance/student-fees/generate', withJson('POST', payload));
  return result?.data || { generated: 0, skipped: 0, items: [] };
};

export const getStudentFees = async (query = '') => {
  const result = await apiRequest(`/finance/student-fees${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStudentFeeById = async (id) => {
  const result = await apiRequest(`/finance/student-fees/${id}`, withToken({ method: 'GET' }));
  return result?.data || null;
};

export const getStudentFeeHistory = async (studentId) => {
  const result = await apiRequest(`/finance/student-fees/student/${studentId}/history`, withToken({ method: 'GET' }));
  return result?.data || { student: null, vouchers: [] };
};

export const saveStudentFeePayment = async (id, payload) => {
  const result = await apiRequest(`/finance/student-fees/${id}/payment`, withJson('PATCH', payload));
  return result?.data || null;
};
