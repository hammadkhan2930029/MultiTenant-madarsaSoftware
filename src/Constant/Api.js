// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5002/api';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://api.madrasasoftware.com/api';


const buildHeaders = (headers = {}, token) => {
  const nextHeaders = { ...headers };

  if (token) {
    nextHeaders.Authorization = `Bearer ${token}`;
  }

  return nextHeaders;
};

export const apiRequest = async (endpoint, options = {}) => {
  const { token, headers, ...restOptions } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...restOptions,
    headers: buildHeaders(headers, token),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || 'درخواست مکمل نہیں ہو سکی۔');
  }

  return result;
};

export { API_BASE_URL };
