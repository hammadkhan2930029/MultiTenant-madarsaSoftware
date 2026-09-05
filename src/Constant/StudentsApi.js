import { API_BASE_URL, apiRequest, appendApiBranchContext } from './Api';
import { getAdminToken } from './AdminAuth';
import { formatStudentRegistrationNumber } from '../Utils/studentRegistration';

const normalizeStudentRecord = (student) => student
  ? { ...student, admissionNumber: formatStudentRegistrationNumber(student.admissionNumber) }
  : student;

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
  const result = await apiRequest(`/students${query ? `?${query}` : ''}`, withToken({ method: 'GET', cache: 'no-store' }));
  const data = result?.data || { items: [], meta: null };
  return { ...data, items: (data.items || []).map(normalizeStudentRecord) };
};

export const getStudentById = async (id) => {
  const result = await apiRequest(`/students/${id}`, withToken({ method: 'GET', cache: 'no-store' }));
  return normalizeStudentRecord(result?.data || null);
};

export const getNextAdmissionNumber = async () => {
  const result = await apiRequest('/students/next-admission-number', withToken({ method: 'GET' }));
  return formatStudentRegistrationNumber(result?.data?.admissionNumber);
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

    if (key === 'documents' && Array.isArray(value)) {
      value.forEach((file) => formData.append('documents', file));
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest('/students', withToken({ method: 'POST', body: formData }));
  return normalizeStudentRecord(result?.data);
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

    if (key === 'documents' && Array.isArray(value)) {
      value.forEach((file) => formData.append('documents', file));
      return;
    }

    formData.append(key, value);
  });

  const result = await apiRequest(`/students/${id}`, withToken({ method: 'PUT', body: formData }));
  return normalizeStudentRecord(result?.data);
};

export const deleteStudentDocument = async (studentId, documentId) => {
  const result = await apiRequest(
    `/students/${studentId}/documents/${documentId}`,
    withToken({ method: 'DELETE' }),
  );
  return result?.data;
};

const fetchStudentDocumentBlob = async (studentId, documentId, download = false) => {
  const endpoint = appendApiBranchContext(
    `/students/${studentId}/documents/${documentId}/file${download ? '?download=true' : ''}`,
    { method: 'GET' },
  );
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${getAdminToken()}` },
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || 'دستاویز دستیاب نہیں ہے۔');
  }

  return response.blob();
};

export const openStudentDocument = async (studentId, documentId) => {
  const previewWindow = window.open('', '_blank');
  try {
    const blob = await fetchStudentDocumentBlob(studentId, documentId);
    const objectUrl = URL.createObjectURL(blob);
    if (previewWindow) {
      previewWindow.opener = null;
      previewWindow.location.replace(objectUrl);
    } else {
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
    }
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
  } catch (error) {
    previewWindow?.close();
    throw error;
  }
};

export const downloadStudentDocument = async (studentId, document) => {
  const blob = await fetchStudentDocumentBlob(studentId, document.id, true);
  const objectUrl = URL.createObjectURL(blob);
  const link = window.document.createElement('a');
  link.href = objectUrl;
  link.download = document.originalName || 'document';
  window.document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const deleteStudent = async (id) => {
  const result = await apiRequest(`/students/${id}`, withToken({ method: 'DELETE' }));
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
  const result = await apiRequest(`/parents${query ? `?${query}` : ''}`, withToken({ method: 'GET', cache: 'no-store' }));
  return result?.data || { items: [], meta: null };
};

export const getParentById = async (id) => {
  const result = await apiRequest(`/parents/${id}`, withToken({ method: 'GET', cache: 'no-store' }));
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

export const deleteParent = async (id) => {
  const result = await apiRequest(`/parents/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};
