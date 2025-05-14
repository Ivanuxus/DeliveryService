import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  TextField,
  Button,
  Container,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import apiClient from "../utils/apiClient";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
    setError(""); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestData = {
      email: formData.email,
      password: formData.password,
    };
    console.log("Attempting login with:", requestData);

    try {
      // Clear any existing tokens
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      const response = await apiClient.post("login/", requestData);
      console.log("Login response:", response.data);

      const { access, refresh, user } = response.data;

      // Store tokens and user info
      localStorage.setItem("accessToken", access);
      localStorage.setItem("refreshToken", refresh);
      localStorage.setItem("userRole", user.role);

      // Navigate based on role
      navigate("/");
      window.location.reload(); // Reload to update navbar
    } catch (err) {
      console.error("Login error details:", {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        requestData: requestData,
      });
      const errorMessage =
        err.response?.data?.error || "Неверный email или пароль";
      setError(errorMessage);
    }
  };

  return (
    <Container>
      <Box
        sx={{
          maxWidth: 400,
          margin: "auto",
          mt: 4,
          p: 3,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: "background.paper",
        }}
      >
        <Typography variant="h4" gutterBottom align="center">
          Вход в систему
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={formData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            error={!!error}
            required
            autoComplete="email"
          />
          <TextField
            label="Пароль"
            type="password"
            fullWidth
            margin="normal"
            value={formData.password}
            onChange={(e) => handleChange("password", e.target.value)}
            error={!!error}
            required
            autoComplete="current-password"
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
          >
            Войти
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default Login;
