import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Rating,
  Typography,
  Box,
} from "@mui/material";
import apiClient from "../utils/apiClient";

const RatingDialog = ({ open, onClose, order, onRatingSubmitted }) => {
  const [rating, setRating] = useState(0);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [courierData, setCourierData] = useState(null);

  useEffect(() => {
    // Fetch current user data when component mounts
    apiClient.get("/me/").then((response) => {
      setCurrentUser(response.data);
    });

    // Fetch courier data if we have an order
    if (order?.courier) {
      apiClient
        .get(`/couriers/${order.courier}/`)
        .then((response) => {
          setCourierData(response.data);
        })
        .catch((err) => {
          console.error("Error fetching courier data:", err);
        });
    }
  }, [order]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError("Пожалуйста, выберите оценку");
      return;
    }

    if (!order?.courier) {
      setError("Не удалось определить курьера");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get customer data for the current user
      const customerResponse = await apiClient.get("/customers/");
      const customer = customerResponse.data.find(
        (c) => c.email === currentUser.email
      );

      if (!customer) {
        throw new Error("Не удалось найти данные клиента");
      }

      await apiClient.post("/courier-ratings/", {
        courier: order.courier,
        customer: customer.id,
        order: order.id,
        rating: rating,
      });
      onRatingSubmitted();
      onClose();
    } catch (err) {
      console.error("Rating submission error:", err);
      setError(
        err.response?.data?.detail ||
          err.message ||
          "Произошла ошибка при отправке оценки"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Оцените курьера</DialogTitle>
      <DialogContent>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            py: 2,
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Как вы оцениваете работу курьера {courierData?.name || "..."}?
          </Typography>
          <Rating
            value={rating}
            onChange={(event, newValue) => {
              setRating(newValue);
              setError(null);
            }}
            size="large"
            sx={{ my: 2 }}
          />
          {error && (
            <Typography color="error" variant="body2" sx={{ mt: 1 }}>
              {error}
            </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Отмена
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Отправка..." : "Отправить оценку"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RatingDialog;
