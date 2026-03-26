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

export const apiKeys = {
  list: () => request('/api-keys'),
  create: (data) => request('/api-keys', { method: 'POST', body: JSON.stringify(data) }),
  delete: (id) => request(`/api-keys/${id}`, { method: 'DELETE' }),
  toggle: (id) => request(`/api-keys/${id}/toggle`, { method: 'PATCH' }),
};

export const messages = {
  inbox: () => request('/messages/inbox'),
  sent: () => request('/messages/sent'),
  send: (data) => request('/messages', { method: 'POST', body: JSON.stringify(data) }),
  markRead: (id) => request(`/messages/${id}/read`, { method: 'PATCH' }),
  delete: (id) => request(`/messages/${id}`, { method: 'DELETE' }),
  reportMisuse: (data) => request('/messages/report-misuse', { method: 'POST', body: JSON.stringify(data) }),
  myReports: () => request('/messages/reports'),
};

export const similar = {
  find: (faceId, limit = 6) => request(`/faces/similar/${faceId}?limit=${limit}`),
};

export const notifications = {
  list: () => request('/notifications'),
  readAll: () => request('/notifications/read-all', { method: 'PATCH' }),
  readOne: (id) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
};

export const subscriptions = {
  plans: () => request('/subscriptions/plans'),
  my: () => request('/subscriptions/my'),
  subscribe: (plan) => request('/subscriptions/subscribe', { method: 'POST', body: JSON.stringify({ plan }) }),
  validatePromo: (code, amount) => request('/subscriptions/validate-promo', { method: 'POST', body: JSON.stringify({ code, amount }) }),
  rankings: () => request('/subscriptions/rankings'),
};

export const authExtra = {
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (token, new_password) => request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, new_password }) }),
};

export const protection = {
  watermarked: (faceId) => request(`/protection/watermarked/${faceId}`),
  scan: (data) => request('/protection/scan', { method: 'POST', body: JSON.stringify(data) }),
  confirmScan: (scanId, confirmed) => request(`/protection/scan/${scanId}/confirm`, { method: 'PATCH', body: JSON.stringify({ confirmed }) }),
  dmca: (scanId) => request(`/protection/scan/${scanId}/dmca`),
  myScans: () => request('/protection/my-scans'),
  registerUsage: (data) => request('/protection/usage-url', { method: 'POST', body: JSON.stringify(data) }),
  usageUrls: (licenseId) => request(`/protection/usage-urls/${licenseId}`),
  createDispute: (data) => request('/protection/disputes', { method: 'POST', body: JSON.stringify(data) }),
  myDisputes: () => request('/protection/disputes'),
  trackView: (faceId, viewerId) => request(`/protection/view/${faceId}`, { method: 'POST' }),
  analytics: (faceId) => request(`/protection/analytics/${faceId}`),
  priceRecommend: (params) => request(`/protection/price-recommendation?${new URLSearchParams(params)}`),
  alsoViewed: (faceId) => request(`/protection/also-viewed/${faceId}`),
};

export const provider = {
  profile: (userId) => request(`/auth/provider/${userId}`),
};

export const auctions = {
  list: (status = '') => request(`/auctions?status=${status}`),
  get: (id) => request(`/auctions/${id}`),
  create: (data) => request('/auctions', { method: 'POST', body: JSON.stringify(data) }),
  bid: (id, amount) => request(`/auctions/${id}/bid`, { method: 'POST', body: JSON.stringify({ amount }) }),
  tiers: () => request('/auctions/tiers/all'),
};

export const tracking = {
  stats: (licenseId) => request(`/tracking/stats/${licenseId}`),
  embedCode: (licenseId) => request(`/tracking/embed/${licenseId}`),
};

export const advanced = {
  estimateValue: (params) => request(`/estimate-value?${new URLSearchParams(params)}`, { method: 'POST' }),
  referralCode: () => request('/referral/my-code'),
  applyReferral: (code) => request('/referral/apply', { method: 'POST', body: JSON.stringify({ code }) }),
  priceEngine: (faceId) => request(`/price-engine/${faceId}`),
  matchFaces: (params) => request(`/match?${new URLSearchParams(params)}`),
  insuranceEnroll: (data) => request('/insurance/enroll', { method: 'POST', body: JSON.stringify(data) }),
  myInsurance: () => request('/insurance/my'),
  legalRequest: (faceId, issue) => request(`/legal/request?face_id=${faceId}&issue=${issue}`, { method: 'POST' }),
  buyerPortfolio: (userId) => request(`/buyer-portfolio/${userId}`),
};

export const moodboards = {
  list: () => request('/moodboards'),
  create: (data) => request('/moodboards', { method: 'POST', body: JSON.stringify(data) }),
  get: (id) => request(`/moodboards/${id}`),
  delete: (id) => request(`/moodboards/${id}`, { method: 'DELETE' }),
  addFace: (boardId, faceId) => request(`/moodboards/${boardId}/add/${faceId}`, { method: 'POST' }),
  removeFace: (boardId, faceId) => request(`/moodboards/${boardId}/remove/${faceId}`, { method: 'DELETE' }),
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
