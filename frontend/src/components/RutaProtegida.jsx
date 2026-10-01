import { Navigate } from "react-router-dom";

function RutaProtegida({
  children,
  soloAdministrador = false,
}) {
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