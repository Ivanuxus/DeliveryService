import React from "react";
import { Box, Typography, Container, Paper } from "@mui/material";

const Home = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper elevation={3} sx={{ p: 4, backgroundColor: "#ffffff" }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary">
            Welcome to the Delivery Management System
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: "text.secondary", lineHeight: 1.7 }}
          >
            This comprehensive platform provides efficient tools for order
            management, courier coordination, and customer service.
            Administrators can manage orders, couriers, and customer data with
            ease, while couriers have secure access to their assigned delivery
            information.
          </Typography>
          <Typography
            variant="body1"
            paragraph
            sx={{ color: "text.secondary", lineHeight: 1.7 }}
          >
            The system ensures real-time updates and seamless communication
            across all delivery operations, making it an essential tool for
            modern delivery management.
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Home;
