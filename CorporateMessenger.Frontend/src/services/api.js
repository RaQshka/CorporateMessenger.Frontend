import axios from 'axios';

// Глобальный счетчик попыток рефреша токена
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 5;
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const api = axios.create({
  baseURL: 'http://localhost:5056/api',
  withCredentials: true,
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
    
    // Если ошибка не 401 или это уже повторная попытка после рефреша
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }
    
    // Не пытаемся рефрешить для эндпоинтов аутентификации
    if (
      originalRequest.url.includes('/auth/login') ||
      originalRequest.url.includes('/auth/register') ||
      originalRequest.url.includes('/auth/refresh')
    ) {
      localStorage.removeItem('token');
      refreshAttempts = 0;
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Если превышен лимит попыток
    if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
      localStorage.removeItem('token');
      refreshAttempts = 0;
      window.location.href = '/login';
      return Promise.reject(error);
    }
    
    // Если уже идет процесс рефреша, ставим запрос в очередь
    if (isRefreshing) {
      try {
        const token = await new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        });
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }
    
    // Начинаем процесс рефреша
    isRefreshing = true;
    refreshAttempts += 1;
    
    try {
      const response = await api.post('/auth/refresh');
      const newToken = response.data.accessToken;
      localStorage.setItem('token', newToken);
      
      // Сбрасываем счетчик при успешном рефреше
      refreshAttempts = 0;
      
      // Обрабатываем очередь запросов
      processQueue(null, newToken);
      
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);
      localStorage.removeItem('token');
      refreshAttempts = 0;
      window.location.href = '/login';
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// --- AuthController ---
/**
 * Регистрирует нового пользователя.
 * @param {import('./api-types').RegisterUserCommand} data - Данные для регистрации.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const registerUser = (data) => api.post('/auth/register', data).then((res) => res.data);

/**
 * Подтверждает email пользователя.
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @param {string} token - Токен подтверждения.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const confirmEmail = (userId, token) =>
  api.get(`/auth/confirm-email?userId=${userId}&token=${token}`).then((res) => res.data);

/**
 * Выполняет вход пользователя.
 * @param {import('./api-types').LoginUserCommand} data - Данные для входа.
 * @returns {Promise<{accessToken: string}>} - Токен доступа.
 */
export const loginUser = (data) => api.post('/auth/login', data).then((res) => res.data);

/**
 * Выполняет выход пользователя.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const logoutUser = () => api.post('/auth/logout').then((res) => res.data);

/**
 * Назначает роль пользователю.
 * @param {import('./api-types').AssignRoleCommand} data - Данные для назначения роли.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const assignRole = (data) => api.post('/auth/assign-role', data).then((res) => res.data);

/**
 * Удаляет роль у пользователя.
 * @param {import('./api-types').RemoveRoleCommand} data - Данные для удаления роли.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const removeRole = (data) => api.post('/auth/remove-role', data).then((res) => res.data);

/**
 * Обновляет токен доступа.
 * @returns {Promise<{accessToken: string}>} - Новый токен доступа.
 */
export const refreshToken = () => api.post('/auth/refresh').then((res) => res.data);

/**
 * Подтверждает аккаунт пользователя.
 * @param {import('./api-types').ConfirmAccountCommand} data - Данные для подтверждения аккаунта.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const confirmAccount = (data) => api.post('/auth/confirm-account', data).then((res) => res.data);

/**
 * Удаляет пользователя.
 * @param {import('./api-types').DeleteUserCommand} data - Данные для удаления пользователя.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const deleteUser = (data) => api.delete('/auth/delete-user', { data }).then((res) => res.data);

/**
 * Получает информацию о пользователе.
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @returns {Promise<object>} - Информация о пользователе.
 */
export const getUserInfo = (userId) => api.get(`/auth/user-info?UserId=${userId}`).then((res) => res.data);

/**
 * Получает полную информацию о пользователе.
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @returns {Promise<object>} - Полная информация о пользователе.
 */
export const getFullUserInfo = (userId) => api.get(`/auth/full-user-info?UserId=${userId}`).then((res) => res.data);

