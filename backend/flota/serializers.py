from rest_framework import serializers
from .models import Vehiculo

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = [
            "id",
            "patente",
            "marca",
            "modelo",
            "capacidad_estanque_litros",
            "kilometraje_actual",
            "activo",
            "creado_en",
        ]
        read_only_fields = ["id", "creado_en"]

    # Validación a medida del servidor
    def validate_capacidad_estanque_litros(self, value):
        if value <= 0:
            raise serializers.ValidationError("La capacidad del estanque debe ser mayor que 0.")
        return value

    def validate_kilometraje_actual(self, value):
        if value < 0:
            raise serializers.ValidationError("El kilometraje no puede ser negativo.")
        return value