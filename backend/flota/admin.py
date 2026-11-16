from django.contrib import admin
from .models import Vehiculo, carga_combustible, Taller, Mantencion


@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ("patente", "marca", "modelo", "tipo_vehiculo", "kilometraje_actual", "vencimiento_prt", "activo")
    list_filter = ("activo", "tipo_vehiculo", "marca")
    search_fields = ("patente", "marca", "modelo")


@admin.register(carga_combustible)
class CargaCombustibleAdmin(admin.ModelAdmin):
    list_display = ("vehiculo", "fecha_carga", "litros_cargados", "costo_total_clp", "kilometraje_al_cargar")
    list_filter = ("fecha_carga", "vehiculo")
    search_fields = ("vehiculo__patente",)


@admin.register(Taller)
class TallerAdmin(admin.ModelAdmin):
    list_display = ("nombre", "especialidad", "direccion", "telefono", "activo")
    list_filter = ("activo", "especialidad")
    search_fields = ("nombre", "especialidad", "direccion")


@admin.register(Mantencion)
class MantencionAdmin(admin.ModelAdmin):
    list_display = (
        "vehiculo",
        "taller",
        "tipo",
        "fecha",
        "kilometraje_realizado",
        "costo_repuestos_clp",
        "costo_mano_obra_clp",
        "costo_total_clp",
    )
    list_filter = ("tipo", "fecha", "taller", "vehiculo")
    search_fields = ("vehiculo__patente", "descripcion", "taller__nombre")