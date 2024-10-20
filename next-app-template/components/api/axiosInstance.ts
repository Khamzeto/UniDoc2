import axios from 'axios';

export const API_URL = 'http://localhost:5001';

const $api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Отправка куков или аутентификационной информации
});

export default $api;
