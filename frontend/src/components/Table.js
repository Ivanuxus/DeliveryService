import React, { useState, useEffect } from 'react';
import axios from 'axios';
import apiClient from '../utils/apiClient';
import {
    Table as MuiTable,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    TableContainer,
    Paper,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    MenuItem
} from '@mui/material';
import { useNavigate } from 'react-router-dom';

const Table = ({ columns, endpoint }) => {
    const [data, setData] = useState([]);
    const [open, setOpen] = useState(false);
    const [editRow, setEditRow] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [couriers, setCouriers] = useState([]);
    const [statuses] = useState(["Pending", "In Progress", "Delivered"]);
    const navigate = useNavigate();

    // Fetch main data
    useEffect(() => {
        fetchData();
    }, [endpoint]);

    const fetchData = () => {
        apiClient.get(`/${endpoint}/`)
            .then((response) => setData(response.data))
            .catch((error) => console.error('Ошибка при загрузке данных:', error));
    };

    // Fetch customers and couriers
    useEffect(() => {
        if (endpoint === "orders") {
            apiClient.get('/customers/')
                .then((response) => setCustomers(response.data))
                .catch((error) => console.error('Ошибка при загрузке клиентов:', error));
    
            apiClient.get('/couriers/')
                .then((response) => setCouriers(response.data))
                .catch((error) => console.error('Ошибка при загрузке курьеров:', error));
        }
    }, [endpoint]);

    // Handle edit
    const handleEdit = (row) => {
        setEditRow(row);
        setOpen(true);
    };

    // Handle save
    const handleSave = () => {
        apiClient.put(`/${endpoint}/${editRow.id}/`, editRow)
            .then(() => {
                fetchData(); // Обновляем данные после сохранения
                setOpen(false);
                setEditRow(null);
            })
            .catch((error) => console.error('Ошибка при сохранении данных:', error));
    };

    // Handle delete
    const handleDelete = (id) => {
        apiClient.delete(`/${endpoint}/${id}/`)
            .then(() => fetchData())
            .catch((error) => console.error('Ошибка при удалении записи:', error));
    };

    // Handle change
    const handleChange = (field, value) => {
        setEditRow({ ...editRow, [field]: value });
    };

    // Handle track button
    const handleTrack = (row) => {
        navigate(`/track/${row.id}`, { state: { address: row.address } });
    };

    return (
        <div>
            <TableContainer component={Paper}>
                <MuiTable>
                    <TableHead>
                        <TableRow>
                            {columns.map((column) => (
                                <TableCell key={column.key}>{column.title}</TableCell>
                            ))}
                            <TableCell>Действия</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.id}>
                                {columns.map((column) => (
                                    <TableCell key={column.key}>
                                        {row[column.dataIndex]}
                                    </TableCell>
                                ))}
                                <TableCell>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleEdit(row)}
                                        style={{ marginRight: 8 }}
                                    >
                                        Редактировать
                                    </Button>
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        onClick={() => handleDelete(row.id)}
                                        style={{ marginRight: 8 }}
                                    >
                                        Удалить
                                    </Button>
                                    {(endpoint === "orders" || endpoint === "customers") && (
                                        <Button
                                            variant="contained"
                                            color="default"
                                            onClick={() => handleTrack(row)}
                                        >
                                            Показать на карте
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </MuiTable>
            </TableContainer>

            <Dialog open={open} onClose={() => setOpen(false)}>
                <DialogTitle>Редактировать запись</DialogTitle>
                <DialogContent>
                    {columns.map((column) => {
                        if (column.dataIndex === "customer_name") {
                            return (
                                <TextField
                                    key={column.key}
                                    select
                                    label="Клиент"
                                    fullWidth
                                    value={editRow?.customer || ""}
                                    onChange={(e) => handleChange("customer", e.target.value)}
                                    margin="dense"
                                >
                                    {customers.map((customer) => (
                                        <MenuItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            );
                        } else if (column.dataIndex === "courier_name") {
                            return (
                                <TextField
                                    key={column.key}
                                    select
                                    label="Курьер"
                                    fullWidth
                                    value={editRow?.courier || ""}
                                    onChange={(e) => handleChange("courier", e.target.value)}
                                    margin="dense"
                                >
                                    {couriers.map((courier) => (
                                        <MenuItem key={courier.id} value={courier.id}>
                                            {courier.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            );
                        } else if (column.dataIndex === "status") {
                            return (
                                <TextField
                                    key={column.key}
                                    select
                                    label="Статус"
                                    fullWidth
                                    value={editRow?.status || ""}
                                    onChange={(e) => handleChange("status", e.target.value)}
                                    margin="dense"
                                >
                                    {statuses.map((status) => (
                                        <MenuItem key={status} value={status}>
                                            {status}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            );
                        } else {
                            return (
                                <TextField
                                    key={column.key}
                                    label={column.title}
                                    fullWidth
                                    value={editRow?.[column.dataIndex] || ""}
                                    onChange={(e) =>
                                        handleChange(column.dataIndex, e.target.value)
                                    }
                                    margin="dense"
                                />
                            );
                        }
                    })}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Отмена</Button>
                    <Button onClick={handleSave} variant="contained" color="primary">
                        Сохранить
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default Table;