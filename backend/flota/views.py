from rest_framework import viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import Vehiculo, carga_combustible, Taller, Mantencion, Conductor, Viaje
from .serializers import (
    LoginConRolSerializer,
    VehiculoSerializer,
    CargaCombustibleSerializer,
    TallerSerializer,
    MantencionSerializer,
    ConductorSerializer,
    ViajeSerializer,
)

from .permissions import EsAdminOSoloLectura


class LoginView(TokenObtainPairView):
    """Endpoint público para validar credenciales y emitir JWT + rol."""
    permission_classes = [AllowAny]
    serializer_class = LoginConRolSerializer


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def usuario_actual(request):
    """Retorna la información y rol del usuario autenticado."""
    user = request.user
    return Response({
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "rol": "ADMIN" if user.is_staff else "OPERADOR",
        "es_admin": bool(user.is_staff),
    })


class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer
    permission_classes = [EsAdminOSoloLectura]


class TallerViewSet(viewsets.ModelViewSet):
    queryset = Taller.objects.all()
    serializer_class = TallerSerializer
    permission_classes = [EsAdminOSoloLectura]


class CargaCombustibleViewSet(viewsets.ModelViewSet):
    queryset = carga_combustible.objects.all()
    serializer_class = CargaCombustibleSerializer
    permission_classes = [IsAuthenticated]


class MantencionViewSet(viewsets.ModelViewSet):
    queryset = Mantencion.objects.all()
    serializer_class = MantencionSerializer
    permission_classes = [IsAuthenticated]

class ConductorViewSet(viewsets.ModelViewSet):
    queryset = Conductor.objects.all()
    serializer_class = ConductorSerializer
    permission_classes = [EsAdminOSoloLectura]


class ViajeViewSet(viewsets.ModelViewSet):
    queryset = Viaje.objects.all()
    serializer_class = ViajeSerializer
    permission_classes = [IsAuthenticated]