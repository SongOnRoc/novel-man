import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/proxy', // 指向Next.js的BFF代理
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default apiClient;