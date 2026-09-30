from django.contrib import admin
from .models import Vehiculo

@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ("patente", "marca", "modelo", "kilometraje_actual", "activo", "creado_en") #
    list_filter = ("activo", "marca") #
    search_fields = ("patente", "marca", "modelo") #