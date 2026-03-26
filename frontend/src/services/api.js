const _raw = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
const API_BASE = _raw.startsWith('http') ? _raw : `https://${_raw}`;

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('access_token');
  const headers = { ...(token && { Authorization: `Bearer ${token}` }), ...options.headers };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: 'Network error' }));
    throw new Error(error.detail || `HTTP ${res.status}`);
  }

  return res.json();
}

export const auth = {
  register: (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  login: (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  me: () => request('/auth/me'),
  updateProfile: (data) => request('/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  changePassword: (data) => request('/auth/change-password', { method: 'POST', body: JSON.stringify(data) }),
};

export const faces = {
  list: (params = {}) => {
    const clean = Object.fromEntries(Object.entries(params).filter(([_, v]) => v && v !== 'All'));
    return request(`/faces?${new URLSearchParams(clean)}`);
  },
  get: (id) => request(`/faces/${id}`),
  myFaces: () => request('/faces/my/list'),
  update: (id, data) => request(`/faces/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id) => request(`/faces/${id}`, { method: 'DELETE' }),
  register: (data) => request('/faces', { method: 'POST', body: JSON.stringify(data) }),
  analyze: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/faces/analyze', { method: 'POST', body: fd });
  },
  uploadImage: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('/faces/upload-image', { method: 'POST', body: fd });
  },
};

export const licenses = {
  purchase: (data) => request('/licenses/purchase', { method: 'POST', body: JSON.stringify(data) }),
  my: () => request('/licenses/my'),
  provided: () => request('/licenses/provided'),
  renew: (id, months = 3) => request(`/licenses/${id}/renew?months=${months}`, { method: 'POST' }),
  pdfUrl: (id) => `${API_BASE}/licenses/${id}/pdf?token=${localStorage.getItem('access_token')}`,
};

export const reviews = {
  forFace: (faceId) => request(`/reviews/face/${faceId}`),
  create: (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/reviews/${id}`, { method: 'DELETE' }),
};

export const wishlist = {
  list: () => request('/wishlist'),
  add: (faceId) => request(`/wishlist/${faceId}`, { method: 'POST' }),
  remove: (faceId) => request(`/wishlist/${faceId}`, { method: 'DELETE' }),
  check: (faceId) => request(`/wishlist/check/${faceId}`),
};

export const dashboard = {
  stats: () => request('/dashboard/stats'),
  transactions: (limit = 10) => request(`/dashboard/transactions?limit=${limit}`),
  earnings: () => request('/dashboard/earnings'),
};

export const admin = {
  stats: () => request('/admin/stats'),
  users: (limit = 50) => request(`/admin/users?limit=${limit}`),
  updateRole: (id, role) => request(`/admin/users/${id}/role?role=${role}`, { method: 'PATCH' }),
  deleteUser: (id) => request(`/admin/users/${id}`, { method: 'DELETE' }),
  faces: (verified = -1) => request(`/admin/faces?verified=${verified}`),
  verifyFace: (id) => request(`/admin/faces/${id}/verify`, { method: 'PATCH' }),
  rejectFace: (id) => request(`/admin/faces/${id}/reject`, { method: 'PATCH' }),
  licenses: (status = '') => request(`/admin/licenses?status=${status}`),
  revokeLicense: (id) => request(`/admin/licenses/${id}/revoke`, { method: 'PATCH' }),
};
