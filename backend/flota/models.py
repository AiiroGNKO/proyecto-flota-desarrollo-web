from django.db import models


class Vehiculo(models.Model):
    """Modelo que representa un vehículo de la flota y su estado documental."""
    TIPO_CHOICES = [
        ("CARGA", "Transporte de Carga"),
        ("LIVIANO", "Vehículo Liviano / Utilitario"),
        ("PASAJEROS", "Transporte de Pasajeros"),
    ]

    patente = models.CharField(max_length=10, unique=True)
    marca = models.CharField(max_length=50)
    modelo = models.CharField(max_length=50)
    tipo_vehiculo = models.CharField(max_length=15, choices=TIPO_CHOICES, default="CARGA")
    capacidad_estanque_litros = models.DecimalField(max_digits=5, decimal_places=2)
    kilometraje_actual = models.IntegerField(default=0)

    # Documentación vehicular (Chile)
    vencimiento_prt = models.DateField(null=True, blank=True, verbose_name="Vencimiento Revisión Técnica")
    vencimiento_permiso_circulacion = models.DateField(null=True, blank=True, verbose_name="Vencimiento Permiso de Circulación")
    vencimiento_soap = models.DateField(null=True, blank=True, verbose_name="Vencimiento SOAP")

    # Parámetros de mantención preventiva
    intervalo_mantencion_km = models.IntegerField(default=10000, verbose_name="Intervalo Mantención (km)")
    ultimo_km_mantencion = models.IntegerField(default=0, verbose_name="Km Última Mantención")

    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["patente"]
        verbose_name = "Vehículo"
        verbose_name_plural = "Vehículos"

    def __str__(self):
        return f"{self.patente} - {self.marca} {self.modelo}"


class carga_combustible(models.Model):
    """Modelo que representa una carga de combustible para un vehículo."""
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, related_name="cargas_combustible")
    fecha_carga = models.DateTimeField(auto_now_add=True)
    litros_cargados = models.DecimalField(max_digits=5, decimal_places=2)
    costo_total_clp = models.DecimalField(max_digits=10, decimal_places=2)
    kilometraje_al_cargar = models.IntegerField()

    class Meta:
        ordering = ["-fecha_carga"]
        verbose_name = "Carga de Combustible"
        verbose_name_plural = "Cargas de Combustible"

    def __str__(self):
        return f"{self.vehiculo.patente} - {self.litros_cargados}L (${self.costo_total_clp})"


class Taller(models.Model):
    """Entidad que representa un taller mecánico o maestranza asociada a la flota."""
    nombre = models.CharField(max_length=100, unique=True)
    especialidad = models.CharField(max_length=100, default="Mecánica General")
    direccion = models.CharField(max_length=150, blank=True, default="")
    telefono = models.CharField(max_length=25, blank=True, default="")
    activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["nombre"]
        verbose_name = "Taller"
        verbose_name_plural = "Talleres"

    def __str__(self):
        return f"{self.nombre} ({self.especialidad})"


class Mantencion(models.Model):
    """Bitácora de mantenciones preventivas y correctivas con desglose de costos."""
    TIPO_MANTENCION = [
        ("PREVENTIVA", "Preventiva (Kilometraje / Pauta)"),
        ("CORRECTIVA", "Correctiva (Falla / Reparación)"),
    ]

    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, related_name="mantenciones")
    taller = models.ForeignKey(Taller, on_delete=models.SET_NULL, null=True, blank=True, related_name="mantenciones")
    tipo = models.CharField(max_length=15, choices=TIPO_MANTENCION, default="PREVENTIVA")
    fecha = models.DateField()
    kilometraje_realizado = models.IntegerField()
    descripcion = models.TextField()

    # Desglose de costos en CLP
    costo_repuestos_clp = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    costo_mano_obra_clp = models.DecimalField(max_digits=10, decimal_places=0, default=0)
    costo_total_clp = models.DecimalField(max_digits=10, decimal_places=0, default=0)

    proximo_kilometraje = models.IntegerField(null=True, blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-fecha", "-id"]
        verbose_name = "Mantención"
        verbose_name_plural = "Mantenciones"

    def save(self, *args, **kwargs):
        # Calcula automáticamente el costo total antes de guardar en SQLite
        self.costo_total_clp = (self.costo_repuestos_clp or 0) + (self.costo_mano_obra_clp or 0)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"[{self.tipo}] {self.vehiculo.patente} - {self.fecha} (${self.costo_total_clp})"