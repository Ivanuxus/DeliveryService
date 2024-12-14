import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';

const MapPage = () => {
    const orders = [
        { id: 1, position: [51.505, -0.09], address: 'Address 1' },
        { id: 2, position: [51.51, -0.1], address: 'Address 2' },
    ];

    return (
        <MapContainer center={[51.505, -0.09]} zoom={13} style={{ height: '500px', width: '100%' }}>
            <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution="&copy; OpenStreetMap contributors"
            />
            {orders.map(order => (
                <Marker key={order.id} position={order.position}>
                    <Popup>{order.address}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapPage;