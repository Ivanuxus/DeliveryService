import axios from 'axios';

export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
        console.error('Ошибка: отсутствует refreshToken');
        return false;
    }

    try {
        console.log('Попытка обновления токена с refreshToken:', refreshToken);
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh: refreshToken });
        console.log('Обновленный токен:', response.data.access);
        localStorage.setItem('accessToken', response.data.access);
        return true;
    } catch (err) {
        console.error('Ошибка обновления токена:', err.response?.data || err.message);
        return false;
    }
};