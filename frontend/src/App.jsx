
import { useCallback, useEffect, useState } from "react";

import {
  authApi,
  vehiculosApi,
  mantencionesApi,
  talleresApi,
  conductoresApi,
  viajesApi,
  obtenerToken,
} from "./api/client";

import LoginForm from "./components/LoginForm";
import VehiculoList from "./components/VehiculoList";
import VehiculoForm from "./components/VehiculoForm";
import MantencionList from "./components/MantencionList";
import MantencionForm from "./components/MantencionForm";
import TallerSection from "./components/TallerSection";
import RutasConductoresSection from "./components/RutasConductoresSection";

import "./App.css";

export default function App() {

  // =====================================================
  // 1. ESTADOS PRINCIPALES
  // =====================================================

  const [usuario, setUsuario] = useState(null);

  const [verificandoSesion, setVerificandoSesion] = useState(
    () => Boolean(obtenerToken())
  );

  const [vistaActiva, setVistaActiva] = useState("vehiculos");

  const [vehiculos, setVehiculos] = useState([]);
  const [mantenciones, setMantenciones] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [viajes, setViajes] = useState([]);

  const [cargando, setCargando] = useState(
    () => Boolean(obtenerToken())
  );

  const [error, setError] = useState(null);
  const [editandoVehiculo, setEditandoVehiculo] = useState(null);


  // =====================================================
  // 2. CIERRE DE SESIÓN
  // =====================================================

  const cerrarSesion = useCallback(() => {
    authApi.logout();

    setUsuario(null);

    setVehiculos([]);
    setMantenciones([]);
    setTalleres([]);
    setConductores([]);
    setViajes([]);

    setEditandoVehiculo(null);

    setError(null);
    setCargando(false);
  }, []);


  // =====================================================
  // 3. VALIDACIÓN DE SESIÓN
  // =====================================================

  useEffect(() => {

    if (!obtenerToken()) return;

    let cancelado = false;

    const validarSesion = async () => {
      try {
        const perfil = await authApi.me();

        if (!cancelado) {
          setUsuario(perfil);
        }

      } catch {
        if (!cancelado) {
          cerrarSesion();
        }

      } finally {
        if (!cancelado) {
          setVerificandoSesion(false);
        }
      }
    };

    validarSesion();

    return () => {
      cancelado = true;
    };

  }, [cerrarSesion]);


  // =====================================================
  // 4. CONSULTA DE DATOS A LA API
  // =====================================================

  const consultarDatos = useCallback(async () => {

    const [
      dataVehiculos,
      dataMantenciones,
      dataTalleres,
      dataConductores,
      dataViajes,
    ] = await Promise.all([
      vehiculosApi.listar(),
      mantencionesApi.listar(),
      talleresApi.listar(),
      conductoresApi.listar(),
      viajesApi.listar(),
    ]);

    return {
      vehiculos: dataVehiculos.results ?? dataVehiculos,
      mantenciones: dataMantenciones.results ?? dataMantenciones,
      talleres: dataTalleres.results ?? dataTalleres,
      conductores: dataConductores.results ?? dataConductores,
      viajes: dataViajes.results ?? dataViajes,
    };

  }, []);


  // =====================================================
  // 5. CARGA INICIAL DE INFORMACIÓN
  // =====================================================

  useEffect(() => {

    if (!usuario) return;

    let cancelado = false;

    const cargarDatosIniciales = async () => {
      try {
        const datos = await consultarDatos();

        if (cancelado) return;

        setVehiculos(datos.vehiculos);
        setMantenciones(datos.mantenciones);
        setTalleres(datos.talleres);
        setConductores(datos.conductores);
        setViajes(datos.viajes);

        setError(null);

      } catch (err) {
        if (cancelado) return;

        if (err?.status === 401) {
          cerrarSesion();
        } else {
          setError(
            "Error de conexión con Django. Verifica que el servidor esté ejecutándose."
          );
        }

      } finally {
        if (!cancelado) {
          setCargando(false);
        }
      }
    };

    cargarDatosIniciales();

    return () => {
      cancelado = true;
    };

  }, [usuario, consultarDatos, cerrarSesion]);


  // =====================================================
  // 6. RECARGA DE INFORMACIÓN
  // =====================================================

  const cargarTodo = useCallback(async () => {

    if (!usuario) return;

    setError(null);
    setCargando(true);

    try {
      const datos = await consultarDatos();

      setVehiculos(datos.vehiculos);
      setMantenciones(datos.mantenciones);
      setTalleres(datos.talleres);
      setConductores(datos.conductores);
      setViajes(datos.viajes);

    } catch (err) {

      if (err?.status === 401) {
        cerrarSesion();
      } else {
        setError(
          "Error de conexión con Django. Verifica que el servidor esté ejecutándose."
        );
      }

    } finally {
      setCargando(false);
    }

  }, [usuario, consultarDatos, cerrarSesion]);


  // =====================================================
  // 7. INICIO DE SESIÓN
  // =====================================================

  const handleLoginExitoso = (user) => {
    setError(null);
    setCargando(true);
    setUsuario(user);
  };


  // =====================================================
  // 8. OPERACIONES SOBRE VEHÍCULOS
  // =====================================================

  const handleVehiculoGuardado = () => {
    setEditandoVehiculo(null);
    cargarTodo();
  };

  const handleEliminarVehiculo = async (vehiculo) => {

    const confirmar = window.confirm(
      `¿Eliminar el vehículo patente "${vehiculo.patente}"?`
    );

    if (!confirmar) return;

    try {
      await vehiculosApi.eliminar(vehiculo.id);
      await cargarTodo();

    } catch (err) {

      if (err?.status === 401) {
        cerrarSesion();
      } else {
        setError("No se pudo eliminar el vehículo.");
      }
    }
  };


  // =====================================================
  // 9. OPERACIONES SOBRE MANTENCIONES
  // =====================================================

  const handleEliminarMantencion = async (mantencion) => {

    const confirmar = window.confirm(
      `¿Eliminar la mantención del ${mantencion.fecha} para ${mantencion.patente_vehiculo}?`
    );

    if (!confirmar) return;

    try {
      await mantencionesApi.eliminar(mantencion.id);
      await cargarTodo();

    } catch (err) {

      if (err?.status === 401) {
        cerrarSesion();
      } else {
        setError("No se pudo eliminar la mantención.");
      }
    }
  };


  // =====================================================
  // 10. VERIFICACIÓN DE SESIÓN
  // =====================================================

  if (verificandoSesion) {
    return (
      <main className="contenedor">
        <p className="aviso">
          Verificando credenciales...
        </p>
      </main>
    );
  }


  // =====================================================
  // 11. VISTA DE INICIO DE SESIÓN
  // =====================================================

  if (!usuario) {
    return (
      <main className="contenedor">

        <h1>
          Gestor Administrativo de Flota y Combustible
        </h1>

        <LoginForm
          onLoginExitoso={handleLoginExitoso}
        />

      </main>
    );
  }


  // =====================================================
  // 12. ALERTAS DE MANTENCIÓN PREVENTIVA
  // =====================================================

  const alertasPreventivas = vehiculos.filter(
    (v) =>
      v.estado_mantencion &&
      v.estado_mantencion.alerta !== "OK"
  );


  // =====================================================
  // 13. INTERFAZ PRINCIPAL
  // =====================================================

  return (
    <main className="contenedor">

      {/* ENCABEZADO */}

      <header className="topbar">

        <div>
          <h1>
            Gestor Administrativo de Flota y Combustible
          </h1>
        </div>

        <div className="user-info">

          <span>
            Usuario: <strong>{usuario.username}</strong>{" "}

            <span
              className={
                usuario.es_admin
                  ? "badge badge-verde"
                  : "badge badge-amarillo"
              }
            >
              {usuario.rol}
            </span>
          </span>

          <button onClick={cerrarSesion}>
            Cerrar sesión
          </button>

        </div>

      </header>


      {/* ALERTAS PREVENTIVAS */}

      {alertasPreventivas.length > 0 && (
        <div className="aviso error">

          <strong>
            Alertas de Mantención Preventiva (
            {alertasPreventivas.length}):
          </strong>{" "}

          {alertasPreventivas
            .map(
              (v) =>
                `${v.patente} (${v.estado_mantencion.alerta})`
            )
            .join(" | ")}

        </div>
      )}


      {/* NAVEGACIÓN ENTRE MÓDULOS */}

      <nav className="tabs">

        <button
          className={
            vistaActiva === "vehiculos" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("vehiculos")}
        >
          1. Flota y Documentación ({vehiculos.length})
        </button>

        <button
          className={
            vistaActiva === "mantenciones" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("mantenciones")}
        >
          2. Bitácora de Mantenciones ({mantenciones.length})
        </button>

        <button
          className={
            vistaActiva === "talleres" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("talleres")}
        >
          3. Talleres Asociados ({talleres.length})
        </button>

        <button
          className={
            vistaActiva === "rutas" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("rutas")}
        >
          4. Rutas y Conductores ({viajes.length})
        </button>

      </nav>


      {/* INDICADORES DE CARGA Y ERRORES */}

      {cargando && (
        <p className="aviso">
          Sincronizando datos de la flota...
        </p>
      )}

      {error && (
        <p className="aviso error">
          {error}
        </p>
      )}


      {/* =================================================
          MÓDULO 1: VEHÍCULOS
         ================================================= */}

      {!cargando && !error && vistaActiva === "vehiculos" && (
        <section>

          {usuario.es_admin ? (
            <VehiculoForm
              key={editandoVehiculo?.id ?? "nuevo"}
              vehiculo={editandoVehiculo}
              onGuardado={handleVehiculoGuardado}
              onCancelar={() => setEditandoVehiculo(null)}
            />
          ) : (
            <p className="aviso">
              Modo Operador: visualización de flota activa
              (alta/edición solo Administrador).
            </p>
          )}

          <VehiculoList
            vehiculos={vehiculos}
            esAdmin={usuario.es_admin}
            onEditar={setEditandoVehiculo}
            onEliminar={handleEliminarVehiculo}
          />

        </section>
      )}


      {/* =================================================
          MÓDULO 2: MANTENCIONES
         ================================================= */}

      {!cargando && !error && vistaActiva === "mantenciones" && (
        <section>

          <MantencionForm
            vehiculos={vehiculos}
            talleres={talleres}
            onGuardado={cargarTodo}
          />

          <MantencionList
            mantenciones={mantenciones}
            onEliminar={handleEliminarMantencion}
          />

        </section>
      )}


      {/* =================================================
          MÓDULO 3: TALLERES ASOCIADOS
         ================================================= */}

      {!cargando && !error && vistaActiva === "talleres" && (
        <TallerSection
          talleres={talleres}
          esAdmin={usuario.es_admin}
          onGuardado={cargarTodo}
        />
      )}


      {/* =================================================
          MÓDULO 4: RUTAS Y CONDUCTORES
         ================================================= */}

      {!cargando && !error && vistaActiva === "rutas" && (
        <RutasConductoresSection
          vehiculos={vehiculos}
          conductores={conductores}
          viajes={viajes}
          esAdmin={usuario.es_admin}
          onGuardado={cargarTodo}
        />
      )}

    </main>
  );
}
