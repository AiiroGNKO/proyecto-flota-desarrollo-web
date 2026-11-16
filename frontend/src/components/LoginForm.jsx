import { useState } from "react";
import { authApi } from "../api/client";

export default function LoginForm({ onLoginExitoso }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const usuario = await authApi.login(username.trim(), password);
      onLoginExitoso(usuario);
    } catch (err) {
      if (err.status === 401 || err.status === 400) {
        setError(err.detalle?.detail || "Usuario o contraseña incorrectos.");
      } else {
        setError("No se pudo conectar con el servidor de autenticación.");
      }
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="login-wrapper">
      <form className="formulario login-card" onSubmit={handleSubmit}>
        <h2>Acceso al Sistema de Flota</h2>
        <p className="subtexto">Ingresa tus credenciales registradas en la plataforma.</p>

        <label>
          Usuario
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ej: admin"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        {error && <p className="aviso error">{error}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? "Verificando..." : "Iniciar Sesión"}
        </button>
      </form>
    </div>
  );
}