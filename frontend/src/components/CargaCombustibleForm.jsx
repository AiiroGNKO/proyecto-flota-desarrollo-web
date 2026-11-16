import { useState } from "react";
import { cargasCombustibleApi } from "../api/client";

export default function CargaCombustibleForm({ vehiculos, onCargaGuardada }) {
  const VACIO = {
    vehiculo: vehiculos[0]?.id || "",
    litros_cargados: "",
    costo_total_clp: "",
    kilometraje_al_cargar: "",
  };

  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});

    try {
      await cargasCombustibleApi.crear(form);
      setForm(VACIO);
      onCargaGuardada();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErrores(err.detalle);
      } else {
        setErrores({ general: ["Error al registrar la carga de combustible."] });
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
      <h2>Registrar Carga de Combustible</h2>

      <label>
        Vehículo
        <select name="vehiculo" value={form.vehiculo} onChange={handleChange}>
          <option value="">-- Seleccionar Vehículo --</option>
          {vehiculos.map((v) => (
            <option key={v.id} value={v.id}>
              {v.patente} ({v.marca} {v.modelo}) - Actual: {v.kilometraje_actual} km
            </option>
          ))}
        </select>
        {mensajes("vehiculo")}
      </label>

      <label>
        Litros Cargados
        <input name="litros_cargados" type="number" step="0.01" value={form.litros_cargados} onChange={handleChange} />
        {mensajes("litros_cargados")}
      </label>

      <label>
        Costo Total ($ CLP)
        <input name="costo_total_clp" type="number" step="0.01" value={form.costo_total_clp} onChange={handleChange} />
        {mensajes("costo_total_clp")}
      </label>

      <label>
        Kilometraje al Cargar
        <input name="kilometraje_al_cargar" type="number" value={form.kilometraje_al_cargar} onChange={handleChange} />
        {mensajes("kilometraje_al_cargar")}
      </label>

      {mensajes("general")}

      <button type="submit" disabled={enviando}>
        {enviando ? "Guardando..." : "Registrar Carga"}
      </button>
    </form>
  );
}


