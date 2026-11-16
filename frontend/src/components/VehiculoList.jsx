const badgeClase = (estado) => {
  if (estado === "VENCIDO" || estado === "VENCIDA") return "badge badge-rojo";
  if (estado === "POR_VENCER" || estado === "PROXIMA") return "badge badge-amarillo";
  if (estado === "AL_DIA" || estado === "OK") return "badge badge-verde";
  return "badge badge-gris";
};

export default function VehiculoList({ vehiculos, esAdmin, onEditar, onEliminar }) {
  if (!vehiculos || vehiculos.length === 0) {
    return <p className="aviso">Aún no hay vehículos registrados en la flota.</p>;
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Vehículo</th>
          <th>Km Actual</th>
          <th>Calendario PRT Chile</th>
          <th>Documentación</th>
          <th>Mantención Preventiva</th>
          {esAdmin && <th>Acciones</th>}
        </tr>
      </thead>
      <tbody>
        {vehiculos.map((v) => {
          const doc = v.estado_documentacion;
          const mant = v.estado_mantencion;

          return (
            <tr key={v.id}>
              <td>
                <strong>{v.patente}</strong>
                <div className="subtexto">{v.marca} {v.modelo} ({v.tipo_vehiculo})</div>
              </td>
              <td>{Number(v.kilometraje_actual).toLocaleString("es-CL")} km</td>
              <td>{v.mes_prt_sugerido}</td>
              <td>
                {doc ? (
                  <div>
                    <span className={badgeClase(doc.global)}>{doc.global.replace("_", " ")}</span>
                    <div className="subtexto">
                      PRT: {v.vencimiento_prt || "S/F"} | Permiso: {v.vencimiento_permiso_circulacion || "S/F"}
                    </div>
                  </div>
                ) : "—"}
              </td>
              <td>
                {mant ? (
                  <div>
                    <span className={badgeClase(mant.alerta)}>
                      {mant.alerta === "VENCIDA"
                        ? `Excedida (${Math.abs(mant.km_restantes)} km)`
                        : `Faltan ${mant.km_restantes.toLocaleString("es-CL")} km`}
                    </span>
                    <div className="subtexto">Próx: {mant.proximo_km_objetivo.toLocaleString("es-CL")} km</div>
                  </div>
                ) : "—"}
              </td>
              {esAdmin && (
                <td>
                  <button onClick={() => onEditar(v)}>Editar</button>
                  <button onClick={() => onEliminar(v)}>Eliminar</button>
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}