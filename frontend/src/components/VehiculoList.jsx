export default function VehiculoList({ vehiculos, onEditar, onEliminar }) {
  if (!vehiculos || vehiculos.length === 0) {
    return <p className="aviso">Aún no hay vehículos registrados en la flota.</p>;
  }

  return (
    <table className="tabla">
      <thead>
        <tr>
          <th>Patente</th>
          <th>Marca / Modelo</th>
          <th>Estanque (L)</th>
          <th>Km Actual</th>
          <th>Estado</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody>
        {vehiculos.map((v) => (
          <tr key={v.id}>
            <td><strong>{v.patente}</strong></td>
            <td>{v.marca} {v.modelo}</td>
            <td>{Number(v.capacidad_estanque_litros).toFixed(1)} L</td>
            <td>{Number(v.kilometraje_actual).toLocaleString("es-CL")} km</td>
            <td>{v.activo ? "Operativo" : "En Mantención"}</td>
            <td>
              <button onClick={() => onEditar(v)}>Editar</button>
              <button onClick={() => onEliminar(v)}>Eliminar</button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}