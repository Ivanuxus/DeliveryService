import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Typography, Container, Button, Box } from '@mui/material';

const TrackOrder = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { address } = location.state || { address: 'Адрес не найден' };

    useEffect(() => {
        // Инициализация карты
        window.ymaps.ready(() => {
            const map = new window.ymaps.Map('map', {
                center: [55.76, 37.64], // Центр карты (Москва)
                zoom: 10,
            });

            // Геокодирование адреса и добавление метки
            window.ymaps.geocode(address).then((res) => {
                const geoObject = res.geoObjects.get(0);
                if (geoObject) {
                    const coordinates = geoObject.geometry.getCoordinates();
                    const placemark = new window.ymaps.Placemark(coordinates, {
                        balloonContent: `Адрес: ${address}`,
                    });
                    map.geoObjects.add(placemark);
                    map.setCenter(coordinates, 14);
                }
            });
        });
    }, [address]);

    return (
        <Container>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <Typography variant="h4">Отслеживание заказа</Typography>
                <Button variant="contained" color="primary" onClick={() => navigate(-1)}>
                    Назад
                </Button>
            </Box>
            <Typography variant="subtitle1" gutterBottom>
                Адрес доставки: {address}
            </Typography>
            <div id="map" style={{ width: '100%', height: '500px', marginTop: 20, borderRadius: 8, overflow: 'hidden' }}></div>
        </Container>
    );
};

export default TrackOrder;