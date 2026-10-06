import { useCallback, useEffect, useState } from "react";
import { vehiculosApi } from "./api/client";
import VehiculoList from "./components/VehiculoList";
import VehiculoForm from "./components/VehiculoForm";
import "./App.css";

export default function App() {
  const [vehiculos, setVehiculos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [editando, setEditando] = useState(null);

  const cargar = useCallback(async () => {
    try {
      setError(null);
      setCargando(true);
      const datos = await vehiculosApi.listar();
      setVehiculos(datos.results ?? datos);
    } catch (e) {
      setError("No se pudo cargar la lista de vehículos. ¿Está encendido Django?");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const handleGuardado = () => {
    setEditando(null);
    cargar();
  };

  const handleEliminar = async (v) => {
    if (!window.confirm(`¿Eliminar el vehículo patente "${v.patente}"?`)) return;
    try {
      await vehiculosApi.eliminar(v.id);
      cargar();
    } catch (e) {
      setError("No se pudo eliminar el vehículo.");
    }
  };

  return (
    <main className="contenedor">
      <h1>Gestión de Flota y Control de Vehículos</h1>

      <VehiculoForm
        vehiculo={editando}
        onGuardado={handleGuardado}
        onCancelar={() => setEditando(null)}
      />

      {cargando && <p className="aviso">Cargando flota...</p>}
      {error && <p className="aviso error">{error}</p>}
      {!cargando && !error && (
        <VehiculoList
          vehiculos={vehiculos}
          onEditar={setEditando}
          onEliminar={handleEliminar}
        />
      )}
    </main>
  );
}