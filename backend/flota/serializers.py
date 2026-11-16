import re
from datetime import date
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Vehiculo, carga_combustible, Taller, Mantencion, Conductor, Viaje

CALENDARIO_PRT_CHILE = {
    "0": "Febrero",
    "1": "Abril",
    "2": "Mayo",
    "3": "Junio",
    "4": "Julio",
    "5": "Agosto",
    "6": "Septiembre",
    "7": "Octubre",
    "8": "Noviembre",
    "9": "Diciembre",
}

def evaluar_semaforo_fecha(fecha_vencimiento):
    if not fecha_vencimiento:
        return {"estado": "SIN_REGISTRO", "dias_restantes": None}
    dias = (fecha_vencimiento - date.today()).days
    if dias < 0:
        return {"estado": "VENCIDO", "dias_restantes": dias}
    if dias <= 30:
        return {"estado": "POR_VENCER", "dias_restantes": dias}
    return {"estado": "AL_DIA", "dias_restantes": dias}


class LoginConRolSerializer(TokenObtainPairSerializer):
    """Valida usuario/contraseña contra Django y retorna tokens + información de rol."""
    default_error_messages = {
        "no_active_account": "Usuario o contraseña incorrectos. Verifica tus credenciales."
    }

    def validate(self, attrs):
        data = super().validate(attrs)
        data["usuario"] = {
            "id": self.user.id,
            "username": self.user.username,
            "email": self.user.email,
            "rol": "ADMIN" if self.user.is_staff else "OPERADOR",
            "es_admin": bool(self.user.is_staff),
        }
        return data


class VehiculoSerializer(serializers.ModelSerializer):
    mes_prt_sugerido = serializers.SerializerMethodField()
    estado_documentacion = serializers.SerializerMethodField()
    estado_mantencion = serializers.SerializerMethodField()

    class Meta:
        model = Vehiculo
        fields = [
            "id",
            "patente",
            "marca",
            "modelo",
            "tipo_vehiculo",
            "capacidad_estanque_litros",
            "kilometraje_actual",
            "vencimiento_prt",
            "vencimiento_permiso_circulacion",
            "vencimiento_soap",
            "intervalo_mantencion_km",
            "ultimo_km_mantencion",
            "mes_prt_sugerido",
            "estado_documentacion",
            "estado_mantencion",
            "activo",
            "creado_en",
        ]
        read_only_fields = ["id", "creado_en"]

    def validate_capacidad_estanque_litros(self, value):
        if value <= 0:
            raise serializers.ValidationError("La capacidad del estanque debe ser mayor que 0.")
        return value

    def validate_kilometraje_actual(self, value):
        if value < 0:
            raise serializers.ValidationError("El kilometraje no puede ser negativo.")
        return value

    def validate_intervalo_mantencion_km(self, value):
        if value <= 0:
            raise serializers.ValidationError("El intervalo de mantención debe ser mayor que 0 km.")
        return value

    def get_mes_prt_sugerido(self, obj):
        digitos = re.findall(r"\d", obj.patente or "")
        if not digitos:
            return "No determinable"
        ultimo_digito = digitos[-1]
        mes = CALENDARIO_PRT_CHILE.get(ultimo_digito, "Desconocido")
        if obj.tipo_vehiculo in ("CARGA", "PASAJEROS"):
            return f"{mes} (Dígito {ultimo_digito} - Semestral)"
        return f"{mes} (Dígito {ultimo_digito} - Anual)"

    def get_estado_documentacion(self, obj):
        prt = evaluar_semaforo_fecha(obj.vencimiento_prt)
        permiso = evaluar_semaforo_fecha(obj.vencimiento_permiso_circulacion)
        soap = evaluar_semaforo_fecha(obj.vencimiento_soap)

        estados = [prt["estado"], permiso["estado"], soap["estado"]]
        if "VENCIDO" in estados:
            global_estado = "VENCIDO"
        elif "POR_VENCER" in estados:
            global_estado = "POR_VENCER"
        elif all(e == "AL_DIA" for e in estados):
            global_estado = "AL_DIA"
        else:
            global_estado = "INCOMPLETO"

        return {
            "global": global_estado,
            "prt": prt,
            "permiso_circulacion": permiso,
            "soap": soap,
        }

    def get_estado_mantencion(self, obj):
        km_recorridos = max(0, obj.kilometraje_actual - obj.ultimo_km_mantencion)
        km_restantes = obj.intervalo_mantencion_km - km_recorridos
        proximo_km = obj.ultimo_km_mantencion + obj.intervalo_mantencion_km

        if km_restantes <= 0:
            alerta = "VENCIDA"
        elif km_restantes <= 1500:
            alerta = "PROXIMA"
        else:
            alerta = "OK"

        return {
            "alerta": alerta,
            "km_recorridos_ciclo": km_recorridos,
            "km_restantes": km_restantes,
            "proximo_km_objetivo": proximo_km,
        }


