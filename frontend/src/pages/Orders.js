import React, { useState, useEffect } from "react";
import Table from "../components/Table";
import apiClient from "../utils/apiClient"; // Путь зависит от расположения apiClient
import DistributeOrdersButton from "../components/DistributeOrdersButton";
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
} from "@mui/material";
import RatingDialog from "../components/RatingDialog";

const statuses = [
  { value: "Pending", label: "Ожидает обработки" },
  { value: "In Progress", label: "В процессе доставки" },
  { value: "Delivered", label: "Доставлен" },
];

const columns = [
  { title: "ID", dataIndex: "id", key: "id" },
  { title: "Клиент", dataIndex: "customer_name", key: "customer_name" },
  { title: "Курьер", dataIndex: "courier_name", key: "courier_name" },
  { title: "Статус", dataIndex: "status", key: "status" },
  { title: "Адрес доставки", dataIndex: "address", key: "address" },
  { title: "Описание заказа", dataIndex: "description", key: "description" },
];

const Orders = () => {
  const [open, setOpen] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [formData, setFormData] = useState({
    customer: "",
    courier: "",
    address: "",
    description: "",
    status: "Pending", // Default status
  });
  const userRole = localStorage.getItem("userRole");
  const [currentUser, setCurrentUser] = useState(null);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    // Fetch current user data
    apiClient.get("/me/").then((res) => {
      setCurrentUser(res.data);
      // If user is a customer, pre-fill their ID
      if (res.data.role === "customer") {
        // Get customer ID from the customers list
        apiClient.get("/customers/").then((customersRes) => {
          const customer = customersRes.data.find(
            (c) => c.email === res.data.email
          );
          if (customer) {
            setFormData((prev) => ({
              ...prev,
              customer: customer.id,
            }));
          }
        });
      }
    });

    apiClient.get("/customers/").then((res) => setCustomers(res.data));
    apiClient.get("/couriers/").then((res) => setCouriers(res.data));
  }, []);

  // Handle form input changes
  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  // Handle form submission
  const handleSubmit = () => {
    // For customers, ensure we're using their correct customer ID
    if (userRole === "customer" && currentUser) {
      apiClient.get("/customers/").then((customersRes) => {
        const customer = customersRes.data.find(
          (c) => c.email === currentUser.email
        );
        if (customer) {
          const orderData = {
            ...formData,
            customer: customer.id,
          };
          createOrder(orderData);
        }
      });
    } else {
      createOrder(formData);
    }
  };

  const createOrder = (orderData) => {
    apiClient
      .post("/orders/", orderData)
      .then(() => {
        setOpen(false);
        setFormData({
          customer: currentUser?.role === "customer" ? currentUser.id : "",
          courier: "",
          address: "",
          description: "",
          status: "Pending",
        });
        window.location.reload(); // Reload the page to fetch updated orders
      })
      .catch((err) => {
        console.error("Ошибка при создании заказа:", err);
        alert(
          "Ошибка при создании заказа. Пожалуйста, проверьте все поля и попробуйте снова."
        );
      });
  };

  const handleOrderStatusChange = (order) => {
    if (
      order.status === "Delivered" &&
      localStorage.getItem("userRole") === "customer"
    ) {
      // Check if order has already been rated
      apiClient.get(`/courier-ratings/`).then((response) => {
        const hasRating = response.data.some(
          (rating) => rating.order === order.id
        );
        if (!hasRating) {
          setSelectedOrder(order);
          setRatingDialogOpen(true);
        }
      });
    }
  };

  const handleRatingSubmitted = () => {
    // Refresh the orders list
    window.location.reload();
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
          Заказы
        </Typography>
        <Box>
          {userRole !== "courier" && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Создать заказ
            </Button>
          )}
        </Box>
      </Box>
      <Table
        columns={columns}
        endpoint="orders"
        onOrderStatusChange={handleOrderStatusChange}
      />

      <RatingDialog
        open={ratingDialogOpen}
        onClose={() => {
          setRatingDialogOpen(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        onRatingSubmitted={handleRatingSubmitted}
      />

      {/* Диалоговое окно добавления заказа */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Создание нового заказа</DialogTitle>
        <DialogContent>
          {userRole !== "customer" && (
            <TextField
              select
              label="Клиент"
              fullWidth
              margin="normal"
              value={formData.customer}
              onChange={(e) => handleChange("customer", e.target.value)}
              required
            >
              {customers.map((customer) => (
                <MenuItem key={customer.id} value={customer.id}>
                  {customer.name}
                </MenuItem>
              ))}
            </TextField>
          )}
          <TextField
            label="Адрес доставки"
            fullWidth
            margin="normal"
            value={formData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            required
          />
          <TextField
            label="Описание заказа"
            fullWidth
            margin="normal"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            multiline
            rows={4}
            placeholder="Опишите содержимое заказа"
          />
          <TextField
            select
            label="Статус заказа"
            fullWidth
            margin="normal"
            value={formData.status}
            onChange={(e) => handleChange("status", e.target.value)}
            required
          >
            {statuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
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
