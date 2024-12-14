import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Button, Container, Typography, Box } from '@mui/material';
import axios from 'axios';

const Login = () => {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
    });
    const navigate = useNavigate();

    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSubmit = () => {
        axios.post('http://127.0.0.1:8000/api/login/', formData)
    .then((response) => {
        const { access, refresh } = response.data;
        const { role } = response.data.user; // Предположим, роль возвращается с токеном
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        localStorage.setItem('userRole', role);
        alert('Вход выполнен успешно!');
        navigate('/');
    })
    .catch((err) => {
        console.error('Ошибка при входе:', err);
        alert('Неправильное имя пользователя или пароль!');
    });
    };

    return (
        <Container>
            <Box sx={{ maxWidth: 400, margin: 'auto', mt: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Вход
                </Typography>
                <TextField
                    label="Имя пользователя"
                    fullWidth
                    margin="normal"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                />
                <TextField
                    label="Пароль"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSubmit}
                >
                    Войти
                </Button>
            </Box>
        </Container>
    );
};

export default Login;