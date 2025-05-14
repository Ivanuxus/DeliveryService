from ortools.constraint_solver import routing_enums_pb2
from ortools.constraint_solver import pywrapcp
from django.db.models import Q
from .models import Order, Courier
from math import radians, sin, cos, sqrt, atan2
import numpy as np
import requests
import time
import logging
from django.db import transaction
from django.db.models import F
from django.db.models import Count

logger = logging.getLogger(__name__)

def geocode_address(address):
    """Convert address to coordinates using OpenStreetMap Nominatim"""
    try:
        # Add a small delay to respect Nominatim's usage policy
        time.sleep(1)
                    
        # Format the address for the API
        formatted_address = address.replace(' ', '+')
        
        # Make the request to Nominatim
        url = f'https://nominatim.openstreetmap.org/search?q={formatted_address}&format=json&limit=1'
        headers = {'User-Agent': 'DeliveryService/1.0'}
        
        response = requests.get(url, headers=headers)
        data = response.json()
        
        if data and len(data) > 0:
            return float(data[0]['lat']), float(data[0]['lon'])
        return None
    except Exception as e:
        logger.error(f"Error geocoding address {address}: {str(e)}")
        return None

def calculate_distance(lat1, lon1, lat2, lon2):
    R = 6371  # Earth's radius in kilometers

    lat1, lon1, lat2, lon2 = map(radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * atan2(sqrt(a), sqrt(1-a))
    distance = R * c

    return distance

def create_distance_matrix(locations):
    size = len(locations)
    matrix = np.zeros((size, size))
    
    for i in range(size):
        for j in range(size):
            if i != j:
                matrix[i][j] = calculate_distance(
                    locations[i]['lat'], locations[i]['lon'],
                    locations[j]['lat'], locations[j]['lon']
                )
    
    return matrix

def solve_tsp(distance_matrix):
    try:
        # Check matrix size
        size = len(distance_matrix)
        if size <= 1:
            return [0] if size == 1 else None
            
        # Convert distances to integers to avoid floating point issues
        int_matrix = np.array(distance_matrix * 1000, dtype=np.int64)
        
        # Create routing model
        manager = pywrapcp.RoutingIndexManager(size, 1, 0)
        routing = pywrapcp.RoutingModel(manager)

        def distance_callback(from_index, to_index):
            from_node = manager.IndexToNode(from_index)
            to_node = manager.IndexToNode(to_index)
            return int_matrix[from_node][to_node]

        transit_callback_index = routing.RegisterTransitCallback(distance_callback)
        routing.SetArcCostEvaluatorOfAllVehicles(transit_callback_index)

        # Set search parameters
        search_parameters = pywrapcp.DefaultRoutingSearchParameters()
        search_parameters.first_solution_strategy = (
            routing_enums_pb2.FirstSolutionStrategy.PATH_CHEAPEST_ARC)
        search_parameters.time_limit.FromSeconds(30)  # Add time limit

        # Solve the problem
        solution = routing.SolveWithParameters(search_parameters)
        
        if solution:
            index = routing.Start(0)
            route = []
            while not routing.IsEnd(index):
                route.append(manager.IndexToNode(index))
                index = solution.Value(routing.NextVar(index))
            route.append(manager.IndexToNode(index))
            return route
        return None
    except Exception as e:
        logger.error(f"Error in solve_tsp: {str(e)}")
        return None

def distribute_orders():
    try:
        # Get all available couriers (those with less than 5 active orders)
        available_couriers = Courier.objects.annotate(
            active_orders_count=Count(
                'orders',
                filter=Q(orders__status='In Progress')
            )
        ).filter(active_orders_count__lt=5)

        if not available_couriers.exists():
            logger.info("No available couriers found")
            return

        # Get all unassigned orders
        unassigned_orders = Order.objects.filter(courier__isnull=True)
        if not unassigned_orders.exists():
            logger.info("No unassigned orders found")
            return

        # Group couriers by vehicle type
        couriers_by_vehicle = {
            'Автомобиль': [],
            'Мотоцикл': [],
            'Велосипед': []
        }
        
        for courier in available_couriers:
            couriers_by_vehicle[courier.vehicle].append(courier)

        # Process orders for each vehicle type
        for vehicle_type, couriers in couriers_by_vehicle.items():
            if not couriers:
                continue

            # Get orders for this vehicle type
            vehicle_orders = list(unassigned_orders)
            
            # For each courier of this type
            for courier in couriers:
                if not vehicle_orders:
                    break

                # Get current orders for this courier
                current_orders = list(Order.objects.filter(
                    courier=courier,
                    status='In Progress'
                ))

                # Calculate remaining capacity
                remaining_capacity = 5 - len(current_orders)
                if remaining_capacity <= 0:
                    continue

                # Get locations for current orders and courier
                locations = []
                
                # Add courier's current location as the starting point
                if courier.current_location_lat is not None and courier.current_location_lon is not None:
                    locations.append({
                        'order_id': 'courier_start',
                        'lat': float(courier.current_location_lat),
                        'lon': float(courier.current_location_lon)
                    })
                    logger.info(f"Added courier {courier.id} current location to locations")

                # Add current orders to locations
                for order in current_orders:
                    coords = geocode_address(order.address)
                    if coords:
                        lat, lon = coords
                        locations.append({
                            'order_id': order.id,
                            'lat': lat,
                            'lon': lon
                        })
                        logger.info(f"Added current order {order.id} to locations")

                # Add new orders if courier has capacity
                new_orders = vehicle_orders[:remaining_capacity]
                
                for order in new_orders:
                    coords = geocode_address(order.address)
                    if coords:
                        lat, lon = coords
                        locations.append({
                            'order_id': order.id,
                            'lat': lat,
                            'lon': lon
                        })
                        logger.info(f"Added new order {order.id} to locations")

                if len(locations) > 1:  # Need at least 2 locations for TSP
                    try:
                        distance_matrix = create_distance_matrix(locations)
                        route = solve_tsp(distance_matrix)
                        
                        if route:
                            # Assign new orders to courier
                            for i in route:
                                # Skip the first location if it's the courier's current location
                                if i == 0 and locations[0]['order_id'] == 'courier_start':
                                    continue
                                    
                                # Calculate the index for new orders
                                new_order_index = i - (1 if locations[0]['order_id'] == 'courier_start' else 0) - len(current_orders)
                                
                                # Only process if this is a new order
                                if new_order_index >= 0 and new_order_index < len(new_orders):
                                    order = new_orders[new_order_index]
                                    # Use transaction to ensure atomic update
                                    with transaction.atomic():
                                        # Try to update the order only if it's still unassigned
                                        updated = Order.objects.filter(
                                            id=order.id,
                                            courier__isnull=True
                                        ).update(
                                            courier=courier,
                                            status='In Progress'
                                        )
                                        if updated:
                                            logger.info(f"Assigned order {order.id} to courier {courier.id}")
                                            # Remove the assigned order from vehicle_orders
                                            vehicle_orders.remove(order)
                                        else:
                                            logger.warning(f"Order {order.id} was already assigned to another courier")
                    except Exception as e:
                        logger.error(f"Error solving TSP for courier {courier.id}: {str(e)}")
                        continue

        return {"message": "Заказы успешно распределены"}
    except Exception as e:
        logger.error(f"Error in distribute_orders: {str(e)}")
        return {"message": f"Ошибка при распределении заказов: {str(e)}"}