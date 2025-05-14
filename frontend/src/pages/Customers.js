import React, { useState } from "react";
import apiClient from "../utils/apiClient"; // Путь зависит от расположения файла apiClient
import Table from "../components/Table";
import {
  Typography,
  Container,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
} from "@mui/material";
import axios from "axios";

const columns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "ФИО", dataIndex: "name", key: "name" },
  { title: "Телефон", dataIndex: "phone", key: "phone" },
  { title: "Электронная почта", dataIndex: "email", key: "email" },
  { title: "Адрес", dataIndex: "address", key: "address" },
];

const Customers = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle form submission
  const handleSubmit = () => {
    apiClient
      .post("/customers/", formData) // Используем относительный путь с apiClient
      .then(() => {
        setOpen(false);
        setFormData({
          name: "",
          phone: "",
          email: "",
          address: "",
        });
        window.location.reload(); // Перезагружаем страницу для обновления списка клиентов
      })
      .catch((err) => console.error("Ошибка при добавлении клиента:", err));
  };

  return (
    <Container>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <Typography variant="h1" gutterBottom>
          Клиенты
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Добавить клиента
        </Button>
      </Box>
      <Table columns={columns} endpoint="customers" />

      {/* Диалоговое окно добавления клиента */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Добавление нового клиента</DialogTitle>
        <DialogContent>
          <TextField
            label="ФИО"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => handleChange("name", e.target.value)}
          />
          <TextField
            label="Телефон"
            fullWidth
            margin="normal"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
          />
          <TextField
            label="Электронная почта"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
          />
          <TextField
            label="Адрес"
            fullWidth
            margin="normal"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
          />
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

export default Customers;
