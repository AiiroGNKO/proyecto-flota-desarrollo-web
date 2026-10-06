import { useEffect, useState } from "react";
import { vehiculosApi } from "../api/client";

const VACIO = {
  patente: "",
  marca: "",
  modelo: "",
  capacidad_estanque_litros: "",
  kilometraje_actual: 0,
  activo: true,
};

export default function VehiculoForm({ vehiculo, onGuardado, onCancelar }) {
  const [form, setForm] = useState(VACIO);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    setForm(vehiculo ?? VACIO);
    setErrores({});
  }, [vehiculo]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setEnviando(true);
    setErrores({});

    try {
      if (vehiculo) {
        await vehiculosApi.actualizar(vehiculo.id, form);
      } else {
        await vehiculosApi.crear(form);
      }
      setForm(VACIO);
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErrores(err.detalle);
      } else {
        setErrores({ general: ["No se pudo guardar el vehículo. Intenta nuevamente."] });
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
      <h2>{vehiculo ? "Editar Vehículo" : "Nuevo Vehículo"}</h2>

      <label>
        Patente
        <input name="patente" value={form.patente} onChange={handleChange} placeholder="Ej: BBCL-12" />
        {mensajes("patente")}
      </label>

      <label>
        Marca
        <input name="marca" value={form.marca} onChange={handleChange} placeholder="Ej: Volvo" />
        {mensajes("marca")}
      </label>

      <label>
        Modelo
        <input name="modelo" value={form.modelo} onChange={handleChange} placeholder="Ej: FH16" />
        {mensajes("modelo")}
      </label>

      <label>
        Capacidad Estanque (Litros)
        <input name="capacidad_estanque_litros" type="number" step="0.1" value={form.capacidad_estanque_litros} onChange={handleChange} />
        {mensajes("capacidad_estanque_litros")}
      </label>

      <label>
        Kilometraje Actual
        <input name="kilometraje_actual" type="number" value={form.kilometraje_actual} onChange={handleChange} />
        {mensajes("kilometraje_actual")}
      </label>

      <label>
        <span>
          <input name="activo" type="checkbox" checked={form.activo} onChange={handleChange} /> Operativo / Activo
        </span>
      </label>

      {mensajes("general")}

      <div>
        <button type="submit" disabled={enviando}>
          {enviando ? "Guardando..." : "Guardar"}
        </button>
        {vehiculo && (
          <button type="button" onClick={onCancelar}>Cancelar</button>
        )}
      </div>
    </form>
  );
}