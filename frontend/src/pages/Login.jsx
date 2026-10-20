import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [correo, setCorreo] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const navigate = useNavigate();

  const iniciarSesion = async (e) => {
    e.preventDefault();

    setError("");
    setCargando(true);

    try {
      const respuesta = await fetch(
        "http://localhost:3000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            correo,
            password,
          }),
        }
      );

      const datos = await respuesta.json();

      if (!respuesta.ok) {
        setError(
          datos.mensaje ||
            "No fue posible iniciar sesión."
        );

        return;
      }

      localStorage.setItem(
        "tokenRiccati",
        datos.token
      );

      localStorage.setItem(
        "usuarioRiccati",
        JSON.stringify(datos.usuario)
      );

      navigate("/dashboard");
    } catch (error) {
      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="login-page">

      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-container">

        <div className="login-card">

          <div className="login-brand">

            <div className="login-logo">
              R
            </div>

            <h1>
              Riccati <span>Project Hub</span>
            </h1>

            <span>
              PROJECT MANAGEMENT
            </span>

            <p className="login-description">
              Gestión centralizada de proyectos arquitectónicos
            </p>

          </div>

          <form onSubmit={iniciarSesion}>

            <div className="login-form-group">

              <label>
                Correo electrónico
              </label>

              <input
                type="email"
                className="login-input"
                placeholder="correo@riccati.cr"
                value={correo}
                onChange={(e) =>
                  setCorreo(e.target.value)
                }
                required
              />

            </div>

            <div className="login-form-group">

              <label>
                Contraseña
              </label>

              <input
                type="password"
                className="login-input"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                required
              />

            </div>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="login-button"
              disabled={cargando}
            >
              {cargando
                ? "Verificando acceso..."
                : "Iniciar sesión"}
            </button>

          </form>

          <div className="login-footer">

            <span className="login-online-dot"></span>

            Riccati Project Hub · Sistema disponible

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;