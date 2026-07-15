import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const api = axios.create({ baseURL: API_BASE });

// Interceptors removed since auth is bypassed

export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
  resetPassword:  (data) => api.post('/auth/reset-password', data),
};

export const userApi = {
  getMe:          ()            => api.get('/users/me'),
  getUser:        (id)          => api.get(`/users/${id}`),
  follow:         (id)          => api.post(`/users/${id}/follow`),
  unfollow:       (id)          => api.delete(`/users/${id}/follow`),
  getSuggestions: (limit = 10)  => api.get('/users/suggestions', { params: { limit } }),
  getPath:        (targetId)    => api.get('/users/path', { params: { targetId } }),
  getCommunity:   (userId)      => api.get('/users/community-size', { params: { userId } }),
  search:         (q)           => api.get('/users/search', { params: { q } }),
  updateProfile:  (data)        => api.put('/users/profile', data),
};

export const postApi = {
  create:         (data)             => api.post('/posts', data),
  getFeed:        (page = 0, size = 20) => api.get('/posts/feed', { params: { page, size } }),
  getEdgeRank:    (limit = 20)        => api.get('/posts/edgerank', { params: { limit } }),
  getTrending:    ()                 => api.get('/posts/trending'),
  like:           (id)               => api.post(`/posts/${id}/like`),
  unlike:         (id)               => api.delete(`/posts/${id}/like`),
  getComments:    (id)               => api.get(`/posts/${id}/comments`),
  addComment:     (id, content)      => api.post(`/posts/${id}/comments`, { content }),
  deleteComment:  (postId, commentId) => api.delete(`/posts/${postId}/comments/${commentId}`),
  search:         (q)                => api.get('/posts/search', { params: { q } }),
};


export const mediaApi = {
  upload: (formData) => api.post('/media/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
};

export const notificationApi = {
  getNotifications: (page = 0) => api.get('/notifications', { params: { page } }),
  getUnreadCount:   ()         => api.get('/notifications/unread-count'),
  markAsRead:       ()         => api.post('/notifications/mark-as-read'),
};

export const graphApi = {
  getNetwork: ()           => api.get('/graph/my-network'),
  getPath:    (targetId)   => api.get('/graph/path', { params: { targetId } }),
  getStats:   ()           => api.get('/graph/stats'),
};

export const messageApi = {
  getConversation: (userId) => api.get(`/messages/conversation/${userId}`),
};

export const adminApi = {
  getStats:        ()            => api.get('/admin/stats'),
  getAllUsers:      (page = 0)   => api.get('/admin/users', { params: { page } }),
  deactivateUser:  (id)         => api.put(`/admin/users/${id}/deactivate`),
  reactivateUser:  (id)         => api.put(`/admin/users/${id}/reactivate`),
  changeRole:      (id, role)   => api.put(`/admin/users/${id}/role`, { role }),
  deletePost:      (id)         => api.delete(`/admin/posts/${id}`),
  getAuditLog:     (page = 0)   => api.get('/admin/audit', { params: { page } }),
  getRecentAudit:  ()           => api.get('/admin/audit/recent'),
  getUserAudit:    (userId)     => api.get(`/admin/audit/user/${userId}`),
};

export const aiApi = {
  sentiment:          (text)    => api.post('/ai/sentiment', { text }),
  scoreContent:       (content) => api.post('/ai/score', { content }),
  trendingTopics:     ()        => api.get('/ai/trending-topics'),
  generate:           (topic)   => api.get('/ai/generate', { params: { topic } }),
  sentimentDashboard: ()        => api.get('/ai/sentiment-dashboard'),
  insights:           ()        => api.get('/ai/insights'),
};

export default api;

