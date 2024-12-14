import axios from 'axios';

// Функция для обновления токена
const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.error('Ошибка: отсутствует refreshToken');
        return false;
    }

    try {
        console.log('Попытка обновления токена с refreshToken:', refreshToken);
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: refreshToken,
        });
        console.log('Обновленный токен:', response.data.access);
        localStorage.setItem('accessToken', response.data.access);
        return true;
    } catch (err) {
        console.error('Ошибка обновления токена:', err.response?.data || err.message);
        return false;
    }
};

// Создаём экземпляр Axios
const apiClient = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/', // Укажите ваш базовый URL
});

// Интерсептор запросов
apiClient.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    console.log('Заголовки запроса:', config.headers);
    return config;
});

// Интерсептор ответов
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true; // Помечаем, что запрос уже пытался обновить токен
            const success = await refreshAccessToken();
            if (success) {
                originalRequest.headers['Authorization'] = `Bearer ${localStorage.getItem('accessToken')}`;
                return apiClient(originalRequest); // Повторяем запрос с новым токеном
            }
        }

        return Promise.reject(error); // Если ошибка не 401 или токен не обновился
    }
);

export default apiClient;