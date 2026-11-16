from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    LoginView,
    usuario_actual,
    dashboard_kpis,
    VehiculoViewSet,
    TallerViewSet,
    CargaCombustibleViewSet,
    MantencionViewSet,
    ConductorViewSet,
    ViajeViewSet,
)

router = DefaultRouter()
router.register("vehiculos", VehiculoViewSet, basename="vehiculo")
router.register("talleres", TallerViewSet, basename="taller")
router.register("cargas-combustible", CargaCombustibleViewSet, basename="carga-combustible")
router.register("mantenciones", MantencionViewSet, basename="mantencion")
router.register("conductores", ConductorViewSet, basename="conductor")
router.register("viajes", ViajeViewSet, basename="viaje")

urlpatterns = [
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", usuario_actual, name="auth-me"),
    path("dashboard/kpis/", dashboard_kpis, name="dashboard-kpis"),
    path("", include(router.urls)),
]