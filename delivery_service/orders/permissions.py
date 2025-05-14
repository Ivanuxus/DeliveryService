from rest_framework.permissions import BasePermission
import logging

logger = logging.getLogger(__name__)

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

class IsCourier(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'courier'

class IsCustomer(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'customer'

class CanUpdateOrderStatus(BasePermission):
    def has_permission(self, request, view):
        # First check if user is authenticated and is a courier
        if not (request.user.is_authenticated and request.user.role == 'courier'):
            logger.debug("User is not authenticated or not a courier")
            return False
        return True

    def has_object_permission(self, request, view, obj):
        logger.debug(f"Checking object permission for user {request.user.email}")
        logger.debug(f"Order courier email: {obj.courier.email if obj.courier else 'None'}")
        logger.debug(f"Request data: {request.data}")
        logger.debug(f"Request method: {request.method}")
        
        # Check if the courier is assigned to this order
        if not obj.courier:
            logger.debug("Order has no courier assigned")
            return False
            
        if obj.courier.email != request.user.email:
            logger.debug(f"Courier email mismatch: {obj.courier.email} != {request.user.email}")
            return False
        
        # Check if only status field is being updated
        if request.method in ['PUT', 'PATCH']:
            allowed_fields = {'status'}
            request_fields = set(request.data.keys())
            logger.debug(f"Request fields: {request_fields}")
            logger.debug(f"Allowed fields: {allowed_fields}")
            
            if not request_fields.issubset(allowed_fields):
                logger.debug(f"Request contains fields other than status: {request_fields - allowed_fields}")
                return False
            
            # Validate status value
            valid_statuses = ['Pending', 'In Progress', 'Delivered']
            if 'status' in request.data and request.data['status'] not in valid_statuses:
                logger.debug(f"Invalid status value: {request.data.get('status')}")
                return False
            
            logger.debug("Permission granted for status update")
            return True
        
        logger.debug("Method not allowed")
        return False