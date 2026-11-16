import CargaCombustibleForm from "./CargaCombustibleForm";
import { cargasCombustibleApi } from "../api/client";

const formatoCLP = (valor) =>
  Number(valor || 0).toLocaleString("es-CL", { style: "currency", currency: "CLP" });

export default function CombustibleSection({ vehiculos, cargas, onGuardado }) {
  const handleEliminar = async (c) => {
    if (!window.confirm(`¿Eliminar la carga de ${c.litros_cargados}L del vehículo ${c.patente_vehiculo}?`)) {
      return;
    }
    try {
      await cargasCombustibleApi.eliminar(c.id);
      onGuardado();
    } catch {
      alert("No se pudo eliminar el registro de combustible.");
    }
  };

  return (
    <section>
      <CargaCombustibleForm vehiculos={vehiculos} onCargaGuardada={onGuardado} />

      {!cargas || cargas.length === 0 ? (
        <p className="aviso">No hay cargas de combustible registradas todavía.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Vehículo</th>
              <th>Litros</th>
              <th>Costo Total / Valor Litro</th>
              <th>Odómetro</th>
              <th>Rendimiento Calculado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargas.map((c) => {
              const fechaCorta = new Date(c.fecha_carga).toLocaleString("es-CL", {
                dateStyle: "short",
                timeStyle: "short",
              });

              return (
                <tr key={c.id}>
                  <td>{fechaCorta}</td>
                  <td><strong>{c.patente_vehiculo}</strong></td>
                  <td>{Number(c.litros_cargados).toLocaleString("es-CL")} L</td>
                  <td>
                    <strong>{formatoCLP(c.costo_total_clp)}</strong>
                    {c.precio_litro_clp && (
                      <div className="subtexto">{formatoCLP(c.precio_litro_clp)} / L</div>
                    )}
                  </td>
                  <td>{Number(c.kilometraje_al_cargar).toLocaleString("es-CL")} km</td>
                  <td>
                    {c.rendimiento_kml !== null && c.rendimiento_kml !== undefined ? (
                      <span className="badge badge-verde">
                        {Number(c.rendimiento_kml).toLocaleString("es-CL")} km/L
                      </span>
                    ) : (
                      <span className="badge badge-gris">Carga base</span>
                    )}
                  </td>
                  <td>
                    <button onClick={() => handleEliminar(c)}>Eliminar</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </section>
  );
}