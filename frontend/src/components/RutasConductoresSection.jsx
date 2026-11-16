import { useState } from "react";
import { conductoresApi, viajesApi } from "../api/client";

const badgeLicencia = (estado) => {
  if (estado === "VENCIDO") return "badge badge-rojo";
  if (estado === "POR_VENCER") return "badge badge-amarillo";
  if (estado === "AL_DIA") return "badge badge-verde";
  return "badge badge-gris";
};

export default function RutasConductoresSection({
  vehiculos,
  conductores,
  viajes,
  esAdmin,
  onGuardado,
}) {
  const [subVista, setSubVista] = useState("viajes");
  const hoy = new Date().toISOString().split("T")[0];

  // Estado formulario de Viaje / Ruta
  const VIAJE_VACIO = {
    vehiculo: "",
    conductor: "",
    origen: "",
    destino: "",
    fecha: hoy,
    kilometraje_inicial: "",
    kilometraje_final: "",
    carga_descripcion: "",
  };
  const [formViaje, setFormViaje] = useState(VIAJE_VACIO);
  const [erroresViaje, setErroresViaje] = useState({});
  const [enviandoViaje, setEnviandoViaje] = useState(false);

  // Estado formulario de Conductor
  const CONDUCTOR_VACIO = {
    nombre: "",
    rut: "",
    licencia_clase: "A4",
    vencimiento_licencia: "",
    telefono: "",
    activo: true,
  };
  const [formConductor, setFormConductor] = useState(CONDUCTOR_VACIO);
  const [erroresConductor, setErroresConductor] = useState({});
  const [enviandoConductor, setEnviandoConductor] = useState(false);

  const distanciaEstimada =
    formViaje.kilometraje_inicial !== "" && formViaje.kilometraje_final !== ""
      ? Number(formViaje.kilometraje_final) - Number(formViaje.kilometraje_inicial)
      : null;

  const handleChangeViaje = (e) => {
    const { name, value } = e.target;
    if (name === "vehiculo") {
      const v = vehiculos.find((item) => String(item.id) === String(value));
      setFormViaje({
        ...formViaje,
        vehiculo: value,
        kilometraje_inicial: v ? v.kilometraje_actual : "",
      });
    } else {
      setFormViaje({ ...formViaje, [name]: value });
    }
  };

  const handleSubmitViaje = async (e) => {
    e.preventDefault();
    setEnviandoViaje(true);
    setErroresViaje({});

    const payload = {
      ...formViaje,
      conductor: formViaje.conductor || null,
    };

    try {
      await viajesApi.crear(payload);
      setFormViaje(VIAJE_VACIO);
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErroresViaje(err.detalle);
      } else {
        setErroresViaje({ general: ["Error al registrar la ruta."] });
      }
    } finally {
      setEnviandoViaje(false);
    }
  };

  const handleEliminarViaje = async (viaje) => {
    if (!window.confirm(`¿Eliminar el viaje ${viaje.origen} -> ${viaje.destino} (${viaje.patente_vehiculo})?`)) return;
    try {
      await viajesApi.eliminar(viaje.id);
      onGuardado();
    } catch {
      alert("No se pudo eliminar el registro de viaje.");
    }
  };

  const handleChangeConductor = (e) => {
    const { name, value } = e.target;
    setFormConductor({ ...formConductor, [name]: value });
  };

  const handleSubmitConductor = async (e) => {
    e.preventDefault();
    setEnviandoConductor(true);
    setErroresConductor({});

    const payload = {
      ...formConductor,
      vencimiento_licencia: formConductor.vencimiento_licencia || null,
    };

    try {
      await conductoresApi.crear(payload);
      setFormConductor(CONDUCTOR_VACIO);
      onGuardado();
    } catch (err) {
      if (err.status === 400 && err.detalle) {
        setErroresConductor(err.detalle);
      } else if (err.status === 403) {
        setErroresConductor({ general: ["Solo un Administrador puede registrar conductores."] });
      } else {
        setErroresConductor({ general: ["Error al guardar el conductor."] });
      }
    } finally {
      setEnviandoConductor(false);
    }
  };

  const handleEliminarConductor = async (c) => {
    if (!window.confirm(`¿Eliminar al conductor "${c.nombre}"?`)) return;
    try {
      await conductoresApi.eliminar(c.id);
      onGuardado();
    } catch {
      alert("No se pudo eliminar el conductor (requiere rol Administrador).");
    }
  };

  const renderErrores = (bag, campo) =>
    bag[campo]?.map((m) => (
      <span key={m} className="campo-error">{m}</span>
    ));

  return (
    <section>
      <div style={{ marginBottom: "1rem" }}>
        <button
          type="button"
          className={subVista === "viajes" ? "tab-activa" : ""}
          style={subVista === "viajes" ? { background: "#1A8A8A", color: "#fff", borderColor: "#1A8A8A" } : {}}
          onClick={() => setSubVista("viajes")}
        >
          Bitácora de Rutas ({viajes.length})
        </button>
        <button
          type="button"
          className={subVista === "conductores" ? "tab-activa" : ""}
          style={subVista === "conductores" ? { background: "#1A8A8A", color: "#fff", borderColor: "#1A8A8A" } : {}}
          onClick={() => setSubVista("conductores")}
        >
          Padrón de Conductores ({conductores.length})
        </button>
      </div>

      {subVista === "viajes" && (
        <div>
          <form className="formulario" onSubmit={handleSubmitViaje}>
            <h2>Registrar Despacho / Ruta</h2>
            <div className="grid-form">
              <label>
                Vehículo
                <select name="vehiculo" value={formViaje.vehiculo} onChange={handleChangeViaje}>
                  <option value="">-- Seleccionar Vehículo --</option>
                  {vehiculos.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.patente} - {v.marca} {v.modelo} ({v.kilometraje_actual} km)
                    </option>
                  ))}
                </select>
                {renderErrores(erroresViaje, "vehiculo")}
              </label>

              <label>
                Conductor Asignado
                <select name="conductor" value={formViaje.conductor} onChange={handleChangeViaje}>
                  <option value="">-- Sin asignar --</option>
                  {conductores.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Clase {c.licencia_clase})
                    </option>
                  ))}
                </select>
                {renderErrores(erroresViaje, "conductor")}
              </label>

              <label>
                Fecha de Ruta
                <input name="fecha" type="date" value={formViaje.fecha} onChange={handleChangeViaje} />
                {renderErrores(erroresViaje, "fecha")}
              </label>

              <label>
                Origen
                <input name="origen" value={formViaje.origen} onChange={handleChangeViaje} placeholder="Ej: Talca" />
                {renderErrores(erroresViaje, "origen")}
              </label>

              <label>
                Destino
                <input name="destino" value={formViaje.destino} onChange={handleChangeViaje} placeholder="Ej: Santiago" />
                {renderErrores(erroresViaje, "destino")}
              </label>

              <label>
                Kilometraje Inicial
                <input
                  name="kilometraje_inicial"
                  type="number"
                  value={formViaje.kilometraje_inicial}
                  onChange={handleChangeViaje}
                />
                {renderErrores(erroresViaje, "kilometraje_inicial")}
              </label>

              <label>
                Kilometraje Final
                <input
                  name="kilometraje_final"
                  type="number"
                  value={formViaje.kilometraje_final}
                  onChange={handleChangeViaje}
                />
                {renderErrores(erroresViaje, "kilometraje_final")}
              </label>

              <label>
                Carga / Motivo (Opcional)
                <input
                  name="carga_descripcion"
                  value={formViaje.carga_descripcion}
                  onChange={handleChangeViaje}
                  placeholder="Ej: Carga palletizada 18 ton"
                />
                {renderErrores(erroresViaje, "carga_descripcion")}
              </label>
            </div>

            {distanciaEstimada !== null && (
              <div className="subtexto">
                Distancia calculada del tramo:{" "}
                <strong>{distanciaEstimada > 0 ? `${distanciaEstimada.toLocaleString("es-CL")} km` : "Verifica odómetro"}</strong>
              </div>
            )}

            {renderErrores(erroresViaje, "general")}

            <div>
              <button type="submit" disabled={enviandoViaje}>
                {enviandoViaje ? "Guardando..." : "Registrar Ruta"}
              </button>
            </div>
          </form>

          {viajes.length === 0 ? (
            <p className="aviso">Aún no hay rutas registradas en la bitácora.</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Conductor</th>
                  <th>Tramo (Origen → Destino)</th>
                  <th>Odómetro</th>
                  <th>Recorrido</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {viajes.map((v) => (
                  <tr key={v.id}>
                    <td>{v.fecha}</td>
                    <td>
                      <strong>{v.patente_vehiculo}</strong>
                      <div className="subtexto">{v.marca_modelo}</div>
                    </td>
                    <td>{v.nombre_conductor}</td>
                    <td>
                      <strong>{v.origen} → {v.destino}</strong>
                      {v.carga_descripcion && <div className="subtexto">{v.carga_descripcion}</div>}
                    </td>
                    <td>
                      {Number(v.kilometraje_inicial).toLocaleString("es-CL")} →{" "}
                      {Number(v.kilometraje_final).toLocaleString("es-CL")} km
                    </td>
                    <td>
                      <span className="badge badge-verde">
                        +{Number(v.km_recorridos).toLocaleString("es-CL")} km
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleEliminarViaje(v)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {subVista === "conductores" && (
        <div>
          {esAdmin ? (
            <form className="formulario" onSubmit={handleSubmitConductor}>
              <h2>Registrar Conductor</h2>
              <div className="grid-form">
                <label>
                  Nombre Completo
                  <input
                    name="nombre"
                    value={formConductor.nombre}
                    onChange={handleChangeConductor}
                    placeholder="Ej: Carlos Muñoz Soto"
                  />
                  {renderErrores(erroresConductor, "nombre")}
                </label>

                <label>
                  RUT
                  <input
                    name="rut"
                    value={formConductor.rut}
                    onChange={handleChangeConductor}
                    placeholder="Ej: 16.482.910-5"
                  />
                  {renderErrores(erroresConductor, "rut")}
                </label>

                <label>
                  Clase de Licencia (Chile)
                  <select name="licencia_clase" value={formConductor.licencia_clase} onChange={handleChangeConductor}>
                    <option value="A5">Clase A5 (Carga Articulada / Tractocamiones)</option>
                    <option value="A4">Clase A4 (Carga Simple &gt; 3.500 kg)</option>
                    <option value="A2">Clase A2 (Pasajeros / Transporte Menor)</option>
                    <option value="B">Clase B (Vehículos Livianos)</option>
                  </select>
                  {renderErrores(erroresConductor, "licencia_clase")}
                </label>

                <label>
                  Vencimiento Licencia
                  <input
                    name="vencimiento_licencia"
                    type="date"
                    value={formConductor.vencimiento_licencia}
                    onChange={handleChangeConductor}
                  />
                  {renderErrores(erroresConductor, "vencimiento_licencia")}
                </label>

                <label>
                  Teléfono
                  <input
                    name="telefono"
                    value={formConductor.telefono}
                    onChange={handleChangeConductor}
                    placeholder="Ej: +56 9 9123 4567"
                  />
                  {renderErrores(erroresConductor, "telefono")}
                </label>
              </div>

              {renderErrores(erroresConductor, "general")}

              <div>
                <button type="submit" disabled={enviandoConductor}>
                  {enviandoConductor ? "Guardando..." : "Guardar Conductor"}
                </button>
              </div>
            </form>
          ) : (
            <p className="aviso">Modo Operador: consulta de conductores habilitada (registro/eliminación solo Administrador).</p>
          )}

          {conductores.length === 0 ? (
            <p className="aviso">Aún no hay conductores registrados.</p>
          ) : (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Conductor</th>
                  <th>RUT</th>
                  <th>Licencia</th>
                  <th>Vigencia Licencia</th>
                  <th>Teléfono</th>
                  {esAdmin && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {conductores.map((c) => (
                  <tr key={c.id}>
                    <td><strong>{c.nombre}</strong></td>
                    <td>{c.rut}</td>
                    <td>Clase {c.licencia_clase}</td>
                    <td>
                      {c.estado_licencia ? (
                        <div>
                          <span className={badgeLicencia(c.estado_licencia.estado)}>
                            {c.estado_licencia.estado.replace("_", " ")}
                          </span>
                          <div className="subtexto">{c.vencimiento_licencia || "Sin fecha"}</div>
                        </div>
                      ) : "—"}
                    </td>
                    <td>{c.telefono || "—"}</td>
                    {esAdmin && (
                      <td>
                        <button onClick={() => handleEliminarConductor(c)}>Eliminar</button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </section>
  );
}