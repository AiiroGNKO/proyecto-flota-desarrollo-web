const BASE = "/api";
const TOKEN_KEY = "flota_access_token";

export const obtenerToken = () => localStorage.getItem(TOKEN_KEY);
export const guardarToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const limpiarToken = () => localStorage.removeItem(TOKEN_KEY);

async function request(ruta, opciones = {}) {
  const { headers, ...resto } = opciones;
  const token = obtenerToken();

  const cabeceras = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const respuesta = await fetch(BASE + ruta, {
    ...resto,
    headers: cabeceras,
  });

  if (!respuesta.ok) {
    let detalle = null;
    try {
      detalle = await respuesta.json();
    } catch {
      // Sin cuerpo JSON
    }
    const error = new Error("Error " + respuesta.status);
    error.status = respuesta.status;
    error.detalle = detalle;
    throw error;
  }

  if (respuesta.status === 204) return null;
  return respuesta.json();
}

export const authApi = {
  login: async (username, password) => {
    const data = await request("/auth/login/", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    guardarToken(data.access);
    return data.usuario;
  },
  me: () => request("/auth/me/"),
  logout: () => {
    limpiarToken();
  },
};

export const vehiculosApi = {
  listar: () => request("/vehiculos/"),
  crear: (datos) => request("/vehiculos/", { method: "POST", body: JSON.stringify(datos) }),
  actualizar: (id, datos) => request("/vehiculos/" + id + "/", { method: "PUT", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/vehiculos/" + id + "/", { method: "DELETE" }),
};

export const talleresApi = {
  listar: () => request("/talleres/"),
  crear: (datos) => request("/talleres/", { method: "POST", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/talleres/" + id + "/", { method: "DELETE" }),
};

export const cargasCombustibleApi = {
  listar: () => request("/cargas-combustible/"),
  crear: (datos) => request("/cargas-combustible/", { method: "POST", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/cargas-combustible/" + id + "/", { method: "DELETE" }),
};

export const mantencionesApi = {
  listar: () => request("/mantenciones/"),
  crear: (datos) => request("/mantenciones/", { method: "POST", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/mantenciones/" + id + "/", { method: "DELETE" }),
};

export const conductoresApi = {
  listar: () => request("/conductores/"),
  crear: (datos) => request("/conductores/", { method: "POST", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/conductores/" + id + "/", { method: "DELETE" }),
};

export const viajesApi = {
  listar: () => request("/viajes/"),
  crear: (datos) => request("/viajes/", { method: "POST", body: JSON.stringify(datos) }),
  eliminar: (id) => request("/viajes/" + id + "/", { method: "DELETE" }),
};

export const dashboardApi = {
  obtenerKpis: () => request("/dashboard/kpis/"),
};