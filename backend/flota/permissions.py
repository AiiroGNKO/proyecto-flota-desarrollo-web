from rest_framework import permissions


class EsAdminOSoloLectura(permissions.BasePermission):
    """
    Permite lectura (GET, HEAD, OPTIONS) a cualquier usuario autenticado,
    pero restringe escritura/eliminación (POST, PUT, PATCH, DELETE) solo a administradores (is_staff).
    """

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user.is_staff)