import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5056/api/auth',
});

export const login = async (username, password) => {
  try {
    const response = await api.post('/login', { username, password });
    return response.data;
  } catch (error) {
    return { message: error.response?.data?.message || 'Ошибка сервера' };
  }
};

export const register = async (name, email, password) => {
  try {
    const response = await api.post('/register', { name, email, password });
    return response.data;
  } catch (error) {
    return { message: error.response?.data?.message || 'Ошибка сервера' };
  }
};