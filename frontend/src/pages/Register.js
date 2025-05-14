import React, { useState } from 'react';
import axios from 'axios';
import { TextField, MenuItem, Button, Container, Typography, Box } from '@mui/material';

const Register = () => {
    const [formData, setFormData] = useState({
        username: '',
        email: '', // Общее поле email
        password: '',
        role: '',
        phone: '',
        vehicle: '',
        address: '',
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        axios.post('http://127.0.0.1:8000/api/register/', formData)
            .then(() => {
                alert('Регистрация прошла успешно!');
                setFormData({
                    username: '',
                    email: '',
                    password: '',
                    role: '',
                    phone: '',
                    vehicle: '',
                    address: '',
                });
            })
            .catch((err) => {
                console.error('Ошибка регистрации:', err.response.data);
                alert('Ошибка регистрации. Проверьте введенные данные.');
            });
    };

    return (
        <Container>
            <Box sx={{ marginTop: 4, marginBottom: 2 }}>
                <Typography variant="h4" gutterBottom>
                    Регистрация
                </Typography>
            </Box>
            <form onSubmit={handleSubmit}>
                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        fullWidth
                        label="Имя пользователя"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                    />
                </Box>
                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        fullWidth
                        label="Электронная почта"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </Box>
                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        fullWidth
                        label="Пароль"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </Box>
                <Box sx={{ marginBottom: 2 }}>
                    <TextField
                        select
                        fullWidth
                        label="Роль"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    >
                        <MenuItem value="">Выберите роль</MenuItem>
                        <MenuItem value="customer">Клиент</MenuItem>
                        <MenuItem value="courier">Курьер</MenuItem>
                    </TextField>
                </Box>
                {formData.role === 'courier' && (
                    <Box sx={{ marginBottom: 2 }}>
                        <TextField
                            fullWidth
                            label="Телефон"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Транспортное средство"
                            name="vehicle"
                            value={formData.vehicle}
                            onChange={handleChange}
                            required
                        />
                    </Box>
                )}
                {formData.role === 'customer' && (
                    <Box sx={{ marginBottom: 2 }}>
                        <TextField
                            fullWidth
                            label="Телефон"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                        <TextField
                            fullWidth
                            label="Адрес"
                            name="address"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </Box>
                )}
                <Button type="submit" variant="contained" color="primary" fullWidth>
                    Зарегистрироваться
                </Button>
            </form>
        </Container>
    );
};

export default Register;