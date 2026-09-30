from django.shortcuts import render
from django.http import JsonResponse
from .models import Vehiculo

def vehiculo_list(request):
    """Devuelve en JSON la lista de vehículos activos de la flota."""
    vehiculos = list(
        Vehiculo.objects.filter(activo=True).values(
            "id", "patente", "marca", "modelo", "capacidad_estanque_litros", "kilometraje_actual"
        )
    )
    return JsonResponse({"count": len(vehiculos), "results": vehiculos}) #