/**
 * Получает профиль текущего пользователя.
 * @returns {Promise<object>} - Профиль пользователя.
 */
export const getProfile = () => api.get('/auth/profile').then((res) => res.data);

/**
 * Получает список пользователей.
 * @param {string} [searchText] - Текст для поиска (опционально).
 * @returns {Promise<object[]>} - Список пользователей.
 */
export const getUsers = (searchText) => api.get(`/auth/get-users${searchText ? `?SearchText=${encodeURIComponent(searchText)}` : ''}`).then((res) => res.data);

/**
 * Получает список ролей.
 * @returns {Promise<object[]>} - Список ролей.
 */
export const getRoles = () => api.get('/auth/roles').then((res) => res.data);

/**
 * Получает список неподтвержденных пользователей.
 * @returns {Promise<object[]>} - Список неподтвержденных пользователей.
 */
export const getUnconfirmedUsers = () => api.get('/auth/get-unconfirmed-users').then((res) => res.data);

// --- ChatController ---
/**
 * Получает список чатов текущего пользователя.
 * @returns {Promise<object[]>} - Список чатов.
 */
export const getUserChats = () => api.get('/chats').then((res) => res.data);

/**
 * Создает новый чат.
 * @param {import('./api-types').CreateChatDto} data - Данные для создания чата.
 * @returns {Promise<{chatId: string}>} - Идентификатор созданного чата.
 */
export const createChat = (data) => api.post('/chats', data).then((res) => res.data);

/**
 * Удаляет чат.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const deleteChat = (chatId) => api.delete(`/chats/${chatId}`).then((res) => res.data);

/**
 * Переименовывает чат.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {import('./api-types').RenameChatDto} data - Данные для переименования.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const renameChat = (chatId, data) => api.put(`/chats/${chatId}/rename`, data).then((res) => res.data);

/**
 * Добавляет пользователя в чат.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {import('./api-types').AddUserDto} data - Данные пользователя для добавления.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const addUserToChat = (chatId, data) => api.post(`/chats/${chatId}/users`, data).then((res) => res.data);

/**
 * Удаляет пользователя из чата.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const removeUserFromChat = (chatId, userId) => api.delete(`/chats/${chatId}/users/${userId}`).then((res) => res.data);

/**
 * Назначает или снимает статус администратора в чате.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @param {import('./api-types').SetAdminDto} data - Данные статуса администратора.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const setChatAdmin = (chatId, userId, data) => api.put(`/chats/${chatId}/users/${userId}/admin`, data).then((res) => res.data);

/**
 * Предоставляет доступ к чату для роли.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {import('./api-types').AccessDto} data - Данные доступа.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const grantChatAccess = (chatId, data) => api.post(`/chats/${chatId}/access/grant`, data).then((res) => res.data);

/**
 * Отзывает доступ к чату для роли.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {import('./api-types').AccessDto} data - Данные доступа.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const revokeChatAccess = (chatId, data) => api.post(`/chats/${chatId}/access/revoke`, data).then((res) => res.data);

/**
 * Получает информацию о чате.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<object>} - Информация о чате.
 */
export const getChatInfo = (chatId) => api.get(`/chats/${chatId}`).then((res) => res.data);

/**
 * Получает список участников чата.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<object[]>} - Список участников.
 */
export const getChatParticipants = (chatId) => api.get(`/chats/${chatId}/users`).then((res) => res.data);

/**
 * Получает правила доступа к чату.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<object[]>} - Список правил доступа.
 */
export const getChatAccessRules = (chatId) => api.get(`/chats/${chatId}/access`).then((res) => res.data);

/**
 * Получает правила доступа для конкретного пользователя в чате.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @returns {Promise<object>} - Правила доступа для пользователя.
 */
export const getUserChatAccessRules = (chatId, userId) => api.get(`/chats/${chatId}/access/${userId}`).then((res) => res.data);

/**
 * Получает активность чата.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {number} [skip=0] - Количество элементов для пропуска.
 * @param {number} [take=50] - Количество элементов для получения.
 * @returns {Promise<object[]>} - Список активности чата.
 */
