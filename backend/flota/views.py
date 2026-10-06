from rest_framework import viewsets
from .models import Vehiculo
from .serializers import VehiculoSerializer

class VehiculoViewSet(viewsets.ModelViewSet):
    """CRUD completo de Vehículo: listar, crear, ver, editar y eliminar."""
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer