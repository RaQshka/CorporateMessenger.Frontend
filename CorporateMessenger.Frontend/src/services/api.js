import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5056/api',
  withCredentials: true, // Для отправки и получения куки (refreshToken, UserId)
});

// Перехватчик запросов: добавление токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Перехватчик ответов: обработка 401 и обновление токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const response = await api.post('/auth/refresh');
        const newToken = response.data.accessToken;
        localStorage.setItem('token', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest); // Повторяем исходный запрос
      } catch (refreshError) {
        localStorage.removeItem('token');
        window.location.href = '/login'; // Перенаправление на логин
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

// --- AuthController ---
export const registerUser = (data) => api.post('/auth/register', data).then((res) => res.data);

export const confirmEmail = (userId, token) =>
  api.get(`/auth/confirm-email?userId=${userId}&token=${token}`).then((res) => res.data);

export const loginUser = (data) => api.post('/auth/login', data).then((res) => res.data);

export const logoutUser = () => api.post('/auth/logout').then((res) => res.data);

export const assignRole = (data) => api.post('/auth/assign-role', data).then((res) => res.data);

export const removeRole = (data) => api.post('/auth/remove-role', data).then((res) => res.data);

export const refreshToken = () => api.post('/auth/refresh').then((res) => res.data);

export const confirmAccount = (data) => api.post('/auth/confirm-account', data).then((res) => res.data);

export const deleteUser = (data) => api.delete('/auth/delete-user', { data }).then((res) => res.data);

export const getUserInfo = (userId) =>
  api.get(`/auth/user-info?UserId=${userId}`).then((res) => res.data);

export const getFullUserInfo = (userId) =>
  api.get(`/auth/user-full-info?UserId=${userId}`).then((res) => res.data);

export const getProfile = () => api.get('/auth/profile').then((res) => res.data);

export const getUsers = () => api.get('/auth/get-users').then((res) => res.data);

export const getRoles = () => api.get('/auth/roles').then((res) => res.data);

export const getUnconfirmedUsers = () => api.get('/auth/get-unconfirmed-users').then((res) => res.data);

// --- ChatController ---
export const getUserChats = () => api.get('/chats').then((res) => res.data);

export const createChat = (data) => api.post('/chats', data).then((res) => res.data);

export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`).then((res) => res.data);

export const renameChat = (chatId, data) =>
  api.put(`/chats/${chatId}/rename`, data).then((res) => res.data);

export const addUserToChat = (chatId, data) =>
  api.post(`/chats/${chatId}/users`, data).then((res) => res.data);

export const removeUserFromChat = (chatId, userId) =>
  api.delete(`/chats/${chatId}/users/${userId}`).then((res) => res.data);

export const setChatAdmin = (chatId, userId, data) =>
  api.put(`/chats/${chatId}/users/${userId}/admin`, data).then((res) => res.data);

export const grantChatAccess = (chatId, data) =>
  api.post(`/chats/${chatId}/access/grant`, data).then((res) => res.data);

export const revokeChatAccess = (chatId, data) =>
  api.post(`/chats/${chatId}/access/revoke`, data).then((res) => res.data);

export const getChatInfo = (chatId) => api.get(`/chats/${chatId}`).then((res) => res.data);

export const getChatParticipants = (chatId) =>
  api.get(`/chats/${chatId}/users`).then((res) => res.data);

export const getChatAccessRules = (chatId) =>
  api.get(`/chats/${chatId}/access`).then((res) => res.data);

export const getChatActivity = (chatId, skip = 0, take = 50) =>
  api.get(`/chats/${chatId}/activity?skip=${skip}&take=${take}`).then((res) => res.data);

// --- DocumentsController ---
export const uploadDocument = (data) => {
    const formData = new FormData();
    formData.append('File', data.file);
    formData.append('ChatId', data.chatId);
    return api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((res) => res.data);
  };

export const downloadDocument = (documentId) =>
  api.get(`/documents/${documentId}/download`, { responseType: 'blob' }).then((res) => res.data);

export const deleteDocument = (documentId) =>
  api.delete(`/documents/${documentId}`).then((res) => res.data);

export const grantDocumentAccess = (documentId, data) =>
  api.post(`/documents/${documentId}/access/grant`, data).then((res) => res.data);

export const revokeDocumentAccess = (documentId, data) =>
  api.post(`/documents/${documentId}/access/revoke`, data).then((res) => res.data);

export const getDocuments = (chatId) =>
  api.get(`/documents/chat/${chatId}`).then((res) => res.data);

export const getDocumentAccessRules = (documentId) =>
  api.get(`/documents/${documentId}/access`).then((res) => res.data);

// --- LogsController ---
export const getUserAuditLogs = (userId, days, startTime, endDate) => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (days) params.append('days', days);
  if (startTime) params.append('startTime', startTime);
  if (endDate) params.append('endDate', endDate);
  return api.get(`/logs/user-audit?${params.toString()}`).then((res) => res.data);
};

export const exportUserAuditLogs = (userId, days, startTime, endDate) => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (days) params.append('days', days);
  if (startTime) params.append('startTime', startTime);
  if (endDate) params.append('endDate', endDate);
  return api.get(`/logs/export-user-audit?${params.toString()}`, { responseType: 'blob' }).then((res) => res.data);
};

// --- MessagesController ---
export const sendMessage = (data) => api.post('/messages', data).then((res) => res.data);

export const editMessage = (messageId, data) =>
  api.put(`/messages/${messageId}`, data).then((res) => res.data);

export const deleteMessage = (messageId) =>
  api.delete(`/messages/${messageId}`).then((res) => res.data);

export const addReaction = (messageId, data) =>
  api.post(`/messages/${messageId}/reactions`, data).then((res) => res.data);

export const removeReaction = (messageId) =>
  api.delete(`/messages/${messageId}/reactions`).then((res) => res.data);

export const getMessages = (chatId, skip = 0, take = 20) =>
  api.get(`/messages/chat/${chatId}?skip=${skip}&take=${take}`).then((res) => res.data);

export const getReactions = (messageId) =>
  api.get(`/messages/${messageId}/reactions`).then((res) => res.data);

export default api;