export const getChatActivity = (chatId, skip = 0, take = 50) =>
  api.get(`/chats/${chatId}/activity?skip=${skip}&take=${take}`).then((res) => res.data);

// --- DocumentsController ---
/**
 * Загружает документ в чат.
 * @param {object} data - Данные для загрузки.
 * @param {File} data.file - Файл для загрузки.
 * @param {string} data.chatId - Идентификатор чата (UUID).
 * @param {string} [data.uploaderId] - Идентификатор загрузившего (UUID, опционально).
 * @returns {Promise<object>} - Результат загрузки.
 */
export const uploadDocument = (data) => {
  const formData = new FormData();
  formData.append('File', data.file);
  formData.append('ChatId', data.chatId);
  if (data.uploaderId) formData.append('UploaderId', data.uploaderId);
  return api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then((res) => res.data);
};

/**
 * Скачивает документ.
 * @param {string} documentId - Идентификатор документа (UUID).
 * @returns {Promise<Blob>} - Файл документа.
 */
export const downloadDocument = (documentId) =>
  api.get(`/documents/${documentId}/download`, { responseType: 'blob' }).then((res) => res.data);

/**
 * Удаляет документ.
 * @param {string} documentId - Идентификатор документа (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const deleteDocument = (documentId) => api.delete(`/documents/${documentId}`).then((res) => res.data);

/**
 * Предоставляет доступ к документу для роли.
 * @param {string} documentId - Идентификатор документа (UUID).
 * @param {import('./api-types').DocumentAccessRequest} data - Данные запроса доступа.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const grantDocumentAccess = (documentId, data) =>
  api.post(`/documents/${documentId}/access/grant`, data).then((res) => res.data);

/**
 * Отзывает доступ к документу для роли.
 * @param {string} documentId - Идентификатор документа (UUID).
 * @param {import('./api-types').DocumentAccessRequest} data - Данные запроса доступа.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const revokeDocumentAccess = (documentId, data) =>
  api.post(`/documents/${documentId}/access/revoke`, data).then((res) => res.data);

/**
 * Получает список документов в чате.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<object[]>} - Список документов.
 */
export const getDocuments = (chatId) => api.get(`/documents/chat/${chatId}`).then((res) => res.data);

/**
 * Получает правила доступа к документу.
 * @param {string} documentId - Идентификатор документа (UUID).
 * @returns {Promise<object[]>} - Список правил доступа.
 */
export const getDocumentAccessRules = (documentId) => api.get(`/documents/${documentId}/access`).then((res) => res.data);

// --- LogsController ---
/**
 * Получает аудит-логи пользователя.
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @param {number} [days] - Количество дней (опционально).
 * @param {Date} [startTime] - Начальное время (опционально).
 * @param {Date} [endDate] - Конечное время (опционально).
 * @returns {Promise<object[]>} - Список аудит-логов.
 */
export const getUserAuditLogs = (userId, days, startTime, endDate) => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (days) params.append('days', days);
  if (startTime) params.append('startTime', startTime.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  return api.get(`/logs/user-audit?${params.toString()}`).then((res) => res.data);
};

/**
 * Экспортирует аудит-логи пользователя в виде файла.
 * @param {string} userId - Идентификатор пользователя (UUID).
 * @param {number} [days] - Количество дней (опционально).
 * @param {Date} [startTime] - Начальное время (опционально).
 * @param {Date} [endDate] - Конечное время (опционально).
 * @returns {Promise<Blob>} - Экспортированный файл.
 */
export const exportUserAuditLogs = (userId, days, startTime, endDate) => {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (days) params.append('days', days);
  if (startTime) params.append('startTime', startTime.toISOString());
  if (endDate) params.append('endDate', endDate.toISOString());
  return api.get(`/logs/export-user-audit?${params.toString()}`, { responseType: 'blob' }).then((res) => res.data);
};

// --- MessagesController ---
/**
 * Отправляет сообщение в чат.
 * @param {import('./api-types').SendMessageCommand} data - Данные сообщения.
 * @returns {Promise<{messageId: string}>} - Идентификатор отправленного сообщения.
 */
export const sendMessage = (data) => api.post('/messages', data).then((res) => res.data);

