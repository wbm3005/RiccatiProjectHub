import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, KeyRound, ShieldCheck, LockKeyhole } from "lucide-react";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import { cambiarMiPassword, cerrarSesionLocal } from "../services/authService";

const inicial = {
  passwordActual: "",
  passwordNueva: "",
  confirmarPassword: "",
};

function Perfil() {
  const navigate = useNavigate();
  const [formulario, setFormulario] = useState(inicial);
  const [visible, setVisible] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState("");

  let usuario = null;
  try {
    usuario = JSON.parse(localStorage.getItem("usuarioRiccati"));
  } catch {
    usuario = null;
  }

  const actualizar = (evento) => {
    setFormulario((antes) => ({ ...antes, [evento.target.name]: evento.target.value }));
  };

  const guardar = async (evento) => {
    evento.preventDefault();
    setError("");
    setExito("");
    if (formulario.passwordNueva !== formulario.confirmarPassword) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/.test(formulario.passwordNueva)) {
      setError("La nueva contraseña debe tener 8 caracteres como mínimo, mayúscula, minúscula, número y carácter especial.");
      return;
    }

    setGuardando(true);
    try {
      const resultado = await cambiarMiPassword(formulario);
      setFormulario(inicial);
      setExito(resultado.mensaje);
      cerrarSesionLocal();
      // La versión del token anterior deja de ser válida al cambiar la contraseña.
      // La navegación espera a que la persona pulse el botón visible.
    } catch (fallo) {
      setError(fallo.message);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <RiccatiLayout paginaActiva="perfil">
      <PageHeader
        modulo="CONFIGURACIÓN · MI CUENTA"
        titulo="Mi cuenta"
        descripcion="Consulta tus datos y actualiza tu contraseña de acceso."
        estado="Configuración de seguridad"
      />

      <div style={{ maxWidth: 850, display: "grid", gap: 20 }}>
        <section className="riccati-panel" style={{ padding: "24px 28px" }}>
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            <div className="riccati-user-avatar" style={{ width: 58, height: 58, fontSize: 23, flexShrink: 0 }}>
              {usuario?.nombre?.charAt(0) || "U"}
            </div>
            <div>
              <h3 style={{ margin: "0 0 7px", fontSize: 21 }}>
                {usuario?.nombre} {usuario?.apellidos}
              </h3>
              <p style={{ margin: 0, fontSize: 14 }}>{usuario?.correo}</p>
              <span className="riccati-badge riccati-badge-cyan" style={{ marginTop: 10 }}>
                <ShieldCheck size={14} /> {usuario?.rol}
              </span>
            </div>
          </div>
        </section>

        <section className="riccati-panel" style={{ padding: "26px 28px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 22 }}>
            <KeyRound size={25} color="#67dafa" aria-hidden="true" />
            <div>
              <h3 style={{ margin: 0, fontSize: 20 }}>Cambiar contraseña</h3>
              <p style={{ margin: "6px 0 0", fontSize: 13 }}>
                Para mayor seguridad, deberás volver a iniciar sesión al guardarla.
              </p>
            </div>
          </div>

          {error && <div className="login-error" role="alert" style={{ marginBottom: 16 }}>{error}</div>}
          {exito && (
            <div style={{ padding: 15, border: "1px solid #30d5a355", color: "#6bf0bd", borderRadius: 12, marginBottom: 18 }} role="status">
              {exito}
              <div style={{ marginTop: 15 }}>
                <button type="button" className="riccati-button-primary" onClick={() => navigate("/", { replace: true })}>
                  Iniciar sesión de nuevo
                </button>
              </div>
            </div>
          )}

          {!exito && (
            <form onSubmit={guardar} style={{ display: "grid", gap: 19, maxWidth: 560 }}>
              <div className="riccati-form-group">
                <label htmlFor="passwordActual">Contraseña actual *</label>
                <input id="passwordActual" name="passwordActual" type={visible ? "text" : "password"} autoComplete="current-password" className="riccati-input" value={formulario.passwordActual} onChange={actualizar} required />
              </div>
              <div className="riccati-form-group">
                <label htmlFor="passwordNueva">Nueva contraseña *</label>
                <input id="passwordNueva" name="passwordNueva" type={visible ? "text" : "password"} autoComplete="new-password" className="riccati-input" value={formulario.passwordNueva} onChange={actualizar} minLength={8} required />
              </div>
              <div className="riccati-form-group">
                <label htmlFor="confirmarPassword">Confirmar nueva contraseña *</label>
                <input id="confirmarPassword" name="confirmarPassword" type={visible ? "text" : "password"} autoComplete="new-password" className="riccati-input" value={formulario.confirmarPassword} onChange={actualizar} required />
              </div>
              <p style={{ margin: 0, fontSize: 13 }}>
                Mínimo 8 caracteres, una mayúscula, una minúscula, un número y un carácter especial. No debe coincidir con la contraseña anterior.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button type="button" className="riccati-button-secondary" aria-pressed={visible} onClick={() => setVisible(!visible)}>
                  {visible ? <EyeOff size={16} /> : <Eye size={16} />} {visible ? "Ocultar" : "Mostrar"}
                </button>
                <button type="submit" className="riccati-button-primary" disabled={guardando}>
                  <LockKeyhole size={16} /> {guardando ? "Actualizando..." : "Actualizar contraseña"}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </RiccatiLayout>
  );
}

export default Perfil;
