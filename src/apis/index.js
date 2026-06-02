import axios from 'axios';
const instance = axios.create({ update/img/etsy
   baseURL: 'https://api.lngmerch.co/api',
  //  baseURL: 'http://localhost:5000/api',

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
