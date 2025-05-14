import React, { useState } from "react";
import Table from "../components/Table";
import apiClient from "../utils/apiClient"; // Путь зависит от расположения файла apiClient
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
  { title: "Транспортное средство", dataIndex: "vehicle", key: "vehicle" },
  { title: "Email", dataIndex: "email", key: "email" },
];

const Couriers = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    vehicle: "",
    email: "",
  });

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle form submission
  const handleSubmit = () => {
    apiClient
      .post("/couriers/", formData)
      .then(() => {
        setOpen(false);
        setFormData({
          name: "",
          phone: "",
          vehicle: "",
          email: "",
        });
        window.location.reload(); // Reload the page to fetch updated couriers
      })
      .catch((err) => console.error("Ошибка при добавлении курьера:", err));
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
          Курьеры
        </Typography>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpen(true)}
        >
          Добавить курьера
        </Button>
      </Box>
      <Table columns={columns} endpoint="couriers" />

      {/* Диалоговое окно добавления курьера */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Добавить курьера</DialogTitle>
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
            label="Транспортное средство"
            fullWidth
            margin="normal"
            value={formData.vehicle}
            onChange={(e) => handleChange("vehicle", e.target.value)}
          />
          <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
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

export default Couriers;