class CargaCombustibleSerializer(serializers.ModelSerializer):
    patente_vehiculo = serializers.ReadOnlyField(source="vehiculo.patente")
    rendimiento_kml = serializers.SerializerMethodField()
    precio_litro_clp = serializers.SerializerMethodField()

    class Meta:
        model = carga_combustible
        fields = [
            "id",
            "vehiculo",
            "patente_vehiculo",
            "fecha_carga",
            "litros_cargados",
            "costo_total_clp",
            "precio_litro_clp",
            "kilometraje_al_cargar",
            "rendimiento_kml",
        ]
        read_only_fields = ["id", "fecha_carga"]

    def get_precio_litro_clp(self, obj):
        if obj.litros_cargados > 0:
            return round(float(obj.costo_total_clp) / float(obj.litros_cargados), 0)
        return None

    def get_rendimiento_kml(self, obj):
        carga_anterior = carga_combustible.objects.filter(
            vehiculo=obj.vehiculo,
            fecha_carga__lt=obj.fecha_carga,
        ).order_by("-fecha_carga").first()

        if carga_anterior and obj.litros_cargados > 0:
            distancia = obj.kilometraje_al_cargar - carga_anterior.kilometraje_al_cargar
            if distancia > 0:
                return round(distancia / float(obj.litros_cargados), 2)
        return None

    def validate(self, attrs):
        vehiculo = attrs.get("vehiculo")
        kilometraje = attrs.get("kilometraje_al_cargar")
        if vehiculo and kilometraje < vehiculo.kilometraje_actual:
            raise serializers.ValidationError({
                "kilometraje_al_cargar": f"El kilometraje ({kilometraje} km) no puede ser menor al actual del vehículo ({vehiculo.kilometraje_actual} km)."
            })
        return attrs

    def create(self, validated_data):
        carga = super().create(validated_data)
        vehiculo = carga.vehiculo
        if carga.kilometraje_al_cargar > vehiculo.kilometraje_actual:
            vehiculo.kilometraje_actual = carga.kilometraje_al_cargar
            vehiculo.save()
        return carga


class TallerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Taller
        fields = ["id", "nombre", "especialidad", "direccion", "telefono", "activo", "creado_en"]
        read_only_fields = ["id", "creado_en"]


