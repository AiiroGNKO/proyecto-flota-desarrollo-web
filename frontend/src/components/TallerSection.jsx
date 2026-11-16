import { useState } from "react";
import { talleresApi } from "../api/client";

const VACIO = {
  nombre: "",
  especialidad: "Mecánica General",
  direccion: "",
  telefono: "",
  activo: true,
};

export default function TallerSection({ talleres, esAdmin, onGuardado }) {
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
      await talleresApi.crear(form);
      setForm(VACIO);
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErrores(err.detalle);
      } else if (err.status === 403) {
        setErrores({ general: ["No tienes permisos de Administrador para registrar talleres."] });
      } else {
        setErrores({ general: ["Error al guardar el taller."] });
      }
    } finally {
      setEnviando(false);
    }
  };

  const handleEliminar = async (t) => {
    if (!window.confirm(`¿Eliminar el taller "${t.nombre}"?`)) return;
    try {
      await talleresApi.eliminar(t.id);
      onGuardado();
    } catch {
      alert("No se pudo eliminar el taller (requiere rol Administrador).");
    }
  };

  const mensajes = (campo) =>
    errores[campo]?.map((m) => (
      <span key={m} className="campo-error">{m}</span>
    ));

  return (
    <section>
      {esAdmin ? (
        <form className="formulario" onSubmit={handleSubmit}>
          <h2>Registrar Taller Asociado</h2>
          <div className="grid-form">
            <label>
              Nombre del Taller / Maestranza
              <input name="nombre" value={form.nombre} onChange={handleChange} placeholder="Ej: Maestranza Ruta 5 Sur" />
              {mensajes("nombre")}
            </label>

            <label>
              Especialidad
              <input name="especialidad" value={form.especialidad} onChange={handleChange} placeholder="Ej: Frenos y Neumáticos" />
              {mensajes("especialidad")}
            </label>

            <label>
              Dirección
              <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Ej: Av. San Miguel 1420, Talca" />
              {mensajes("direccion")}
            </label>

            <label>
              Teléfono de Contacto
              <input name="telefono" value={form.telefono} onChange={handleChange} placeholder="Ej: +56 9 8765 4321" />
              {mensajes("telefono")}
            </label>
          </div>
          {mensajes("general")}
          <div>
            <button type="submit" disabled={enviando}>
              {enviando ? "Guardando..." : "Guardar Taller"}
            </button>
          </div>
        </form>
      ) : (
        <p className="aviso">Modo Operador: visualización de talleres habilitada (creación/eliminación solo Administrador).</p>
      )}

      {talleres.length === 0 ? (
        <p className="aviso">Aún no hay talleres registrados.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Taller</th>
              <th>Especialidad</th>
              <th>Dirección</th>
              <th>Teléfono</th>
              {esAdmin && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {talleres.map((t) => (
              <tr key={t.id}>
                <td><strong>{t.nombre}</strong></td>
                <td>{t.especialidad}</td>
                <td>{t.direccion || "—"}</td>
                <td>{t.telefono || "—"}</td>
                {esAdmin && (
                  <td>
                    <button onClick={() => handleEliminar(t)}>Eliminar</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}