// Sprint 3 · M06 Control financiero básico (HU-M06-01, HU-M06-02, HU-M06-03). Solo administrador.
const API = "http://localhost:3000/api/finanzas";

async function solicitud(ruta, configuracion = {}) {
  const token = localStorage.getItem("tokenRiccati");
  if (!token) throw new Error("Debes iniciar sesión nuevamente.");
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      ...configuracion,
      headers: { Authorization: `Bearer ${token}`, ...(configuracion.body ? { "Content-Type": "application/json" } : {}) },
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
    // `codigo` permite al formulario pedir confirmación (p. ej. REQUIERE_CONFIRMACION por sobrepago).
    const error = new Error(datos.mensaje || "No se pudo completar la solicitud.");
    error.codigo = datos.codigo;
    error.datos = datos;
    throw error;
  }
  return datos;
}

const enviar = (metodo, datos) => ({ method: metodo, body: JSON.stringify(datos) });

export const finanzasDeProyecto = (idProyecto) => solicitud(`/proyectos/${Number(idProyecto)}`);
export const guardarMontoAcordado = (idProyecto, datos) => solicitud(`/proyectos/${Number(idProyecto)}/monto`, enviar("PUT", datos));
export const registrarPago = (idProyecto, datos) => solicitud(`/proyectos/${Number(idProyecto)}/pagos`, enviar("POST", datos));
export const corregirPago = (idPago, datos) => solicitud(`/pagos/${Number(idPago)}`, enviar("PUT", datos));
export const anularPago = (idPago, justificacion) => solicitud(`/pagos/${Number(idPago)}/anular`, enviar("PUT", { justificacion }));
export const correccionesDePago = (idPago) => solicitud(`/pagos/${Number(idPago)}/correcciones`);

export const NOMBRE_MONEDA = { CRC: "Colones (₡)", USD: "Dólares ($)" };
export function formatoMoneda(valor, moneda) {
  const numero = Number(valor || 0);
  if (moneda === "USD") return `$${numero.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `₡${numero.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