class MantencionSerializer(serializers.ModelSerializer):
    patente_vehiculo = serializers.ReadOnlyField(source="vehiculo.patente")
    nombre_taller = serializers.SerializerMethodField()
    marca_modelo = serializers.SerializerMethodField()

    class Meta:
        model = Mantencion
        fields = [
            "id",
            "vehiculo",
            "patente_vehiculo",
            "marca_modelo",
            "taller",
            "nombre_taller",
            "tipo",
            "fecha",
            "kilometraje_realizado",
            "descripcion",
            "costo_repuestos_clp",
            "costo_mano_obra_clp",
            "costo_total_clp",
            "proximo_kilometraje",
            "creado_en",
        ]
        read_only_fields = ["id", "costo_total_clp", "creado_en"]

    def get_nombre_taller(self, obj):
        return obj.taller.nombre if obj.taller else "Taller Interno / Sin asignar"

    def get_marca_modelo(self, obj):
        return f"{obj.vehiculo.marca} {obj.vehiculo.modelo}"

    def validate_kilometraje_realizado(self, value):
        if value < 0:
            raise serializers.ValidationError("El kilometraje no puede ser negativo.")
        return value

    def validate_costo_repuestos_clp(self, value):
        if value < 0:
            raise serializers.ValidationError("El costo de repuestos no puede ser negativo.")
        return value

    def validate_costo_mano_obra_clp(self, value):
        if value < 0:
            raise serializers.ValidationError("El costo de mano de obra no puede ser negativo.")
        return value

    def create(self, validated_data):
        vehiculo = validated_data["vehiculo"]
        km_realizado = validated_data["kilometraje_realizado"]

        if validated_data.get("tipo") == "PREVENTIVA" and not validated_data.get("proximo_kilometraje"):
            validated_data["proximo_kilometraje"] = km_realizado + vehiculo.intervalo_mantencion_km

        mantencion = super().create(validated_data)

        actualizado = False
        if km_realizado > vehiculo.kilometraje_actual:
            vehiculo.kilometraje_actual = km_realizado
            actualizado = True
        if mantencion.tipo == "PREVENTIVA" and km_realizado > vehiculo.ultimo_km_mantencion:
            vehiculo.ultimo_km_mantencion = km_realizado
            actualizado = True
        if actualizado:
            vehiculo.save()

        return mantencion

class ConductorSerializer(serializers.ModelSerializer):
    estado_licencia = serializers.SerializerMethodField()

    class Meta:
        model = Conductor
        fields = [
            "id",
            "nombre",
            "rut",
            "licencia_clase",
            "vencimiento_licencia",
            "estado_licencia",
            "telefono",
            "activo",
            "creado_en",
        ]
        read_only_fields = ["id", "creado_en"]

    def validate_rut(self, value):
        return value.upper().strip()

    def get_estado_licencia(self, obj):
        return evaluar_semaforo_fecha(obj.vencimiento_licencia)


class ViajeSerializer(serializers.ModelSerializer):
    patente_vehiculo = serializers.ReadOnlyField(source="vehiculo.patente")
    marca_modelo = serializers.SerializerMethodField()
    nombre_conductor = serializers.SerializerMethodField()
    km_recorridos = serializers.SerializerMethodField()

    class Meta:
        model = Viaje
        fields = [
            "id",
            "vehiculo",
            "patente_vehiculo",
            "marca_modelo",
            "conductor",
            "nombre_conductor",
            "origen",
            "destino",
            "fecha",
            "kilometraje_inicial",
            "kilometraje_final",
            "km_recorridos",
            "carga_descripcion",
            "creado_en",
        ]
        read_only_fields = ["id", "creado_en"]

    def get_marca_modelo(self, obj):
        return f"{obj.vehiculo.marca} {obj.vehiculo.modelo}"

    def get_nombre_conductor(self, obj):
        return f"{obj.conductor.nombre} ({obj.conductor.licencia_clase})" if obj.conductor else "Sin asignar"

    def get_km_recorridos(self, obj):
        return max(0, obj.kilometraje_final - obj.kilometraje_inicial)

    def validate(self, attrs):
        vehiculo = attrs.get("vehiculo")
        km_ini = attrs.get("kilometraje_inicial")
        km_fin = attrs.get("kilometraje_final")

        if km_ini is not None and km_fin is not None and km_fin <= km_ini:
            raise serializers.ValidationError({
                "kilometraje_final": "El kilometraje final debe ser mayor que el kilometraje inicial."
            })

        if vehiculo and km_ini is not None and km_ini < vehiculo.kilometraje_actual:
            raise serializers.ValidationError({
                "kilometraje_inicial": f"El kilometraje inicial ({km_ini} km) no puede ser menor al actual del vehículo ({vehiculo.kilometraje_actual} km)."
            })

        return attrs

    def create(self, validated_data):
        viaje = super().create(validated_data)
        vehiculo = viaje.vehiculo
        if viaje.kilometraje_final > vehiculo.kilometraje_actual:
            vehiculo.kilometraje_actual = viaje.kilometraje_final
            vehiculo.save()
        return viaje