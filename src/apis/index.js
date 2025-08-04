import axios from 'axios';
const instance = axios.create({
  baseURL: 'https://api.lngmerch.co/api',
});

// instance.interceptors.request.use(
//   (config) => {
//     if (localStorage.getItem('accessToken')) {
//       config.headers.authorization = localStorage.getItem('accessToken');
//     }
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );
export default instance;
