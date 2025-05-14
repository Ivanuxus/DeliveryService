import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  People as PeopleIcon,
  LocalShipping as DeliveryIcon,
  CurrencyRuble as MoneyIcon,
  CheckCircle as CompletedIcon,
} from "@mui/icons-material";
import apiClient from "../utils/apiClient";

const StatCard = ({ title, value, icon, color }) => (
  <Card sx={{ height: "100%", bgcolor: color }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h6" color="text.secondary">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ mt: 1 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color: "text.secondary" }}>{icon}</Box>
      </Box>
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalCouriers: 0,
    totalOrders: 0,
    completedOrders: 0,
    totalEarnings: 0,
    loading: true,
  });

  const fetchStats = async () => {
    try {
      const [customersRes, couriersRes, ordersRes] = await Promise.all([
        apiClient.get("/customers/"),
        apiClient.get("/couriers/"),
        apiClient.get("/orders/"),
      ]);

      const customers = customersRes.data;
      const couriers = couriersRes.data;
      const orders = ordersRes.data;

      const completedOrders = orders.filter(
        (order) => order.status === "Delivered"
      );
      const totalEarnings = completedOrders.length * 10;

      setStats({
        totalCustomers: customers.length,
        totalCouriers: couriers.length,
        totalOrders: orders.length,
        completedOrders: completedOrders.length,
        totalEarnings: `${totalEarnings} ₽`,
        loading: false,
      });
    } catch (error) {
      console.error("Ошибка при получении статистики:", error);
      setStats((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (stats.loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Обзор системы
      </Typography>
      <Box sx={{ flexGrow: 1, p: 2 }}></Box>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Всего клиентов"
            value={stats.totalCustomers}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="#e3f2fd"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Активные курьеры"
            value={stats.totalCouriers}
            icon={<DeliveryIcon sx={{ fontSize: 40 }} />}
            color="#f3e5f5"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Всего заказов"
            value={stats.totalOrders}
            icon={<CompletedIcon sx={{ fontSize: 40 }} />}
            color="#e8f5e9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Выполненные доставки"
            value={stats.completedOrders}
            icon={<CompletedIcon sx={{ fontSize: 40 }} />}
            color="#fff3e0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={6}>
          <StatCard
            title="Общая выручка"
            value={stats.totalEarnings}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="#fce4ec"
          />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
