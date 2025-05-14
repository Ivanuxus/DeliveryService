import React, { useState, useEffect } from "react";
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Rating,
  CircularProgress,
} from "@mui/material";
import apiClient from "../utils/apiClient";
import Dashboard from "../components/Dashboard";

const Home = () => {
  const [topCouriers, setTopCouriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTopCouriers = async () => {
      try {
        const response = await apiClient.get("/courier-ratings/top_rated/");
        setTopCouriers(response.data);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching top couriers:", err);
        setError("Не удалось загрузить список лучших курьеров");
        setLoading(false);
      }
    };

    fetchTopCouriers();
  }, []);

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Dashboard />
      </Box>

      <Box sx={{ flexGrow: 1, p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Лучшие курьеры
        </Typography>
        {loading ? (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            minHeight="200px"
          >
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" variant="h6" align="center">
            {error}
          </Typography>
        ) : (
          <Grid container spacing={3}>
            {topCouriers.map((courier) => (
              <Grid item xs={12} sm={6} md={4} key={courier.id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {courier.name}
                    </Typography>
                    <Box display="flex" alignItems="center" mb={1}>
                      <Rating
                        value={courier.average_rating}
                        readOnly
                        precision={0.5}
                      />
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1 }}
                      >
                        ({courier.average_rating.toFixed(1)})
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      Телефон: {courier.phone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Транспорт: {courier.vehicle}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
            {topCouriers.length === 0 && (
              <Grid item xs={12}>
                <Typography
                  variant="body1"
                  align="center"
                  color="text.secondary"
                >
                  Пока нет оцененных курьеров
                </Typography>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default Home;
