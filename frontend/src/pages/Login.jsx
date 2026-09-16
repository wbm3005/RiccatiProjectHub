import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const respuesta = await fetch("http://localhost:3000/api/usuarios");
      const usuarios = await respuesta.json();

      const usuarioEncontrado = usuarios.find(
        (usuario) =>
          usuario.correo === correo &&
          usuario.password === password &&
          usuario.estado === "Activo"
      );

      if (usuarioEncontrado) {
        const usuarioSesion = {
          id: usuarioEncontrado.id,
          nombre: usuarioEncontrado.nombre,
          correo: usuarioEncontrado.correo,
          rol: usuarioEncontrado.rol,
        };

        localStorage.setItem(
          "usuarioRiccati",
          JSON.stringify(usuarioSesion)
        );

        navigate("/dashboard");
      } else {
        setError("Correo o contraseña incorrectos.");
      }
    } catch (error) {
      setError("No se pudo conectar con el servidor.");
    }
  };

  return (
    <div className="login-page">

      <div className="login-glow glow-one"></div>
      <div className="login-glow glow-two"></div>

      <div className="login-wrapper">

        <section className="login-brand-panel">

          <div className="login-brand">

            <div className="login-logo">
              R
            </div>

            <div>
              <h1>Riccati</h1>
              <span>PROJECT HUB</span>
            </div>

          </div>

          <div className="login-hero-content">

            <span className="login-eyebrow">
              GESTIÓN ARQUITECTÓNICA
            </span>

            <h2>
              Tus proyectos.
              <br />
              Una sola plataforma.
            </h2>

            <p>
              Centraliza clientes, proyectos, seguimiento,
              documentos y control financiero en un entorno
              moderno y seguro.
            </p>

            <div className="login-features">

              <div className="login-feature">
                <span className="feature-dot"></span>
                Gestión centralizada
              </div>

              <div className="login-feature">
                <span className="feature-dot"></span>
                Trazabilidad de proyectos
              </div>

              <div className="login-feature">
                <span className="feature-dot"></span>
                Información en tiempo real
              </div>

            </div>

          </div>

          <div className="login-footer">
            Riccati Project Hub · 2026
          </div>

        </section>

        <section className="login-form-panel">

          <div className="login-card">

            <div className="login-card-header">

              <div className="login-mini-logo">
                R
              </div>

              <div>
                <span className="login-system-label">
                  ACCESO AL SISTEMA
                </span>

                <h3>Bienvenido de nuevo</h3>

                <p>
                  Ingresa tus credenciales para continuar.
                </p>
              </div>

            </div>

            <form onSubmit={iniciarSesion}>

              <div className="login-input-group">
                <label>Correo electrónico</label>

                <input
                  type="email"
                  placeholder="correo@riccati.cr"
                  value={correo}
                  onChange={(e) => setCorreo(e.target.value)}
                  required
                />
              </div>

              <div className="login-input-group">
                <label>Contraseña</label>

                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="login-error">
                  <span>!</span>
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-button"
              >
                <span>Iniciar sesión</span>
                <span className="login-arrow">→</span>
              </button>

            </form>

            <div className="login-security">

              <span className="security-dot"></span>

              Conexión protegida · Riccati Project Hub

            </div>

          </div>

        </section>

      </div>

    </div>
  );
}

export default Login;