/**
 * Редактирует сообщение.
 * @param {string} messageId - Идентификатор сообщения (UUID).
 * @param {import('./api-types').EditMessageRequest} data - Данные для редактирования.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const editMessage = (messageId, data) => api.put(`/messages/${messageId}`, data).then((res) => res.data);

/**
 * Удаляет сообщение.
 * @param {string} messageId - Идентификатор сообщения (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const deleteMessage = (messageId) => api.delete(`/messages/${messageId}`).then((res) => res.data);

/**
 * Добавляет реакцию к сообщению.
 * @param {string} messageId - Идентификатор сообщения (UUID).
 * @param {import('./api-types').AddReactionRequest} data - Данные реакции.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const addReaction = (messageId, data) => api.post(`/messages/${messageId}/reactions`, data).then((res) => res.data);

/**
 * Удаляет реакцию из сообщения.
 * @param {string} messageId - Идентификатор сообщения (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const removeReaction = (messageId) => api.delete(`/messages/${messageId}/reactions`).then((res) => res.data);

/**
 * Получает сообщения в чате.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {number} [skip=0] - Количество сообщений для пропуска.
 * @param {number} [take=20] - Количество сообщений для получения.
 * @returns {Promise<object[]>} - Список сообщений.
 */
export const getMessages = (chatId, skip = 0, take = 20) =>
  api.get(`/messages/chat/${chatId}?skip=${skip}&take=${take}`).then((res) => res.data);

/**
 * Получает реакции на сообщение.
 * @param {string} messageId - Идентификатор сообщения (UUID).
 * @returns {Promise<object[]>} - Список реакций.
 */
export const getReactions = (messageId) => api.get(`/messages/${messageId}/reactions`).then((res) => res.data);

// --- SecureChatController ---
/**
 * Создает новый безопасный чат.
 * @param {import('./api-types').CreateSecureChatRequest} data - Данные для создания чата.
 * @returns {Promise<{accessKey: string, salt: string, creatorPublicKey: string}>} - Результат создания чата.
 */
export const createSecureChat = (data) => api.post('/secure-chat/Create', data).then((res) => res.data);

/**
 * Входит в безопасный чат.
 * @param {import('./api-types').EnterSecureChatRequest} data - Данные для входа.
 * @returns {Promise<{chatId: string, salt: string, otherPublicKey: string}>} - Результат входа в чат.
 */
export const enterSecureChat = (data) => api.post('/secure-chat/Enter', data).then((res) => res.data);

/**
 * Отправляет зашифрованное сообщение в безопасный чат.
 * @param {import('./api-types').SendEncryptedMessageRequest} data - Данные сообщения.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const sendEncryptedMessage = (data) => api.post('/secure-chat/SendMessage', data).then((res) => res.data);

/**
 * Загружает зашифрованный документ в безопасный чат.
 * @param {import('./api-types').UploadEncryptedDocumentRequest} data - Данные документа.
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const uploadEncryptedDocument = (data) => api.post('/secure-chat/UploadDocument', data).then((res) => res.data);

/**
 * Уничтожает безопасный чат.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @returns {Promise<void>} - Нет возвращаемого значения.
 */
export const destroySecureChat = (chatId) => api.delete(`/secure-chat/Destroy/${chatId}`).then((res) => res.data);

/**
 * Получает активность безопасного чата.
 * @param {string} chatId - Идентификатор чата (UUID).
 * @param {number} [skip=0] - Количество элементов для пропуска.
 * @param {number} [take=100] - Количество элементов для получения.
 * @param {Date} [fromTimestamp] - Начальная временная метка (опционально).
 * @returns {Promise<object[]>} - Список активности чата.
 */
export const getSecureChatActivity = (chatId, skip = 0, take = 100, fromTimestamp = null) => {
  const params = new URLSearchParams();
  params.append('skip', skip);
  params.append('take', take);
  if (fromTimestamp) params.append('fromTimestamp', fromTimestamp.toISOString());
  return api.get(`/secure-chat/Activity/${chatId}?${params.toString()}`).then((res) => res.data);
};

export default api;