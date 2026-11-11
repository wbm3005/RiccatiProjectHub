import { Navigate, useLocation } from "react-router-dom";

function RutaProtegida({
  children,
  soloAdministrador = false,
}) {
  const location = useLocation();
  const token =
    localStorage.getItem("tokenRiccati");

  let usuario = null;

  try {
    usuario = JSON.parse(
      localStorage.getItem(
        "usuarioRiccati"
      )
    );
  } catch {
    usuario = null;
  }

  /* NO HAY SESIÓN */

  if (!token || !usuario) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /* CONTRASEÑA TEMPORAL: solo puede usar "Mi cuenta" hasta cambiarla */

  if (
    usuario.debeCambiarPassword &&
    location.pathname !== "/perfil"
  ) {
    return (
      <Navigate
        to="/perfil"
        replace
      />
    );
  }

  /* SOLO ADMINISTRADORES */

  if (
    soloAdministrador &&
    usuario.rol !== "Administrador"
  ) {
    return (
      <Navigate
        to="/dashboard"
        replace
      />
    );
  }

  return children;
}

export default RutaProtegida;