# from django.shortcuts import redirect
# from django.urls import reverse

# class RoleBasedAccessMiddleware:
#     def __init__(self, get_response):
#         self.get_response = get_response

#     def __call__(self, request):
#         # Исключения для определенных URL (регистрация и вход)
#         if request.path.startswith(reverse('register')) or request.path.startswith(reverse('login')):
#             return self.get_response(request)

#         if request.user.is_authenticated:
#             if request.user.role == 'courier' and request.path not in ['/orders/']:
#                 return redirect('/orders/')
#             elif request.user.role == 'customer' and request.path not in ['/orders/']:
#                 return redirect('/orders/')
#         return self.get_response(request)