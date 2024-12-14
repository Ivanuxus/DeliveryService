import React, { useState, useEffect } from 'react';
import Table from '../components/Table';
import apiClient from '../utils/apiClient'; // Путь зависит от расположения apiClient
import {
    Typography,
    Container,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem,
    Box,
} from '@mui/material';

const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Клиент', dataIndex: 'customer_name', key: 'customer_name' },
    { title: 'Курьер', dataIndex: 'courier_name', key: 'courier_name' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
    { title: 'Адрес', dataIndex: 'address', key: 'address' },
];

const Orders = () => {
    const [open, setOpen] = useState(false);
    const [customers, setCustomers] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [formData, setFormData] = useState({
        customer: '',
        courier: '',
        address: '',
        status: 'Pending', // Default status
    });

    useEffect(() => {
        apiClient.get('/customers/').then((res) => setCustomers(res.data));
        apiClient.get('/couriers/').then((res) => setCouriers(res.data));
    }, []);

    // Handle form input changes
    const handleChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
    };

    // Handle form submission
    const handleSubmit = () => {
        apiClient
            .post('/orders/', formData)
            .then(() => {
                setOpen(false);
                setFormData({
                    customer: '',
                    courier: '',
                    address: '',
                    status: 'Pending',
                });
                window.location.reload(); // Reload the page to fetch updated orders
            })
            .catch((err) => console.error('Ошибка при добавлении заказа:', err));
    };

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant="h1" gutterBottom>Заказы</Typography>
                <Button variant="contained" color="primary" onClick={() => setOpen(true)}>
                    Добавить заказ
                </Button>
            </Box>
            <Table columns={columns} endpoint="orders" />

            {/* Диалоговое окно добавления заказа */}
            <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
                <DialogTitle>Добавить заказ</DialogTitle>
                <DialogContent>
                    <TextField
                        select
                        label="Клиент"
                        fullWidth
                        margin="normal"
                        value={formData.customer}
                        onChange={(e) => handleChange('customer', e.target.value)}
                    >
                        {customers.map((customer) => (
                            <MenuItem key={customer.id} value={customer.id}>
                                {customer.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        select
                        label="Курьер"
                        fullWidth
                        margin="normal"
                        value={formData.courier}
                        onChange={(e) => handleChange('courier', e.target.value)}
                    >
                        {couriers.map((courier) => (
                            <MenuItem key={courier.id} value={courier.id}>
                                {courier.name}
                            </MenuItem>
                        ))}
                    </TextField>
                    <TextField
                        label="Адрес"
                        fullWidth
                        margin="normal"
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                    />
                    <TextField
                        select
                        label="Статус"
                        fullWidth
                        margin="normal"
                        value={formData.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                    >
                        {['Pending', 'In Progress', 'Delivered'].map((status) => (
                            <MenuItem key={status} value={status}>
                                {status}
                            </MenuItem>
                        ))}
                    </TextField>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Отмена</Button>
                    <Button variant="contained" color="primary" onClick={handleSubmit}>
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default Orders;