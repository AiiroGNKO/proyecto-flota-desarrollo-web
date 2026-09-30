from django.db import models

class Vehiculo(models.Model):
    """Modelo que representa un vehículo de la flota de transporte."""
    patente = models.CharField(max_length=10, unique=True) # Texto corto
    marca = models.CharField(max_length=50) # Texto corto
    modelo = models.CharField(max_length=50) # Texto corto
    capacidad_estanque_litros = models.DecimalField(max_digits=5, decimal_places=2) # Número decimal
    kilometraje_actual = models.IntegerField(default=0) # Número entero
    activo = models.BooleanField(default=True) # Booleano
    creado_en = models.DateTimeField(auto_now_add=True) # Fecha y hora

    class Meta:
        ordering = ["patente"] # Orden por defecto por patente
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"

    def __str__(self):
        return f"{self.patente} - {self.marca} {self.modelo}" #