import React from "react";
import { Button } from "@mui/material";
import apiClient from "../utils/apiClient";

const DistributeOrdersButton = () => {
  const handleDistribute = async () => {
    try {
      const response = await apiClient.post("distribute-orders/");
      alert(response.data.message);
    } catch (error) {
      console.error("Error distributing orders:", error);
      alert("Ошибка при распределении заказов");
    }
  };

  return (
    <Button
      variant="contained"
      color="secondary"
      onClick={handleDistribute}
      sx={{ ml: 2 }}
    >
      Распределить заказы
    </Button>
  );
};

export default DistributeOrdersButton;
