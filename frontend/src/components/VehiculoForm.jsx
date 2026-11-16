
import { useState } from "react";
import { vehiculosApi } from "../api/client";

// Valores iniciales del formulario
const VACIO = {
  patente: "",
  marca: "",
  modelo: "",
  tipo_vehiculo: "CARGA",
  capacidad_estanque_litros: "",
  kilometraje_actual: 0,
  vencimiento_prt: "",
  vencimiento_permiso_circulacion: "",
  vencimiento_soap: "",
  intervalo_mantencion_km: 10000,
  ultimo_km_mantencion: 0,
  activo: true,
};

// Construye el formulario según si estamos creando o editando
const crearFormulario = (vehiculo) => ({
  ...VACIO,
  ...(vehiculo ?? {}),
  vencimiento_prt: vehiculo?.vencimiento_prt ?? "",
  vencimiento_permiso_circulacion:
    vehiculo?.vencimiento_permiso_circulacion ?? "",
  vencimiento_soap: vehiculo?.vencimiento_soap ?? "",
});

export default function VehiculoForm({
  vehiculo,
  onGuardado,
  onCancelar,
}) {
  // Inicialización del estado
  const [form, setForm] = useState(() => crearFormulario(vehiculo));
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  // Manejo de cambios en los campos
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prevForm) => ({
      ...prevForm,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Limpia los errores generales al modificar el formulario
    setErrores((prevErrores) => ({
      ...prevErrores,
      [name]: undefined,
    }));
  };

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    setEnviando(true);
    setErrores({});

    // Preparación de los datos para enviar al backend
    const payload = {
      ...form,
      patente: form.patente.toUpperCase().trim(),
      vencimiento_prt: form.vencimiento_prt || null,
      vencimiento_permiso_circulacion:
        form.vencimiento_permiso_circulacion || null,
      vencimiento_soap: form.vencimiento_soap || null,
    };

    try {
      if (vehiculo) {
        // Actualizar vehículo existente
        await vehiculosApi.actualizar(vehiculo.id, payload);
      } else {
        // Registrar vehículo nuevo
        await vehiculosApi.crear(payload);
      }

      // Reiniciar formulario
      setForm(crearFormulario(null));
      setErrores({});

      // Notificar al componente padre
      onGuardado();

    } catch (err) {
      // Manejo de errores de validación del backend
      if (err.status === 400 && err.detalle) {
        setErrores(err.detalle);
      } else {
        setErrores({
          general: ["No se pudo guardar el vehículo."],
        });
      }
    } finally {
      setEnviando(false);
    }
  };

  // Renderizado de mensajes de error por campo
  const mensajes = (campo) =>
    errores[campo]?.map((mensaje, index) => (
      <span key={`${campo}-${index}`} className="campo-error">
        {mensaje}
      </span>
    ));

  return (
    <form className="formulario" onSubmit={handleSubmit}>

      <h2>
        {vehiculo
          ? `Editar Vehículo (${vehiculo.patente})`
          : "Registrar Nuevo Vehículo"}
      </h2>

      {/* Información general del vehículo */}
      <div className="grid-form">

        <label>
          Patente
          <input
            name="patente"
            value={form.patente}
            onChange={handleChange}
            placeholder="Ej: RTKP-42"
          />
          {mensajes("patente")}
        </label>

        <label>
          Tipo de Vehículo
          <select
            name="tipo_vehiculo"
            value={form.tipo_vehiculo}
            onChange={handleChange}
          >
            <option value="CARGA">Transporte de Carga</option>
            <option value="LIVIANO">
              Vehículo Liviano / Utilitario
            </option>
            <option value="PASAJEROS">
              Transporte de Pasajeros
            </option>
          </select>
          {mensajes("tipo_vehiculo")}
        </label>

        <label>
          Marca
          <input
            name="marca"
            value={form.marca}
            onChange={handleChange}
            placeholder="Ej: Volvo"
          />
          {mensajes("marca")}
        </label>

        <label>
          Modelo
          <input
            name="modelo"
            value={form.modelo}
            onChange={handleChange}
            placeholder="Ej: FH 500"
          />
          {mensajes("modelo")}
        </label>

        <label>
          Capacidad Estanque (L)
          <input
            name="capacidad_estanque_litros"
            type="number"
            step="0.1"
            value={form.capacidad_estanque_litros}
            onChange={handleChange}
          />
          {mensajes("capacidad_estanque_litros")}
        </label>

        <label>
          Kilometraje Actual
          <input
            name="kilometraje_actual"
            type="number"
            value={form.kilometraje_actual}
            onChange={handleChange}
          />
          {mensajes("kilometraje_actual")}
        </label>

      </div>

      {/* Documentación legal */}
      <h3>Documentación Legal (Chile)</h3>

      <div className="grid-form">

        <label>
          Vencimiento Revisión Técnica (PRT)
          <input
            name="vencimiento_prt"
            type="date"
            value={form.vencimiento_prt}
            onChange={handleChange}
          />
          {mensajes("vencimiento_prt")}
        </label>

        <label>
          Vencimiento Permiso Circulación
          <input
            name="vencimiento_permiso_circulacion"
            type="date"
            value={form.vencimiento_permiso_circulacion}
            onChange={handleChange}
          />
          {mensajes("vencimiento_permiso_circulacion")}
        </label>

        <label>
          Vencimiento SOAP
          <input
            name="vencimiento_soap"
            type="date"
            value={form.vencimiento_soap}
            onChange={handleChange}
          />
          {mensajes("vencimiento_soap")}
        </label>

      </div>

      {/* Plan de mantenimiento preventivo */}
      <h3>Plan Preventivo</h3>

      <div className="grid-form">

        <label>
          Intervalo Mantención (km)
          <input
            name="intervalo_mantencion_km"
            type="number"
            value={form.intervalo_mantencion_km}
            onChange={handleChange}
          />
          {mensajes("intervalo_mantencion_km")}
        </label>

        <label>
          Km Última Mantención Preventiva
          <input
            name="ultimo_km_mantencion"
            type="number"
            value={form.ultimo_km_mantencion}
            onChange={handleChange}
          />
          {mensajes("ultimo_km_mantencion")}
        </label>

        <label style={{ alignSelf: "end" }}>
          <span>
            <input
              name="activo"
              type="checkbox"
              checked={form.activo}
              onChange={handleChange}
            />
            {" "}Vehículo Operativo
          </span>
        </label>

      </div>

      {/* Errores generales */}
      {mensajes("general")}

      {/* Acciones del formulario */}
      <div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar Vehículo"}
        </button>

        {vehiculo && (
          <button
            type="button"
            onClick={onCancelar}
            disabled={enviando}
          >
            Cancelar
          </button>
        )}
      </div>

    </form>
  );
}
