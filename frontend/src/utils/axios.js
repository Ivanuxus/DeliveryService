import axios from 'axios';
import { refreshAccessToken } from './auth';

const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/',
});

apiClient.interceptors.request.use(async (config) => {
    const accessToken = localStorage.getItem('accessToken');
    console.log('Токен перед запросом:', accessToken); // Логируем токен
    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    console.log('Заголовки запроса:', config.headers); // Логируем заголовки
    return config;
});

// Интерсептор для ответов
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response &&
            error.response.status === 401 &&
            !originalRequest._retry
        ) {
            originalRequest._retry = true;
            const success = await refreshAccessToken();
            if (success) {
                originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
                return apiClient(originalRequest);
            }
        }
        return Promise.reject(error);
    }
);

export default apiClient;