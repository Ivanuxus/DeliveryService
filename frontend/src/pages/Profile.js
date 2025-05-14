import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
} from "@mui/material";
import apiClient from "../utils/apiClient";

const Profile = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: "",
    vehicle: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const userRole = localStorage.getItem("userRole");

  const fetchUserData = async () => {
    try {
      setLoading(true);
      console.log("Fetching user data...");
      const response = await apiClient.get("/me/");
      console.log("Received user data:", response.data);

      setFormData((prev) => ({
        ...prev,
        username: response.data.username || "",
        email: response.data.email || "",
        phone: response.data.phone || "",
        vehicle: response.data.vehicle || "",
        address: response.data.address || "",
      }));
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError("Ошибка при загрузке данных пользователя");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const handleChange = (field, value) => {
    console.log("Updating field:", field, "with value:", value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords if changing
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setError("Новые пароли не совпадают");
        return;
      }
      if (!formData.currentPassword) {
        setError("Введите текущий пароль");
        return;
      }
    }

    try {
      console.log("Submitting form data:", formData);
      const updateData = {
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
      };

      // Add role-specific fields
      if (userRole === "courier") {
        updateData.vehicle = formData.vehicle;
      } else if (userRole === "customer") {
        updateData.address = formData.address;
      }

      // Add password fields if changing
      if (formData.newPassword) {
        updateData.current_password = formData.currentPassword;
        updateData.new_password = formData.newPassword;
      }

      console.log("Sending update data:", updateData);
      await apiClient.put("/me/", updateData);
      setSuccess("Профиль успешно обновлен");

      // Refresh user data
      await fetchUserData();

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.error || "Ошибка при обновлении профиля");
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ mt: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Профиль пользователя
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Имя пользователя"
              value={formData.username}
              onChange={(e) => handleChange("username", e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Телефон"
              value={formData.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
              margin="normal"
              required
            />
            {userRole === "courier" && (
              <TextField
                fullWidth
                label="Транспортное средство"
                value={formData.vehicle}
                onChange={(e) => handleChange("vehicle", e.target.value)}
                margin="normal"
                required
              />
            )}
            {userRole === "customer" && (
              <TextField
                fullWidth
                label="Адрес"
                value={formData.address}
                onChange={(e) => handleChange("address", e.target.value)}
                margin="normal"
                required
              />
            )}
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
            Изменение пароля
          </Typography>

          <Box sx={{ mb: 3 }}>
            <TextField
              fullWidth
              label="Текущий пароль"
              type="password"
              value={formData.currentPassword}
              onChange={(e) => handleChange("currentPassword", e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Новый пароль"
              type="password"
              value={formData.newPassword}
              onChange={(e) => handleChange("newPassword", e.target.value)}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Подтвердите новый пароль"
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              margin="normal"
            />
          </Box>

          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
          >
            Сохранить изменения
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Profile;
