import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const IP_ADDRESS = '192.168.100.155';
const BASE_URL = `http://${IP_ADDRESS}:8080`;

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    // Si hay token y la ruta NO es de login, se añade el header
    if (token && !config.url.includes('loginMovile')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
