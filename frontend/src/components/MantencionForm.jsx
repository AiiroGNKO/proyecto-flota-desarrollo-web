import { useState } from "react";
import { mantencionesApi } from "../api/client";

export default function MantencionForm({ vehiculos, talleres, onGuardado }) {
  const hoy = new Date().toISOString().split("T")[0];

  const VACIO = {
    vehiculo: "",
    taller: "",
    tipo: "PREVENTIVA",
    fecha: hoy,
    kilometraje_realizado: "",
    descripcion: "",
    costo_repuestos_clp: 0,
    costo_mano_obra_clp: 0,
  };

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const vehiculoSeleccionado = vehiculos.find((v) => String(v.id) === String(form.vehiculo));
  const totalEstimado = (Number(form.costo_repuestos_clp) || 0) + (Number(form.costo_mano_obra_clp) || 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "vehiculo") {
      const seleccionado = vehiculos.find((v) => String(v.id) === String(value));
      setForm({
        ...form,
        vehiculo: value,
        kilometraje_realizado: seleccionado ? seleccionado.kilometraje_actual : "",
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});

    const payload = {
      ...form,
      taller: form.taller || null,
    };

    try {
      await mantencionesApi.crear(payload);
      setForm(VACIO);
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErrores(err.detalle);
      } else {
        setErrores({ general: ["Error al registrar la mantención."] });
      }
    } finally {
      setEnviando(false);
    }
  };

  const mensajes = (campo) =>
    errores[campo]?.map((m) => (
      <span key={m} className="campo-error">{m}</span>
    ));

  return (
    <form className="formulario" onSubmit={handleSubmit}>
      <h2>Registrar Orden de Mantención</h2>

      {vehiculoSeleccionado?.estado_mantencion && (
        <div className={vehiculoSeleccionado.estado_mantencion.alerta === "OK" ? "aviso" : "aviso error"}>
          <strong>Estado Preventivo ({vehiculoSeleccionado.patente}):</strong>{" "}
          {vehiculoSeleccionado.estado_mantencion.alerta === "VENCIDA"
            ? `¡MANTENCIÓN VENCIDA! Excedida por ${Math.abs(vehiculoSeleccionado.estado_mantencion.km_restantes).toLocaleString("es-CL")} km.`
            : vehiculoSeleccionado.estado_mantencion.alerta === "PROXIMA"
            ? `¡ALERTA PROXIMIDAD! Faltan ${vehiculoSeleccionado.estado_mantencion.km_restantes.toLocaleString("es-CL")} km para el servicio.`
            : `Al día. Próximo servicio programado a los ${vehiculoSeleccionado.estado_mantencion.proximo_km_objetivo.toLocaleString("es-CL")} km.`}
        </div>
      )}

      <div className="grid-form">
        <label>
          Vehículo
          <select name="vehiculo" value={form.vehiculo} onChange={handleChange}>
            <option value="">-- Seleccionar Vehículo --</option>
            {vehiculos.map((v) => (
              <option key={v.id} value={v.id}>
                {v.patente} - {v.marca} {v.modelo} ({v.kilometraje_actual} km)
              </option>
            ))}
          </select>
          {mensajes("vehiculo")}
        </label>

        <label>
          Taller Asociado
          <select name="taller" value={form.taller} onChange={handleChange}>
            <option value="">-- Taller Interno / Sin asignar --</option>
            {talleres.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nombre} ({t.especialidad})
              </option>
            ))}
          </select>
          {mensajes("taller")}
        </label>

        <label>
          Tipo de Mantención
          <select name="tipo" value={form.tipo} onChange={handleChange}>
            <option value="PREVENTIVA">Preventiva (Pauta por km)</option>
            <option value="CORRECTIVA">Correctiva (Reparación / Falla)</option>
          </select>
          {mensajes("tipo")}
        </label>

        <label>
          Fecha de Ejecución
          <input name="fecha" type="date" value={form.fecha} onChange={handleChange} />
          {mensajes("fecha")}
        </label>

        <label>
          Kilometraje al Realizar
          <input name="kilometraje_realizado" type="number" value={form.kilometraje_realizado} onChange={handleChange} />
          {mensajes("kilometraje_realizado")}
        </label>

        <label>
          Costo Repuestos ($ CLP)
          <input name="costo_repuestos_clp" type="number" value={form.costo_repuestos_clp} onChange={handleChange} />
          {mensajes("costo_repuestos_clp")}
        </label>

        <label>
          Costo Mano de Obra ($ CLP)
          <input name="costo_mano_obra_clp" type="number" value={form.costo_mano_obra_clp} onChange={handleChange} />
          {mensajes("costo_mano_obra_clp")}
        </label>

        <label style={{ alignSelf: "end" }}>
          <div className="subtexto">Total Calculado:</div>
          <strong>{totalEstimado.toLocaleString("es-CL", { style: "currency", currency: "CLP" })}</strong>
        </label>
      </div>

      <label>
        Detalle de Trabajos / Repuestos
        <textarea
          name="descripcion"
          rows="2"
          value={form.descripcion}
          onChange={handleChange}
          placeholder="Ej: Cambio de aceite 15W40, filtro de aceite y revisión de balatas..."
        />
        {mensajes("descripcion")}
      </label>

      {mensajes("general")}

      <div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Registrar Mantención"}
        </button>
      </div>
    </form>
  );
}