// Sprint 3 · M05 Gestión documental (HU-M05-01, HU-M05-02, HU-M05-03).
const API = "http://localhost:3000/api/documentos";

export const TAMANO_MAXIMO = 10 * 1024 * 1024; // Igual al límite del servidor.
export const EXTENSIONES_PERMITIDAS = ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png", "dwg"];
export const ACEPTAR_ARCHIVOS = EXTENSIONES_PERMITIDAS.map(e => "." + e).join(",");

function token() {
  const valor = localStorage.getItem("tokenRiccati");
  if (!valor) throw new Error("Debes iniciar sesión nuevamente.");
  return valor;
}

async function enviar(ruta, configuracion = {}) {
  let respuesta;
  try {
    respuesta = await fetch(`${API}${ruta}`, {
      ...configuracion,
      headers: { Authorization: `Bearer ${token()}`, ...(configuracion.headers || {}) },
    });
  } catch {
    throw new Error("No fue posible conectar con el servidor.");
  }
  if (respuesta.status === 401) {
    localStorage.removeItem("tokenRiccati");
    localStorage.removeItem("usuarioRiccati");
    window.location.assign("/");
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }
  return respuesta;
}

async function json(ruta, configuracion = {}) {
  const respuesta = await enviar(ruta, configuracion);
  let datos = {};
  try { datos = await respuesta.json(); } catch { /* Respuesta sin JSON. */ }
  if (!respuesta.ok) throw new Error(datos.mensaje || "No se pudo completar la solicitud.");
  return datos;
}

const conJson = (metodo, datos) => ({ method: metodo, headers: { "Content-Type": "application/json" }, body: JSON.stringify(datos) });

export const tiposDocumento = () => json("/tipos");
export const documentosDeProyecto = (idProyecto) => json(`/proyectos/${Number(idProyecto)}`);
export const registrarVinculo = (idProyecto, datos) => json(`/proyectos/${Number(idProyecto)}/vinculos`, conJson("POST", datos));
export const cambiarTipoDocumento = (idDocumento, idTipo) =>
  json(`/${Number(idDocumento)}/tipo`, conJson("PUT", { id_tipo_documento: Number(idTipo) }));

// Carga real: el archivo viaja como binario y los metadatos en cabeceras codificadas.
export const adjuntarArchivo = (idProyecto, { archivo, nombre, idTipo, descripcion }) =>
  json(`/proyectos/${Number(idProyecto)}/archivos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "X-Documento-Nombre": encodeURIComponent(nombre),
      "X-Documento-Tipo": encodeURIComponent(String(idTipo)),
      "X-Documento-Descripcion": encodeURIComponent(descripcion || ""),
      "X-Archivo-Nombre": encodeURIComponent(archivo.name),
    },
    body: archivo,
  });

// Descarga autenticada: el archivo nunca tiene una URL pública.
export async function obtenerArchivo(idDocumento, modo = "descarga") {
  const respuesta = await enviar(`/${Number(idDocumento)}/archivo${modo === "ver" ? "?modo=ver" : ""}`);
  if (!respuesta.ok) {
    let datos = {};
    try { datos = await respuesta.json(); } catch { /* Sin detalle. */ }
    throw new Error(datos.mensaje || "No fue posible abrir el documento.");
  }
  return respuesta.blob();
}
