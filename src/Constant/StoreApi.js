import { API_BASE_URL, appendApiBranchContext, apiRequest } from './Api';
import { getAdminToken } from './AdminAuth';

const withToken = (options = {}) => ({
  ...options,
  token: getAdminToken(),
});

const buildQuery = (filters = {}, keys = []) => {
  const params = new URLSearchParams();
  keys.forEach((key) => {
    const value = filters[key];
    if (value !== undefined && value !== null && value !== '') params.set(key, value);
  });
  return params.toString();
};

const fetchStoreFile = async (endpoint) => {
  const requestEndpoint = appendApiBranchContext(endpoint, { method: 'GET' });
  const response = await fetch(`${API_BASE_URL}${requestEndpoint}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
    },
  });
  if (!response.ok) throw new Error('فائل تیار نہیں ہو سکی۔');
  return response.blob();
};

const openBlob = (blob, targetWindow = null) => {
  const url = URL.createObjectURL(blob);
  if (targetWindow) {
    targetWindow.location.href = url;
  } else {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
  setTimeout(() => URL.revokeObjectURL(url), 30000);
};

const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const openStorePrintPage = async (endpoint) => {
  const printWindow = window.open('', '_blank');
  const blob = await fetchStoreFile(endpoint);
  openBlob(blob, printWindow);
};

export const downloadStoreExport = async (endpoint, filename) => {
  const blob = await fetchStoreFile(endpoint);
  downloadBlob(blob, filename);
};

export const getStoreDashboard = async () => {
  const result = await apiRequest('/store/dashboard', withToken({ method: 'GET' }));
  return result?.data || { totalItems: 0, monthlyPurchase: 0, monthlyExpense: 0 };
};

export const getStoreApprovals = async () => {
  const result = await apiRequest('/store/approvals', withToken({ method: 'GET' }));
  return result?.data || { purchases: [], stockOut: [], damages: [], adjustments: [], summary: null };
};

export const approveStoreApproval = async (moduleType, id, remarks = '') => {
  const result = await apiRequest(`/store/approvals/${moduleType}/${id}/approve`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ remarks }),
  });
  return result?.data;
};

export const rejectStoreApproval = async (moduleType, id, remarks = '') => {
  const result = await apiRequest(`/store/approvals/${moduleType}/${id}/reject`, {
    ...withToken({ method: 'PATCH' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ remarks }),
  });
  return result?.data;
};

export const getStoreItems = async (filters = {}) => {
  const query = buildQuery(filters, ['search', 'category', 'lowStock', 'outOfStock', 'lowStockThreshold', 'includeInactive', 'status']);
  const result = await apiRequest(`/store/items${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStoreItemById = async (id) => {
  const result = await apiRequest(`/store/items/${id}`, withToken({ method: 'GET' }));
  return result?.data;
};

export const createStoreItem = async (payload) => {
  const result = await apiRequest('/store/items', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const updateStoreItem = async (id, payload) => {
  const result = await apiRequest(`/store/items/${id}`, {
    ...withToken({ method: 'PUT' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const deleteStoreItem = async (id) => {
  const result = await apiRequest(`/store/items/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getStoreSuppliers = async () => {
  const result = await apiRequest('/store/suppliers', withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createStoreSupplier = async (payload) => {
  const result = await apiRequest('/store/suppliers', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const getStoreSupplierById = async (id) => {
  const result = await apiRequest(`/store/suppliers/${id}`, withToken({ method: 'GET' }));
  return result?.data;
};

export const updateStoreSupplier = async (id, payload) => {
  const result = await apiRequest(`/store/suppliers/${id}`, {
    ...withToken({ method: 'PUT' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const deleteStoreSupplier = async (id) => {
  const result = await apiRequest(`/store/suppliers/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getStoreSupplierPurchases = async (id) => {
  const result = await apiRequest(`/store/suppliers/${id}/purchases`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStoreSupplierPayments = async (id) => {
  const result = await apiRequest(`/store/suppliers/${id}/payments`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createStoreSupplierPayment = async (id, payload) => {
  const result = await apiRequest(`/store/suppliers/${id}/payments`, {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const getStorePurchases = async (filters = {}) => {
  const query = buildQuery(filters, ['search', 'supplierId', 'fromDate', 'toDate']);
  const result = await apiRequest(`/store/purchases${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const getStorePurchaseById = async (id) => {
  const result = await apiRequest(`/store/purchases/${id}`, withToken({ method: 'GET' }));
  return result?.data;
};

const buildPurchaseFormData = (payload) => {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'invoiceImage') return;
    if (key === 'items') {
      formData.append(key, JSON.stringify(value || []));
      return;
    }
    if (value !== undefined && value !== null) {
      formData.append(key, value);
    }
  });

  if (payload.invoiceImage) {
    formData.append('invoiceImage', payload.invoiceImage);
  }

  return formData;
};

export const createStorePurchase = async (payload) => {
  const result = await apiRequest('/store/purchases', {
    ...withToken({ method: 'POST' }),
    body: buildPurchaseFormData(payload),
  });
  return result?.data;
};

export const updateStorePurchase = async (id, payload) => {
  const result = await apiRequest(`/store/purchases/${id}`, {
    ...withToken({ method: 'PUT' }),
    body: buildPurchaseFormData(payload),
  });
  return result?.data;
};

export const deleteStorePurchase = async (id) => {
  const result = await apiRequest(`/store/purchases/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getStoreStockIssues = async (filters = {}) => {
  const query = buildQuery(filters, ['search', 'department', 'fromDate', 'toDate']);
  const result = await apiRequest(`/store/stock-issues${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

const buildStockIssueFormData = (payload) => {
  const formData = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    if (key === 'receiverSignature') return;
    if (value !== undefined && value !== null) formData.append(key, value);
  });
  if (payload.receiverSignature) formData.append('receiverSignature', payload.receiverSignature);
  return formData;
};

export const createStoreStockIssue = async (payload) => {
  const result = await apiRequest('/store/stock-issues', {
    ...withToken({ method: 'POST' }),
    body: buildStockIssueFormData(payload),
  });
  return result?.data;
};

export const updateStoreStockIssue = async (id, payload) => {
  const result = await apiRequest(`/store/stock-issues/${id}`, {
    ...withToken({ method: 'PUT' }),
    body: buildStockIssueFormData(payload),
  });
  return result?.data;
};

export const deleteStoreStockIssue = async (id) => {
  const result = await apiRequest(`/store/stock-issues/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const approveStoreStockIssue = async (id) => {
  const result = await apiRequest(`/store/stock-issues/${id}/approve`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const rejectStoreStockIssue = async (id) => {
  const result = await apiRequest(`/store/stock-issues/${id}/reject`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const getStoreReturns = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  const result = await apiRequest(`/store/returns${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createStoreReturn = async (payload) => {
  const result = await apiRequest('/store/returns', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const deleteStoreReturn = async (id) => {
  const result = await apiRequest(`/store/returns/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getStoreDamagedStock = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.search) params.set('search', filters.search);
  const query = params.toString();
  const result = await apiRequest(`/store/damaged-stock${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], meta: null };
};

export const createStoreDamagedStock = async (payload) => {
  const result = await apiRequest('/store/damaged-stock', {
    ...withToken({ method: 'POST' }),
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  return result?.data;
};

export const approveStoreDamagedStock = async (id) => {
  const result = await apiRequest(`/store/damaged-stock/${id}/approve`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const rejectStoreDamagedStock = async (id) => {
  const result = await apiRequest(`/store/damaged-stock/${id}/reject`, withToken({ method: 'PATCH' }));
  return result?.data;
};

export const deleteStoreDamagedStock = async (id) => {
  const result = await apiRequest(`/store/damaged-stock/${id}`, withToken({ method: 'DELETE' }));
  return result?.data;
};

export const getStoreReport = async ({ reportType, filters = {} }) => {
  const params = new URLSearchParams();
  ['fromDate', 'toDate', 'category', 'supplierId', 'department', 'limit'].forEach((key) => {
    if (filters[key]) params.set(key, filters[key]);
  });

  const reportPaths = {
    dailyStock: '/store/reports/daily-stock',
    monthlyStock: '/store/reports/monthly-stock',
    purchases: '/store/reports/purchases',
    suppliers: '/store/reports/suppliers',
    stockIssues: '/store/reports/stock-issues',
    departmentWise: '/store/reports/department-wise',
    lowStock: '/store/reports/low-stock',
    damagedStock: '/store/reports/damaged-stock',
    storeValue: '/store/reports/store-value',
    itemLedger: `/store/reports/item-ledger/${filters.itemId || 0}`,
  };

  const endpoint = reportPaths[reportType] || reportPaths.dailyStock;
  const query = params.toString();
  const result = await apiRequest(`${endpoint}${query ? `?${query}` : ''}`, withToken({ method: 'GET' }));
  return result?.data || { items: [], summary: null };
};
