const formatoCLP = (valor) =>
  Number(valor || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" });

export default function MantencionList({ mantenciones, onEliminar }) {
  if (!mantenciones || mantenciones.length === 0) {
    return <p className="aviso">No hay mantenciones registradas en la bitácora.</p>;
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Vehículo</th>
          <th>Tipo</th>
          <th>Km Servicio</th>
          <th>Detalle y Taller</th>
          <th>Desglose Costos (CLP)</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {mantenciones.map((m) => (
          <tr key={m.id}>
            <td>{m.fecha}</td>
            <td>
              <strong>{m.patente_vehiculo}</strong>
              <div className="subtexto">{m.marca_modelo}</div>
            </td>
            <td>
              <span className={m.tipo === "PREVENTIVA" ? "badge badge-verde" : "badge badge-amarillo"}>
                {m.tipo}
              </span>
            </td>
            <td>
              {Number(m.kilometraje_realizado).toLocaleString("es-CL")} km
              {m.proximo_kilometraje && (
                <div className="subtexto">Próx: {Number(m.proximo_kilometraje).toLocaleString("es-CL")} km</div>
              )}
            </td>
            <td>
              <div>{m.descripcion}</div>
              <div className="subtexto">Taller: {m.nombre_taller}</div>
            </td>
            <td>
              <strong>Total: {formatoCLP(m.costo_total_clp)}</strong>
              <div className="subtexto">
                Repuestos: {formatoCLP(m.costo_repuestos_clp)} | M. Obra: {formatoCLP(m.costo_mano_obra_clp)}
              </div>
            </td>
            <td>
              <button onClick={() => onEliminar(m)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}