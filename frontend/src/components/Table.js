import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import apiClient from "../utils/apiClient";
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
  MenuItem,
  IconButton,
  Typography,
  Box,
  Stack,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import MapIcon from "@mui/icons-material/Map";

const Table = ({ columns, endpoint, onOrderStatusChange }) => {
  const [data, setData] = useState([]);
  const [open, setOpen] = useState(false);
  const [editRow, setEditRow] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [statuses] = useState([
    { value: "Pending", label: "Ожид." },
    { value: "In Progress", label: "В пути" },
    { value: "Delivered", label: "Готово" },
  ]);
  const navigate = useNavigate();

  const fetchData = useCallback(() => {
    apiClient
      .get(`/${endpoint}/`)
      .then((response) => setData(response.data))
      .catch((error) => console.error("Ошибка при загрузке данных:", error));
  }, [endpoint]);

  // Fetch main data
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fetch customers and couriers only once when component mounts
  useEffect(() => {
    const fetchCustomersAndCouriers = async () => {
      try {
        const [customersResponse, couriersResponse] = await Promise.all([
          apiClient.get("/customers/"),
          apiClient.get("/couriers/"),
        ]);
        setCustomers(customersResponse.data);
        setCouriers(couriersResponse.data);
      } catch (error) {
        console.error("Ошибка при загрузке данных:", error);
      }
    };
    fetchCustomersAndCouriers();
  }, []);

  // Handle edit
  const handleEdit = (row) => {
    // Allow editing for all entities when user is admin
    if (localStorage.getItem("userRole") === "admin") {
      setEditRow({
        ...row,
        customer: row.customer?.id || row.customer || "",
        courier: row.courier?.id || row.courier || "",
      });
      setOpen(true);
      return;
    }

    // For orders, allow editing with specific rules
    if (endpoint === "orders") {
      setEditRow({
        ...row,
        customer: row.customer?.id || row.customer || "",
        courier: row.courier?.id || row.courier || "",
      });
      setOpen(true);
    }
  };

  // Handle change
  const handleChange = (field, value) => {
    setEditRow((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle save
  const handleSave = () => {
    // For orders, if user is a courier, only send status field
    if (
      endpoint === "orders" &&
      localStorage.getItem("userRole") === "courier"
    ) {
      // Get current user email from the API
      apiClient
        .get("/me/")
        .then((response) => {
          const currentUserEmail = response.data.email;
          console.log("Current user email:", currentUserEmail);

          // Get courier data from the couriers list
          const orderCourier = couriers.find((c) => c.id === editRow.courier);
          console.log("Order courier:", orderCourier);

          if (!orderCourier) {
            alert("Заказ не назначен курьеру.");
            return;
          }

          if (orderCourier.email !== currentUserEmail) {
            console.log("Courier email mismatch:", {
              orderCourierEmail: orderCourier.email,
              currentUserEmail: currentUserEmail,
            });
            alert(
              "Вы не можете изменить статус этого заказа, так как он не назначен вам."
            );
            return;
          }

          // Only send the status field
          const courierUpdate = {
            status: editRow.status,
          };

          console.log("Sending update request:", {
            url: `/${endpoint}/${editRow.id}/`,
            data: courierUpdate,
          });

          return apiClient.put(`/${endpoint}/${editRow.id}/`, courierUpdate);
        })
        .then(() => {
          setOpen(false);
          fetchData();
          // If status changed to Delivered, trigger the rating dialog
          if (editRow.status === "Delivered" && onOrderStatusChange) {
            onOrderStatusChange(editRow);
          }
        })
        .catch((error) => {
          console.error("Ошибка при сохранении:", error);
          console.error("Response data:", error.response?.data);
          if (error.response?.status === 403) {
            alert(
              "У вас нет прав для изменения этого заказа. Вы можете изменять только статус заказов, назначенных вам."
            );
          } else if (error.response?.status === 400) {
            alert(
              "Ошибка при обновлении заказа. Пожалуйста, убедитесь, что все обязательные поля заполнены."
            );
          } else {
            alert(
              "Произошла ошибка при сохранении. Пожалуйста, попробуйте снова."
            );
          }
        });
    } else {
      apiClient
        .put(`/${endpoint}/${editRow.id}/`, editRow)
        .then(() => {
          setOpen(false);
          fetchData();
          // If status changed to Delivered, trigger the rating dialog
          if (editRow.status === "Delivered" && onOrderStatusChange) {
            onOrderStatusChange(editRow);
          }
        })
        .catch((error) => {
          console.error("Ошибка при сохранении:", error);
          if (error.response?.status === 403) {
            alert("У вас нет прав для выполнения этого действия.");
          } else if (error.response?.status === 400) {
            alert(
              "Ошибка при обновлении. Пожалуйста, убедитесь, что все обязательные поля заполнены."
            );
          } else {
            alert(
              "Произошла ошибка при сохранении. Пожалуйста, попробуйте снова."
            );
          }
        });
    }
  };

  // Handle delete
  const handleDelete = (id) => {
    if (window.confirm("Вы уверены, что хотите удалить эту запись?")) {
      apiClient
        .delete(`/${endpoint}/${id}/`)
        .then(() => fetchData())
        .catch((error) => console.error("Ошибка при удалении:", error));
    }
  };

  // Handle track
  const handleTrack = (row) => {
    navigate(`/track/${row.id}`, { state: { address: row.address } });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "#fbbf24";
      case "In Progress":
        return "#3b82f6";
      case "Delivered":
        return "#22c55e";
      default:
        return "#64748b";
    }
  };

  const getStatusLabel = (status) => {
    const statusObj = statuses.find((s) => s.value === status);
    return statusObj ? statusObj.label : status;
  };

  const renderEditField = (column, value) => {
    // Don't render edit field for ID
    if (column.dataIndex === "id") {
      return <TextField fullWidth value={value} disabled margin="normal" />;
    }

    // For orders, only allow status editing for couriers (unless admin)
    if (
      endpoint === "orders" &&
      localStorage.getItem("userRole") === "courier" &&
      localStorage.getItem("userRole") !== "admin" &&
      column.dataIndex !== "status"
    ) {
      return <TextField fullWidth value={value} disabled margin="normal" />;
    }

    // For non-orders, disable all editing (except for admin)
    if (endpoint !== "orders" && localStorage.getItem("userRole") !== "admin") {
      return <TextField fullWidth value={value} disabled margin="normal" />;
    }

    // For customers editing their own orders, disable customer and courier fields
    if (
      endpoint === "orders" &&
      localStorage.getItem("userRole") === "customer" &&
      (column.dataIndex === "customer" ||
        column.dataIndex === "customer_name" ||
        column.dataIndex === "courier" ||
        column.dataIndex === "courier_name")
    ) {
      return <TextField fullWidth value={value} disabled margin="normal" />;
    }

    // Handle customer and courier fields
    if (
      column.dataIndex === "customer" ||
      column.dataIndex === "customer_name"
    ) {
      return (
        <TextField
          select
          fullWidth
          value={editRow?.customer || ""}
          onChange={(e) => handleChange("customer", e.target.value)}
          margin="normal"
        >
          <MenuItem value="">Не назначен</MenuItem>
          {customers.map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.name || customer.email}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    if (column.dataIndex === "courier" || column.dataIndex === "courier_name") {
      return (
        <TextField
          select
          fullWidth
          value={editRow?.courier || ""}
          onChange={(e) => handleChange("courier", e.target.value)}
          margin="normal"
        >
          <MenuItem value="">Не назначен</MenuItem>
          {couriers.map((courier) => (
            <MenuItem key={courier.id} value={courier.id}>
              {courier.name || courier.email}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    // Handle status field
    if (column.dataIndex === "status") {
      return (
        <TextField
          select
          fullWidth
          value={value || ""}
          onChange={(e) => handleChange("status", e.target.value)}
          margin="normal"
        >
          {statuses.map((status) => (
            <MenuItem key={status.value} value={status.value}>
              {status.label}
            </MenuItem>
          ))}
        </TextField>
      );
    }

    switch (column.type) {
      case "date":
        return (
          <TextField
            type="datetime-local"
            fullWidth
            value={value ? new Date(value).toISOString().slice(0, 16) : ""}
            onChange={(e) => handleChange(column.dataIndex, e.target.value)}
            margin="normal"
            InputLabelProps={{ shrink: true }}
          />
        );
      case "number":
        return (
          <TextField
            type="number"
            fullWidth
            value={value}
            onChange={(e) => handleChange(column.dataIndex, e.target.value)}
            margin="normal"
          />
        );
      default:
        return (
          <TextField
            fullWidth
            value={value || ""}
            onChange={(e) => handleChange(column.dataIndex, e.target.value)}
            margin="normal"
          />
        );
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <TableContainer
        component={Paper}
        elevation={2}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <MuiTable>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell
                  key={column.key}
                  sx={{
                    bgcolor: "grey.50",
                    borderBottom: 2,
                    borderColor: "grey.200",
                    py: 2,
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      color: "grey.700",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {column.title}
                  </Typography>
                </TableCell>
              ))}
              <TableCell
                sx={{
                  bgcolor: "grey.50",
                  borderBottom: 2,
                  borderColor: "grey.200",
                  py: 2,
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    color: "grey.700",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Действия
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                sx={{
                  "&:hover": { bgcolor: "grey.50" },
                }}
              >
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{
                      py: 2,
                      borderBottom: 1,
                      borderColor: "grey.200",
                      maxWidth: column.dataIndex === "description" ? 180 : 300,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {column.dataIndex === "customer_name"
                      ? row.customer?.name || "Не назначен"
                      : column.dataIndex === "courier_name"
                      ? row.courier?.name || "Не назначен"
                      : column.dataIndex === "status"
                      ? statuses.find((s) => s.value === row.status)?.label ||
                        row.status
                      : column.dataIndex === "description"
                      ? row.description && row.description.length > 30
                        ? row.description.slice(0, 30) + "..."
                        : row.description
                      : row[column.dataIndex]}
                  </TableCell>
                ))}
                <TableCell
                  sx={{
                    py: 1.5,
                    borderBottom: 1,
                    borderColor: "grey.200",
                    width: 120,
                  }}
                >
                  <Stack direction="row" spacing={1}>
                    <IconButton
                      color="primary"
                      onClick={() => handleEdit(row)}
                      size="small"
                      aria-label="Редактировать"
                    >
                      <EditIcon />
                    </IconButton>
                    {localStorage.getItem("userRole") !== "courier" && (
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row.id)}
                        size="small"
                        aria-label="Удалить"
                      >
                        <DeleteIcon />
                      </IconButton>
                    )}
                    {(endpoint === "orders" || endpoint === "customers") && (
                      <IconButton
                        color="info"
                        onClick={() => handleTrack(row)}
                        size="small"
                        aria-label="На карте"
                      >
                        <MapIcon />
                      </IconButton>
                    )}
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </MuiTable>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 2 },
        }}
      >
        <DialogTitle
          sx={{
            fontSize: "1.25rem",
            fontWeight: 600,
            color: "text.primary",
            px: 3,
            py: 2,
          }}
        >
          Редактировать запись
        </DialogTitle>
        <DialogContent>
          {editRow &&
            columns.map((column) => (
              <Box key={column.key} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {column.title}
                </Typography>
                {renderEditField(column, editRow[column.dataIndex])}
              </Box>
            ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            onClick={() => setOpen(false)}
            sx={{
              textTransform: "none",
              color: "grey.700",
            }}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            color="primary"
            sx={{
              textTransform: "none",
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            Сохранить
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Table;
