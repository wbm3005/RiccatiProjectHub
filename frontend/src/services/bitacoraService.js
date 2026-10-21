const API = "http://localhost:3000/api/bitacora";

async function solicitud(ruta, configuracion = {}) {
  const token = localStorage.getItem("tokenRiccati");
  if (!token) throw new Error("Debes iniciar sesión nuevamente.");
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      ...configuracion,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(configuracion.body ? { "Content-Type": "application/json" } : {}),
      },
    });
  } catch {
    throw new Error("No fue posible conectar con el servidor.");
  }
  let datos = {};
  try { datos = await respuesta.json(); } catch { /* Respuesta sin JSON. */ }
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      localStorage.removeItem("tokenRiccati");
      localStorage.removeItem("usuarioRiccati");
      window.location.assign("/");
    }
    throw new Error(datos.mensaje || "No se pudo completar la solicitud.");
  }
  return datos;
}

export const proyectosDeBitacora = () => solicitud("/proyectos");
export const cronologiaProyecto = (id, pagina = 1, tipo = "TODOS") =>
  solicitud(`/proyectos/${Number(id)}/cronologia?pagina=${pagina}&limite=8&tipo=${encodeURIComponent(tipo)}`);
export const registrarActividad = (id, datos) =>
  solicitud(`/proyectos/${Number(id)}/actividades`, { method: "POST", body: JSON.stringify(datos) });
export const registrarComentario = (id, datos) =>
  solicitud(`/proyectos/${Number(id)}/comentarios`, { method: "POST", body: JSON.stringify(datos) });
export const corregirActividad = (idEntrada, datos) =>
  solicitud(`/actividades/${Number(idEntrada)}`, { method: "PUT", body: JSON.stringify(datos) });
