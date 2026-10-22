import RiccatiLogo from "../components/RiccatiLogo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

function Login() {
  const [visible, setVisible] = useState(false);
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
    } catch {
      setError(
        "No se pudo conectar con el servidor."
      );
    } finally {
      setCargando(false);
    }
  };

  return <main className="rp-auth">
    <div className="rp-auth-theme"><ThemeToggle/></div>
    <div className="authentication-wrapper authentication-basic">
      <div className="authentication-inner">
        <section className="card rp-auth-card" aria-labelledby="login-heading">
          <div className="card-body">
            <div className="rp-auth-brand"><RiccatiLogo full/><span className="rp-product-name">Project Hub</span></div>
            <h1 id="login-heading">Bienvenido a Riccati</h1>
            <p className="rp-auth-description">Ingresa para continuar con tus proyectos.</p>
            <form onSubmit={iniciarSesion} aria-busy={cargando}>
              <p className="rp-required-note">Los campos con * son obligatorios.</p>
              <div className="mb-4"><label htmlFor="login-correo" className="form-label">Correo electrónico <span aria-hidden="true">*</span></label><input id="login-correo" name="correo" type="email" className="form-control" placeholder="correo@riccati.cr" autoComplete="username" value={correo} onChange={e => setCorreo(e.target.value)} required disabled={cargando}/></div>
              <div className="mb-4"><label htmlFor="login-password" className="form-label">Contraseña <span aria-hidden="true">*</span></label><div className="rp-password"><input id="login-password" name="password" type={visible ? "text" : "password"} className="form-control" placeholder="Ingresa tu contraseña" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} required disabled={cargando}/><button type="button" className="rp-icon-button" onClick={() => setVisible(!visible)} aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"} aria-pressed={visible}>{visible ? <EyeOff size={19}/> : <Eye size={19}/>}</button></div></div>
              {error && <div className="rp-auth-error" role="alert">{error}</div>}
              <button type="submit" className="btn btn-primary w-100 rp-auth-submit" disabled={cargando}>{cargando ? "Verificando acceso…" : "Iniciar sesión"}</button>
              <span className="visually-hidden" role="status">{cargando ? "Verificando acceso" : ""}</span>
            </form>
          </div>
        </section>
        <p className="rp-auth-caption">Gestión centralizada de proyectos arquitectónicos</p>
      </div>
    </div>
  </main>;
}

export default Login;
