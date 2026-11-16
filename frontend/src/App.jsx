
import { useCallback, useEffect, useState } from "react";

import {
  authApi,
  dashboardApi,
  vehiculosApi,
  cargasCombustibleApi,
  mantencionesApi,
  talleresApi,
  conductoresApi,
  viajesApi,
  obtenerToken,
} from "./api/client";

import LoginForm from "./components/LoginForm";
import DashboardSection from "./components/DashboardSection";
import VehiculoList from "./components/VehiculoList";
import VehiculoForm from "./components/VehiculoForm";
import CombustibleSection from "./components/CombustibleSection";
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

  // Verifica si existe un token antes de mostrar la aplicación.
  const [verificandoSesion, setVerificandoSesion] = useState(
    () => Boolean(obtenerToken())
  );

  // Módulo activo
  const [vistaActiva, setVistaActiva] = useState("dashboard");

  // Información del dashboard
  const [kpis, setKpis] = useState(null);

  // Información de los módulos
  const [vehiculos, setVehiculos] = useState([]);
  const [cargas, setCargas] = useState([]);
  const [mantenciones, setMantenciones] = useState([]);
  const [talleres, setTalleres] = useState([]);
  const [conductores, setConductores] = useState([]);
  const [viajes, setViajes] = useState([]);

  // Estados de interfaz
  const [cargando, setCargando] = useState(
    () => Boolean(obtenerToken())
  );

  const [error, setError] = useState(null);

  // Vehículo seleccionado para edición
  const [editandoVehiculo, setEditandoVehiculo] = useState(null);


  // =====================================================
  // 2. CIERRE DE SESIÓN
  // =====================================================

  const cerrarSesion = useCallback(() => {

    authApi.logout();

    // Limpiar usuario
    setUsuario(null);

    // Limpiar información del sistema
    setKpis(null);
    setVehiculos([]);
    setCargas([]);
    setMantenciones([]);
    setTalleres([]);
    setConductores([]);
    setViajes([]);

    // Limpiar estados de interfaz
    setEditandoVehiculo(null);
    setError(null);
    setCargando(false);

  }, []);


  // =====================================================
  // 3. VALIDACIÓN DE SESIÓN
  // =====================================================

  useEffect(() => {

    // Si no existe token, el estado inicial ya indica
    // que no hay una sesión que verificar.
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

    // Evitar actualizar estados si el componente se desmonta.
    return () => {
      cancelado = true;
    };

  }, [cerrarSesion]);


  // =====================================================
  // 4. CONSULTA CENTRALIZADA DE DATOS
  // =====================================================

  // Esta función consulta todos los endpoints del sistema.
  // No modifica directamente los estados de React.

  const consultarDatos = useCallback(async () => {

    const [
      dataKpis,
      dataVehiculos,
      dataCargas,
      dataMantenciones,
      dataTalleres,
      dataConductores,
      dataViajes,
    ] = await Promise.all([

      dashboardApi.obtenerKpis(),
      vehiculosApi.listar(),
      cargasCombustibleApi.listar(),
      mantencionesApi.listar(),
      talleresApi.listar(),
      conductoresApi.listar(),
      viajesApi.listar(),

    ]);

    return {
      kpis: dataKpis,
      vehiculos: dataVehiculos.results ?? dataVehiculos,
      cargas: dataCargas.results ?? dataCargas,
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

    // Esperar a que exista una sesión válida.
    if (!usuario) return;

    let cancelado = false;

    const cargarDatosIniciales = async () => {

      try {

        // Consultar todos los endpoints.
        const datos = await consultarDatos();

        if (cancelado) return;

        // Actualizar los estados con la información recibida.
        setKpis(datos.kpis);
        setVehiculos(datos.vehiculos);
        setCargas(datos.cargas);
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

  // Se ejecuta después de registrar, editar o eliminar
  // información en cualquiera de los módulos.

  const cargarTodo = useCallback(async () => {

    if (!usuario) return;

    setError(null);
    setCargando(true);

    try {

      const datos = await consultarDatos();

      setKpis(datos.kpis);
      setVehiculos(datos.vehiculos);
      setCargas(datos.cargas);
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

    // Al actualizar usuario, se ejecutará la carga inicial.
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


      {/* ================================================
          ENCABEZADO Y USUARIO
         ================================================ */}

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


      {/* ================================================
          ALERTAS PREVENTIVAS
         ================================================ */}

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


      {/* ================================================
          NAVEGACIÓN ENTRE MÓDULOS
         ================================================ */}

      <nav
        className="tabs"
        style={{ flexWrap: "wrap" }}
      >

        <button
          className={
            vistaActiva === "dashboard" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("dashboard")}
        >
          Dashboard KPIs
        </button>

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
            vistaActiva === "combustible" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("combustible")}
        >
          2. Combustible ({cargas.length})
        </button>

        <button
          className={
            vistaActiva === "rutas" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("rutas")}
        >
          3. Rutas y Conductores ({viajes.length})
        </button>

        <button
          className={
            vistaActiva === "mantenciones" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("mantenciones")}
        >
          4. Mantenciones ({mantenciones.length})
        </button>

        <button
          className={
            vistaActiva === "talleres" ? "tab-activa" : ""
          }
          onClick={() => setVistaActiva("talleres")}
        >
          5. Talleres ({talleres.length})
        </button>

      </nav>


      {/* ================================================
          INDICADORES DE CARGA Y ERRORES
         ================================================ */}

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


      {/* ================================================
          MÓDULO 0: DASHBOARD DE INDICADORES
         ================================================ */}

      {!cargando && !error && vistaActiva === "dashboard" && (

        <DashboardSection
          kpis={kpis}
        />

      )}


      {/* ================================================
          MÓDULO 1: FLOTA Y DOCUMENTACIÓN
         ================================================ */}

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


      {/* ================================================
          MÓDULO 2: COMBUSTIBLE
         ================================================ */}

      {!cargando && !error && vistaActiva === "combustible" && (

        <CombustibleSection
          vehiculos={vehiculos}
          cargas={cargas}
          onGuardado={cargarTodo}
        />

      )}


      {/* ================================================
          MÓDULO 3: RUTAS Y CONDUCTORES
         ================================================ */}

      {!cargando && !error && vistaActiva === "rutas" && (

        <RutasConductoresSection
          vehiculos={vehiculos}
          conductores={conductores}
          viajes={viajes}
          esAdmin={usuario.es_admin}
          onGuardado={cargarTodo}
        />

      )}


      {/* ================================================
          MÓDULO 4: MANTENCIONES
         ================================================ */}

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


      {/* ================================================
          MÓDULO 5: TALLERES ASOCIADOS
         ================================================ */}

      {!cargando && !error && vistaActiva === "talleres" && (

        <TallerSection
          talleres={talleres}
          esAdmin={usuario.es_admin}
          onGuardado={cargarTodo}
        />

      )}

    </main>
  );
}
