import axios from 'axios';
const instance = axios.create({
  baseURL: /*import.meta.env.VITE_API_BASE_URL || */ 'https://api.lngmerch.co/api',
  headers: {
    'Content-Type': 'application/json',
  },
});
instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken')?.replace(/^"|"$/g, '');
    if (localStorage.getItem('accessToken')) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default instance;
