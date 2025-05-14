import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Typography,
  Container,
  Button,
  Box,
  Paper,
  Skeleton,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import MapIcon from "@mui/icons-material/Map";
import apiClient from "../utils/apiClient";

const TrackOrder = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [address, setAddress] = useState(
    location.state?.address || "Загрузка..."
  );
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // If address is not provided in location.state, fetch it from the API
    if (!location.state?.address) {
      apiClient
        .get(`/orders/${id}/`)
        .then((response) => {
          setAddress(response.data.address);
        })
        .catch((error) => {
          console.error("Error fetching order:", error);
          setError("Не удалось загрузить адрес заказа");
          setAddress("Адрес не найден");
        });
    }
  }, [id, location.state]);

  useEffect(() => {
    if (address === "Загрузка..." || address === "Адрес не найден") {
      return;
    }

    setIsMapLoading(true);
    window.ymaps.ready(() => {
      const map = new window.ymaps.Map("map", {
        center: [55.76, 37.64],
        zoom: 10,
        controls: ["zoomControl", "fullscreenControl"],
      });

      window.ymaps
        .geocode(address)
        .then((res) => {
          const geoObject = res.geoObjects.get(0);
          if (geoObject) {
            const coordinates = geoObject.geometry.getCoordinates();
            const placemark = new window.ymaps.Placemark(
              coordinates,
              {
                balloonContent: `Адрес: ${address}`,
              },
              {
                preset: "islands#blueDeliveryIcon",
                iconColor: "#2563eb",
              }
            );
            map.geoObjects.add(placemark);
            map.setCenter(coordinates, 15);

            // Add a smooth zoom animation
            map.behaviors.disable("scrollZoom");
            setTimeout(() => {
              map.setZoom(16, { duration: 1000 });
            }, 100);
          } else {
            setError("Не удалось найти адрес на карте");
          }
          setIsMapLoading(false);
        })
        .catch((error) => {
          console.error("Error geocoding address:", error);
          setError("Ошибка при поиске адреса на карте");
          setIsMapLoading(false);
        });
    });
  }, [address]);

  return (
    <Container maxWidth="lg" sx={styles.container}>
      <Paper elevation={0} sx={styles.paper}>
        <Box sx={styles.header}>
          <Box sx={styles.titleSection}>
            <IconButton onClick={() => navigate(-1)} sx={styles.backButton}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" sx={styles.title}>
              Отслеживание заказа
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<MapIcon />}
            sx={styles.viewButton}
            onClick={() => {
              const mapElement = document.getElementById("map");
              mapElement?.scrollIntoView({ behavior: "smooth" });
            }}
          >
            Показать на карте
          </Button>
        </Box>

        <Box sx={styles.addressCard}>
          <LocationOnIcon sx={styles.locationIcon} />
          <Box>
            <Typography variant="overline" sx={styles.addressLabel}>
              Адрес доставки
            </Typography>
            <Typography variant="body1" sx={styles.addressText}>
              {address}
            </Typography>
            {error && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </Box>

        <Box sx={styles.mapContainer}>
          {isMapLoading && (
            <Skeleton
              variant="rectangular"
              width="100%"
              height={500}
              sx={styles.mapSkeleton}
            />
          )}
          <div
            id="map"
            style={{
              ...styles.map,
              display: isMapLoading ? "none" : "block",
            }}
          />
        </Box>
      </Paper>
    </Container>
  );
};

const styles = {
  container: {
    py: 4,
  },
  paper: {
    borderRadius: 3,
    overflow: "hidden",
    bgcolor: "#ffffff",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    px: 3,
    py: 2,
    borderBottom: "1px solid #e2e8f0",
  },
  titleSection: {
    display: "flex",
    alignItems: "center",
    gap: 2,
  },
  backButton: {
    color: "#64748b",
    "&:hover": {
      backgroundColor: "#f1f5f9",
    },
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: 600,
    color: "#1e293b",
  },
  viewButton: {
    textTransform: "none",
    bgcolor: "#2563eb",
    "&:hover": {
      bgcolor: "#1d4ed8",
    },
    borderRadius: 2,
    px: 3,
  },
  addressCard: {
    display: "flex",
    alignItems: "flex-start",
    gap: 2,
    p: 3,
    bgcolor: "#f8fafc",
    mx: 3,
    my: 3,
    borderRadius: 2,
    border: "1px solid #e2e8f0",
  },
  locationIcon: {
    color: "#2563eb",
    fontSize: 24,
    mt: 0.5,
  },
  addressLabel: {
    color: "#64748b",
    fontWeight: 500,
    letterSpacing: "0.1em",
    lineHeight: 1,
    display: "block",
    mb: 0.5,
  },
  addressText: {
    color: "#1e293b",
    fontWeight: 500,
    fontSize: "1rem",
  },
  mapContainer: {
    position: "relative",
    mx: 3,
    mb: 3,
    borderRadius: 2,
    overflow: "hidden",
    border: "1px solid #e2e8f0",
  },
  mapSkeleton: {
    bgcolor: "#f1f5f9",
    borderRadius: 2,
  },
  map: {
    width: "100%",
    height: 500,
  },
};

export default TrackOrder;
