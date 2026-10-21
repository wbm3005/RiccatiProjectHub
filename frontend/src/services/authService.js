const API_AUTH = "http://localhost:3000/api/auth";

export async function cambiarMiPassword(datos) {
  const token = localStorage.getItem("tokenRiccati");
  if (!token) {
    throw new Error("Debes iniciar sesión de nuevo.");
  }

  let respuesta;
  try {
    respuesta = await fetch(`${API_AUTH}/cambiar-contrasena`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(datos),
    });
  } catch {
    throw new Error("No se pudo conectar con el servidor.");
  }

  let contenido = {};
  try {
    contenido = await respuesta.json();
  } catch {
    // Un fallo de servidor también debe mostrar un error útil.
  }

  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      cerrarSesionLocal();
      throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
    }
    throw new Error(contenido.mensaje || "No fue posible cambiar la contraseña.");
  }

  return contenido;
}

export function cerrarSesionLocal() {
  localStorage.removeItem("tokenRiccati");
  localStorage.removeItem("usuarioRiccati");
}
