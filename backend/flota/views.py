from django.db.models import Sum
from django.db.models.functions import TruncMonth
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

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    """Calcula los KPIs globales, gasto mensual de combustible y ranking de eficiencia."""
    # 1. Gasto mensual de combustible
    cargas_mensuales = (
        carga_combustible.objects.annotate(mes=TruncMonth("fecha_carga"))
        .values("mes")
        .annotate(
            total_clp=Sum("costo_total_clp"),
            total_litros=Sum("litros_cargados"),
        )
        .order_by("mes")
    )

    gasto_mensual = [
        {
            "mes": item["mes"].strftime("%Y-%m") if item["mes"] else "Sin fecha",
            "total_clp": float(item["total_clp"] or 0),
            "total_litros": float(item["total_litros"] or 0),
        }
        for item in cargas_mensuales
    ]

    # 2. Ranking de eficiencia (km/L) y kilómetros recorridos por vehículo
    ranking_eficiencia = []
    km_recorridos_cargas = 0

    for vehiculo in Vehiculo.objects.all():
        cargas = list(
            carga_combustible.objects.filter(vehiculo=vehiculo).order_by("fecha_carga", "id")
        )
        rendimientos = []
        km_vehiculo = 0

        for i in range(1, len(cargas)):
            distancia = cargas[i].kilometraje_al_cargar - cargas[i - 1].kilometraje_al_cargar
            litros = float(cargas[i].litros_cargados)
            if distancia > 0 and litros > 0:
                rendimientos.append(distancia / litros)
                km_vehiculo += distancia

        km_recorridos_cargas += km_vehiculo

        if rendimientos:
            promedio_kml = round(sum(rendimientos) / len(rendimientos), 2)
            ranking_eficiencia.append({
                "id": vehiculo.id,
                "patente": vehiculo.patente,
                "vehiculo": f"{vehiculo.marca} {vehiculo.modelo}",
                "tipo": vehiculo.tipo_vehiculo,
                "rendimiento_promedio_kml": promedio_kml,
                "tramos_medidos": len(rendimientos),
            })

    ranking_eficiencia.sort(key=lambda x: x["rendimiento_promedio_kml"], reverse=True)

    # 3. Indicador global de costo operativo ($CLP / km)
    total_gasto_combustible = float(
        carga_combustible.objects.aggregate(total=Sum("costo_total_clp"))["total"] or 0
    )
    total_gasto_mantencion = float(
        Mantencion.objects.aggregate(total=Sum("costo_total_clp"))["total"] or 0
    )
    gasto_operativo_total = total_gasto_combustible + total_gasto_mantencion

    # Distancia total recorrida (usa viajes registrados o tramos entre cargas de combustible)
    km_viajes = sum(
        max(0, v.kilometraje_final - v.kilometraje_inicial) for v in Viaje.objects.all()
    )
    km_totales_operacion = max(km_viajes, km_recorridos_cargas)

    costo_por_km_clp = (
        round(gasto_operativo_total / km_totales_operacion, 1)
        if km_totales_operacion > 0
        else 0
    )

    return Response({
        "resumen": {
            "total_vehiculos": Vehiculo.objects.filter(activo=True).count(),
            "gasto_combustible_clp": total_gasto_combustible,
            "gasto_mantencion_clp": total_gasto_mantencion,
            "gasto_operativo_total_clp": gasto_operativo_total,
            "km_totales_operacion": km_totales_operacion,
            "costo_por_km_clp": costo_por_km_clp,
        },
        "gasto_mensual": gasto_mensual,
        "ranking_eficiencia": ranking_eficiencia,
    })