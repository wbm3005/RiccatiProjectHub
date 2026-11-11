"use strict";
// =====================================================
// SPRINT 3 · M05 GESTIÓN DOCUMENTAL
// HU-M05-01 Adjuntar documentos · HU-M05-02 Clasificar · HU-M05-03 Consultar y abrir
// HU-M05-04 Nueva versión (RN-011) · HU-M05-05 Buscar y filtrar · HU-M05-06 Inactivar (RN-012)
// =====================================================
const express = require("express");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../db");
const { autenticarToken } = require("../middleware/auth.middleware");
const { permisoProyecto, idValido } = require("../services/accesoProyecto");
const { analizarFiltrosFecha } = require("../services/filtrosFecha");

const router = express.Router();
router.use(autenticarToken);

// Carpeta privada: nunca se sirve como estática; solo se lee desde las rutas
// protegidas de descarga. Se puede cambiar con DOCUMENTOS_DIR en .env.
const DIRECTORIO = path.resolve(process.env.DOCUMENTOS_DIR || path.join(__dirname, "..", "uploads", "documentos"));
const TAMANO_MAXIMO = 10 * 1024 * 1024; // 10 MB

// Extensiones permitidas, su tipo MIME y la firma binaria que debe tener el contenido.
const FIRMA_ZIP = [0x50, 0x4b, 0x03, 0x04];
const FIRMA_OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
const FORMATOS = {
  pdf: { mime: "application/pdf", firmas: [[0x25, 0x50, 0x44, 0x46, 0x2d]], vista: true },
  png: { mime: "image/png", firmas: [[0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]], vista: true },
  jpg: { mime: "image/jpeg", firmas: [[0xff, 0xd8, 0xff]], vista: true },
  jpeg: { mime: "image/jpeg", firmas: [[0xff, 0xd8, 0xff]], vista: true },
  docx: { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", firmas: [FIRMA_ZIP] },
  xlsx: { mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", firmas: [FIRMA_ZIP] },
  pptx: { mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation", firmas: [FIRMA_ZIP] },
  doc: { mime: "application/msword", firmas: [FIRMA_OLE] },
  xls: { mime: "application/vnd.ms-excel", firmas: [FIRMA_OLE] },
  ppt: { mime: "application/vnd.ms-powerpoint", firmas: [FIRMA_OLE] },
  dwg: { mime: "application/acad", firmas: [[0x41, 0x43, 0x31, 0x30]] }, // "AC10"
};
const ESTADOS_FILTRO = ["ACTIVO", "INACTIVO", "TODOS"];

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const errorHTTP = (res, estado, mensaje) => res.status(estado).json({ mensaje });
const nombreAlmacenadoValido = (v) => /^[0-9a-f-]{36}\.[a-z]{3,4}$/.test(String(v || ""));
const esAdministrador = (req) => req.usuario.rol === "Administrador";
// Escapa los comodines de LIKE para que la búsqueda sea literal.
const patronBusqueda = (v) => `%${v.replace(/[\\%_]/g, (c) => "\\" + c)}%`;

function cabecera(req, nombre) {
  const valor = req.get(nombre);
  if (valor === undefined) return "";
  try { return decodeURIComponent(valor); } catch { return null; }
}

function extension(nombreArchivo) {
  const coincidencia = /\.([A-Za-z0-9]{1,5})$/.exec(nombreArchivo || "");
  return coincidencia ? coincidencia[1].toLowerCase() : "";
}

function firmaCorrecta(buffer, formato) {
  return formato.firmas.some(firma => buffer.length >= firma.length && firma.every((byte, i) => buffer[i] === byte));
}

// Validación común del archivo recibido como binario (carga inicial y nuevas versiones).
function validarArchivoRecibido(req) {
  const nombreOriginal = texto(cabecera(req, "X-Archivo-Nombre") ?? "").replace(/[\\/\u0000-\u001f]/g, "_").slice(-255);
  const ext = extension(nombreOriginal);
  const formato = FORMATOS[ext];
  if (!nombreOriginal || !formato) {
    return { error: "Tipo de archivo no permitido. Formatos aceptados: PDF, Word, Excel, PowerPoint, JPG, PNG y DWG." };
  }
  if (!Buffer.isBuffer(req.body) || req.body.length === 0) return { error: "Selecciona un archivo con contenido para adjuntar." };
  if (!firmaCorrecta(req.body, formato)) return { error: `El contenido del archivo no corresponde a un ${ext.toUpperCase()} válido.` };
  return { nombreOriginal, ext, formato };
}

// Guarda el binario con un nombre generado por el servidor. Devuelve null si el almacenamiento falla.
async function guardarArchivo(buffer, ext) {
  const nombreAlmacenado = `${crypto.randomUUID()}.${ext}`;
  try {
    await fs.promises.mkdir(DIRECTORIO, { recursive: true });
    const ruta = path.join(DIRECTORIO, nombreAlmacenado);
    await fs.promises.writeFile(ruta, buffer, { flag: "wx" });
    return { nombreAlmacenado, ruta, hash: crypto.createHash("sha256").update(buffer).digest("hex") };
  } catch (error) {
    console.error("Error de almacenamiento de documento:", error);
    return null;
  }
}

// Validación común de nombre, tipo y descripción (archivo o vínculo).
async function validarDatosDocumento({ nombre, idTipo, descripcion }) {
  if (nombre === null || idTipo === null || descripcion === null) return { error: "Los datos del documento contienen caracteres no válidos." };
  const limpio = texto(nombre);
  if (limpio.length < 3 || limpio.length > 180) return { error: "El nombre del documento debe tener entre 3 y 180 caracteres." };
  const descripcionLimpia = texto(descripcion);
  if (descripcionLimpia.length > 2000) return { error: "La descripción no puede superar 2000 caracteres." };
  const tipo = await validarTipo(idTipo);
  if (tipo.error) return tipo;
  return { nombre: limpio, descripcion: descripcionLimpia || null, idTipo: tipo.idTipo };
}

async function validarTipo(idTipo) {
  if (!idValido(idTipo)) return { error: "Selecciona un tipo de documento válido." };
  const r = await pool.query("SELECT id_tipo_documento FROM tipos_documento WHERE id_tipo_documento = $1 AND activo = TRUE", [Number(idTipo)]);
  if (!r.rowCount) return { error: "El tipo de documento seleccionado no existe o está inactivo." };
  return { idTipo: Number(idTipo) };
}

function validarUrl(valor) {
  const url = texto(valor);
  if (!url) return { error: "Indica la dirección del vínculo." };
  if (url.length > 2000) return { error: "El vínculo no puede superar 2000 caracteres." };
  let analizada;
  try { analizada = new URL(url); } catch { return { error: "El vínculo no tiene un formato válido. Ej.: https://ejemplo.com/archivo" }; }
  if (!["http:", "https:"].includes(analizada.protocol)) return { error: "Solo se permiten vínculos que empiecen con http:// o https://." };
  if (!analizada.hostname) return { error: "El vínculo debe incluir un dominio." };
  if (analizada.username || analizada.password) return { error: "Por seguridad, el vínculo no puede incluir usuario ni contraseña." };
  return { url: analizada.href };
}

// HU-M05-05: filtros combinables del expediente. El estado solo lo elige el administrador.
function analizarFiltrosDocumentos(req) {
  const busqueda = texto(req.query.q);
  if (busqueda.length > 100) return { error: "La búsqueda no puede superar 100 caracteres." };
  const tipo = req.query.tipo === undefined || req.query.tipo === "" ? null : req.query.tipo;
  if (tipo !== null && !idValido(tipo)) return { error: "El tipo de documento indicado no es válido." };
  const rango = analizarFiltrosFecha(req.query.desde, req.query.hasta);
  if (rango.error) return rango;
  const estado = String(req.query.estado || "ACTIVO").toUpperCase();
  if (!ESTADOS_FILTRO.includes(estado)) return { error: "El estado indicado no es válido." };
  if (estado !== "ACTIVO" && !esAdministrador(req)) return { error: "Solo el administrador puede consultar documentos inactivos.", estadoHttp: 403 };
  return { busqueda, tipo: tipo === null ? null : Number(tipo), desde: rango.desde, hasta: rango.hasta, estado };
}

// Middleware: valida el identificador y el acceso ANTES de leer el cuerpo del archivo.
async function accesoAlProyecto(req, res, next) {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Proyecto inválido.");
  try {
    const acceso = await permisoProyecto(pool, req, Number(req.params.id));
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    req.proyecto = acceso.proyecto;
    return next();
  } catch (error) {
    console.error("Error validando acceso a documentos:", error);
    return errorHTTP(res, 500, "No fue posible validar el acceso al proyecto.");
  }
}

// Carga el documento y valida el acceso a su proyecto. Un documento inactivo
// solo es visible para el administrador (se conserva como evidencia, RN-012).
async function cargarDocumento(req, id) {
  if (!idValido(id)) return { estado: 400, mensaje: "Documento inválido." };
  const r = await pool.query(
    `SELECT id_documento, id_proyecto, origen, estado, nombre, nombre_original, nombre_almacenado,
            tipo_mime, tamano_bytes, version_actual, id_usuario_carga, id_tipo_documento
       FROM documentos_proyecto WHERE id_documento = $1`,
    [Number(id)]
  );
  const documento = r.rows[0];
  if (!documento || (documento.estado !== "ACTIVO" && !esAdministrador(req))) {
    return { estado: 404, mensaje: "El documento no existe o ya no está disponible." };
  }
  const acceso = await permisoProyecto(pool, req, documento.id_proyecto);
  if (acceso.estado) return acceso;
  return { documento };
}

async function accesoAlDocumento(req, res, next) {
  try {
    const resultado = await cargarDocumento(req, req.params.id);
    if (resultado.estado) return errorHTTP(res, resultado.estado, resultado.mensaje);
    req.documento = resultado.documento;
    return next();
  } catch (error) {
    console.error("Error validando acceso al documento:", error);
    return errorHTTP(res, 500, "No fue posible validar el acceso al documento.");
  }
}

// Entrega un archivo almacenado de forma privada (versión vigente o anterior).
async function enviarArchivo(req, res, archivo) {
  if (!nombreAlmacenadoValido(archivo.nombre_almacenado)) return errorHTTP(res, 404, "El archivo no se encuentra disponible.");
  const ruta = path.join(DIRECTORIO, archivo.nombre_almacenado);
  let info;
  try { info = await fs.promises.stat(ruta); } catch { info = null; }
  if (!info || !info.isFile()) {
    return errorHTTP(res, 404, "El archivo no se encuentra en el almacenamiento del servidor. Contacta al administrador.");
  }
  const formato = FORMATOS[extension(archivo.nombre_almacenado)];
  const enLinea = req.query.modo === "ver" && formato?.vista;
  const respaldo = archivo.nombre_original.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Type", archivo.tipo_mime);
  res.setHeader("Content-Length", info.size);
  res.setHeader("Content-Disposition",
    `${enLinea ? "inline" : "attachment"}; filename="${respaldo}"; filename*=UTF-8''${encodeURIComponent(archivo.nombre_original)}`);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Cache-Control", "private, no-store");
  const lectura = fs.createReadStream(ruta);
  lectura.on("error", (error) => {
    console.error("Error leyendo documento:", error);
    if (!res.headersSent) errorHTTP(res, 500, "No fue posible leer el archivo.");
    else res.destroy(error);
  });
  return lectura.pipe(res);
}

const COLUMNAS_DOCUMENTO = `
  d.id_documento, d.id_proyecto, d.nombre, d.descripcion, d.origen, d.url_externa,
  d.nombre_original, d.tipo_mime, d.tamano_bytes, d.creado_en, d.actualizado_en,
  d.estado, d.version_actual, d.motivo_inactivacion, d.inactivado_en,
  d.id_tipo_documento, t.nombre AS tipo,
  d.id_usuario_carga, CONCAT(u.nombre, ' ', u.apellidos) AS usuario_carga,
  CASE WHEN ua.id_usuario IS NULL THEN NULL ELSE CONCAT(ua.nombre, ' ', ua.apellidos) END AS usuario_actualiza,
  CASE WHEN ui.id_usuario IS NULL THEN NULL ELSE CONCAT(ui.nombre, ' ', ui.apellidos) END AS usuario_inactiva,
  v.creado_en AS version_creada_en,
  CASE WHEN uv.id_usuario IS NULL THEN NULL ELSE CONCAT(uv.nombre, ' ', uv.apellidos) END AS usuario_version`;
const JOINS_DOCUMENTO = `
  JOIN tipos_documento t ON t.id_tipo_documento = d.id_tipo_documento
  JOIN usuarios u ON u.id_usuario = d.id_usuario_carga
  LEFT JOIN usuarios ua ON ua.id_usuario = d.id_usuario_actualiza
  LEFT JOIN usuarios ui ON ui.id_usuario = d.id_usuario_inactiva
  LEFT JOIN documento_versiones v ON v.id_documento = d.id_documento AND v.numero = d.version_actual
  LEFT JOIN usuarios uv ON uv.id_usuario = v.id_usuario_carga`;

const puedeReclasificar = (req, documento) =>
  esAdministrador(req) || Number(documento.id_usuario_carga) === Number(req.usuario.idUsuario);

// GET /api/documentos/tipos — catálogo de clasificación (HU-M05-02).
router.get("/tipos", async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT id_tipo_documento, nombre, descripcion FROM tipos_documento
        WHERE activo = TRUE ORDER BY CASE WHEN nombre = 'Otro' THEN 1 ELSE 0 END, nombre`);
    return res.json(r.rows);
  } catch (error) {
    console.error("Error tipos de documento:", error);
    return errorHTTP(res, 500, "No fue posible cargar los tipos de documento. Comprueba que ejecutaste la migración 08.");
  }
});

// GET /api/documentos/proyectos/:id — expediente documental (HU-M05-03)
// con búsqueda y filtros combinables (HU-M05-05): q, tipo, desde, hasta, estado.
router.get("/proyectos/:id", accesoAlProyecto, async (req, res) => {
  const filtros = analizarFiltrosDocumentos(req);
  if (filtros.error) return errorHTTP(res, filtros.estadoHttp || 400, filtros.error);
  try {
    const r = await pool.query(
      `SELECT ${COLUMNAS_DOCUMENTO} FROM documentos_proyecto d ${JOINS_DOCUMENTO}
        WHERE d.id_proyecto = $1
          AND ($2::text = 'TODOS' OR d.estado = $2::text)
          AND ($3::text = '' OR d.nombre ILIKE $4 ESCAPE '\\' OR COALESCE(d.descripcion, '') ILIKE $4 ESCAPE '\\'
               OR COALESCE(d.nombre_original, '') ILIKE $4 ESCAPE '\\' OR COALESCE(d.url_externa, '') ILIKE $4 ESCAPE '\\')
          AND ($5::int IS NULL OR d.id_tipo_documento = $5::int)
          AND ($6::date IS NULL OR d.creado_en >= $6::date)
          AND ($7::date IS NULL OR d.creado_en < $7::date + 1)
        ORDER BY d.creado_en DESC, d.id_documento DESC`,
      [Number(req.params.id), filtros.estado, filtros.busqueda, patronBusqueda(filtros.busqueda),
        filtros.tipo, filtros.desde, filtros.hasta]
    );
    const total = await pool.query(
      "SELECT COUNT(*)::int AS activos FROM documentos_proyecto WHERE id_proyecto = $1 AND estado = 'ACTIVO'",
      [Number(req.params.id)]
    );
    const admin = esAdministrador(req);
    const documentos = r.rows.map(d => ({
      ...d,
      puede_reclasificar: d.estado === "ACTIVO" && puedeReclasificar(req, d),
      puede_versionar: d.estado === "ACTIVO" && d.origen === "ARCHIVO",
      puede_inactivar: d.estado === "ACTIVO" && admin,
    }));
    return res.json({
      proyecto: req.proyecto, documentos, total_activos: total.rows[0].activos,
      filtros: { q: filtros.busqueda, tipo: filtros.tipo, desde: filtros.desde, hasta: filtros.hasta, estado: filtros.estado },
    });
  } catch (error) {
    console.error("Error consultando documentos:", error);
    return errorHTTP(res, 500, "No fue posible consultar los documentos. Comprueba que ejecutaste las migraciones 08 y 09.");
  }
});

// POST /api/documentos/proyectos/:id/vinculos — registrar vínculo externo (HU-M05-01).
router.post("/proyectos/:id/vinculos", accesoAlProyecto, async (req, res) => {
  try {
    const datos = await validarDatosDocumento({
      nombre: req.body?.nombre, idTipo: req.body?.id_tipo_documento, descripcion: req.body?.descripcion,
    });
    if (datos.error) return errorHTTP(res, 400, datos.error);
    const url = validarUrl(req.body?.url);
    if (url.error) return errorHTTP(res, 400, url.error);
    const r = await pool.query(
      `INSERT INTO documentos_proyecto
         (id_proyecto, id_tipo_documento, nombre, descripcion, origen, url_externa, id_usuario_carga)
       VALUES ($1, $2, $3, $4, 'VINCULO', $5, $6)
       RETURNING id_documento, creado_en`,
      [Number(req.params.id), datos.idTipo, datos.nombre, datos.descripcion, url.url, req.usuario.idUsuario]
    );
    return res.status(201).json({ mensaje: "Vínculo registrado en el expediente del proyecto.", documento: r.rows[0] });
  } catch (error) {
    console.error("Error registrando vínculo:", error);
    return errorHTTP(res, 500, "No fue posible registrar el vínculo.");
  }
});

// POST /api/documentos/proyectos/:id/archivos — carga real de archivo (HU-M05-01).
// Cuerpo: contenido binario (application/octet-stream). Metadatos en cabeceras
// codificadas con encodeURIComponent: X-Documento-Nombre, X-Documento-Tipo,
// X-Documento-Descripcion y X-Archivo-Nombre.
router.post(
  "/proyectos/:id/archivos",
  accesoAlProyecto,
  express.raw({ type: "application/octet-stream", limit: TAMANO_MAXIMO }),
  async (req, res) => {
    let rutaGuardada = null;
    let conexion;
    try {
      const datos = await validarDatosDocumento({
        nombre: cabecera(req, "X-Documento-Nombre"),
        idTipo: cabecera(req, "X-Documento-Tipo"),
        descripcion: cabecera(req, "X-Documento-Descripcion"),
      });
      if (datos.error) return errorHTTP(res, 400, datos.error);
      const archivo = validarArchivoRecibido(req);
      if (archivo.error) return errorHTTP(res, 400, archivo.error);

      const guardado = await guardarArchivo(req.body, archivo.ext);
      if (!guardado) return errorHTTP(res, 500, "No fue posible almacenar el archivo en el servidor. Intenta de nuevo o contacta al administrador.");
      rutaGuardada = guardado.ruta;

      // El documento y su versión 1 se registran juntos (RN-011).
      conexion = await pool.connect();
      await conexion.query("BEGIN");
      const r = await conexion.query(
        `INSERT INTO documentos_proyecto
           (id_proyecto, id_tipo_documento, nombre, descripcion, origen,
            nombre_original, nombre_almacenado, tipo_mime, tamano_bytes, hash_sha256, id_usuario_carga)
         VALUES ($1, $2, $3, $4, 'ARCHIVO', $5, $6, $7, $8, $9, $10)
         RETURNING id_documento, creado_en`,
        [Number(req.params.id), datos.idTipo, datos.nombre, datos.descripcion,
          archivo.nombreOriginal, guardado.nombreAlmacenado, archivo.formato.mime, req.body.length, guardado.hash, req.usuario.idUsuario]
      );
      await conexion.query(
        `INSERT INTO documento_versiones
           (id_documento, numero, nombre_original, nombre_almacenado, tipo_mime, tamano_bytes, hash_sha256, id_usuario_carga, creado_en)
         VALUES ($1, 1, $2, $3, $4, $5, $6, $7, $8)`,
        [r.rows[0].id_documento, archivo.nombreOriginal, guardado.nombreAlmacenado, archivo.formato.mime,
          req.body.length, guardado.hash, req.usuario.idUsuario, r.rows[0].creado_en]
      );
      await conexion.query("COMMIT");
      rutaGuardada = null; // Persistido: no se debe limpiar.
      return res.status(201).json({ mensaje: "Archivo adjuntado correctamente al expediente.", documento: r.rows[0] });
    } catch (error) {
      if (conexion) await conexion.query("ROLLBACK").catch(() => {});
      console.error("Error adjuntando archivo:", error);
      return errorHTTP(res, 500, "No fue posible registrar el archivo.");
    } finally {
      if (conexion) conexion.release();
      // Si el registro en la base falló, no se deja un archivo huérfano.
      if (rutaGuardada) await fs.promises.unlink(rutaGuardada).catch(() => {});
    }
  }
);

// PUT /api/documentos/:id/tipo — actualizar clasificación (HU-M05-02).
// Permitido al administrador o a quien cargó el documento, si conserva acceso al proyecto.
router.put("/:id/tipo", accesoAlDocumento, async (req, res) => {
  try {
    const documento = req.documento;
    if (documento.estado !== "ACTIVO") return errorHTTP(res, 409, "No se puede reclasificar un documento inactivo.");
    const tipo = await validarTipo(req.body?.id_tipo_documento);
    if (tipo.error) return errorHTTP(res, 400, tipo.error);
    if (!puedeReclasificar(req, documento)) {
      return errorHTTP(res, 403, "Solo el administrador o la persona que cargó el documento puede cambiar su clasificación.");
    }
    if (Number(documento.id_tipo_documento) === tipo.idTipo) return errorHTTP(res, 400, "El documento ya tiene esa clasificación.");
    await pool.query(
      `UPDATE documentos_proyecto
          SET id_tipo_documento = $1, id_usuario_actualiza = $2, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_documento = $3 AND estado = 'ACTIVO'`,
      [tipo.idTipo, req.usuario.idUsuario, documento.id_documento]
    );
    return res.json({ mensaje: "Clasificación del documento actualizada." });
  } catch (error) {
    console.error("Error reclasificando documento:", error);
    return errorHTTP(res, 500, "No fue posible actualizar la clasificación.");
  }
});

// POST /api/documentos/:id/versiones — cargar nueva versión (HU-M05-04, RN-011).
// Mismo formato de carga que /archivos. Cabeceras: X-Archivo-Nombre y X-Version-Comentario (opcional).
// La versión anterior se conserva intacta; el documento pasa a apuntar a la nueva.
router.post(
  "/:id/versiones",
  accesoAlDocumento,
  express.raw({ type: "application/octet-stream", limit: TAMANO_MAXIMO }),
  async (req, res) => {
    let rutaGuardada = null;
    let conexion;
    try {
      if (req.documento.estado !== "ACTIVO") return errorHTTP(res, 409, "No se pueden cargar versiones de un documento inactivo.");
      if (req.documento.origen !== "ARCHIVO") return errorHTTP(res, 400, "Los vínculos externos no tienen versiones; registra un vínculo nuevo si cambió la dirección.");
      const comentario = cabecera(req, "X-Version-Comentario");
      if (comentario === null) return errorHTTP(res, 400, "El comentario contiene caracteres no válidos.");
      if (texto(comentario).length > 1000) return errorHTTP(res, 400, "El comentario de la versión no puede superar 1000 caracteres.");
      const archivo = validarArchivoRecibido(req);
      if (archivo.error) return errorHTTP(res, 400, archivo.error);

      const guardado = await guardarArchivo(req.body, archivo.ext);
      if (!guardado) return errorHTTP(res, 500, "No fue posible almacenar el archivo en el servidor. Intenta de nuevo o contacta al administrador.");
      rutaGuardada = guardado.ruta;

      conexion = await pool.connect();
      await conexion.query("BEGIN");
      // Bloqueo de la fila: dos cargas simultáneas no pueden obtener el mismo número de versión.
      const actual = await conexion.query(
        "SELECT version_actual, estado FROM documentos_proyecto WHERE id_documento = $1 FOR UPDATE",
        [req.documento.id_documento]
      );
      if (!actual.rowCount || actual.rows[0].estado !== "ACTIVO") {
        await conexion.query("ROLLBACK");
        return errorHTTP(res, 409, "El documento ya no está disponible para nuevas versiones.");
      }
      const numero = Number(actual.rows[0].version_actual) + 1;
      await conexion.query(
        `INSERT INTO documento_versiones
           (id_documento, numero, nombre_original, nombre_almacenado, tipo_mime, tamano_bytes, hash_sha256, comentario, id_usuario_carga)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [req.documento.id_documento, numero, archivo.nombreOriginal, guardado.nombreAlmacenado, archivo.formato.mime,
          req.body.length, guardado.hash, texto(comentario) || null, req.usuario.idUsuario]
      );
      await conexion.query(
        `UPDATE documentos_proyecto
            SET version_actual = $1, nombre_original = $2, nombre_almacenado = $3, tipo_mime = $4,
                tamano_bytes = $5, hash_sha256 = $6
          WHERE id_documento = $7`,
        [numero, archivo.nombreOriginal, guardado.nombreAlmacenado, archivo.formato.mime,
          req.body.length, guardado.hash, req.documento.id_documento]
      );
      await conexion.query("COMMIT");
      rutaGuardada = null;
      return res.status(201).json({ mensaje: `Versión ${numero} cargada. Las versiones anteriores se conservan en el historial.`, version: numero });
    } catch (error) {
      if (conexion) await conexion.query("ROLLBACK").catch(() => {});
      console.error("Error cargando nueva versión:", error);
      return errorHTTP(res, 500, "No fue posible registrar la nueva versión.");
    } finally {
      if (conexion) conexion.release();
      if (rutaGuardada) await fs.promises.unlink(rutaGuardada).catch(() => {});
    }
  }
);

// GET /api/documentos/:id/versiones — historial de versiones (HU-M05-04).
router.get("/:id/versiones", accesoAlDocumento, async (req, res) => {
  try {
    if (req.documento.origen !== "ARCHIVO") return errorHTTP(res, 400, "Los vínculos externos no tienen historial de versiones.");
    const r = await pool.query(
      `SELECT v.numero, v.nombre_original, v.tipo_mime, v.tamano_bytes, v.comentario, v.creado_en,
              CONCAT(u.nombre, ' ', u.apellidos) AS usuario_carga,
              (v.numero = d.version_actual) AS vigente
         FROM documento_versiones v
         JOIN documentos_proyecto d ON d.id_documento = v.id_documento
         JOIN usuarios u ON u.id_usuario = v.id_usuario_carga
        WHERE v.id_documento = $1
        ORDER BY v.numero DESC`,
      [req.documento.id_documento]
    );
    return res.json({ documento: { id_documento: req.documento.id_documento, nombre: req.documento.nombre, version_actual: req.documento.version_actual }, versiones: r.rows });
  } catch (error) {
    console.error("Error consultando versiones:", error);
    return errorHTTP(res, 500, "No fue posible consultar el historial de versiones.");
  }
});

// GET /api/documentos/:id/versiones/:numero/archivo — abrir o descargar una versión concreta (HU-M05-04).
router.get("/:id/versiones/:numero/archivo", accesoAlDocumento, async (req, res) => {
  if (!idValido(req.params.numero)) return errorHTTP(res, 400, "Número de versión inválido.");
  try {
    const r = await pool.query(
      "SELECT nombre_original, nombre_almacenado, tipo_mime FROM documento_versiones WHERE id_documento = $1 AND numero = $2",
      [req.documento.id_documento, Number(req.params.numero)]
    );
    if (!r.rowCount) return errorHTTP(res, 404, "La versión solicitada no existe.");
    return enviarArchivo(req, res, r.rows[0]);
  } catch (error) {
    console.error("Error abriendo versión:", error);
    return errorHTTP(res, 500, "No fue posible abrir la versión.");
  }
});

// PUT /api/documentos/:id/inactivar — retirar un documento incorrecto (HU-M05-06, RN-012).
// Solo administrador. No borra el archivo ni sus versiones; queda registro de quién, cuándo y por qué.
router.put("/:id/inactivar", async (req, res) => {
  if (!esAdministrador(req)) return errorHTTP(res, 403, "Solo el administrador puede inactivar documentos.");
  const motivo = texto(req.body?.motivo);
  if (motivo.length < 10 || motivo.length > 1000) return errorHTTP(res, 400, "Indica el motivo de la inactivación (entre 10 y 1000 caracteres).");
  try {
    const resultado = await cargarDocumento(req, req.params.id);
    if (resultado.estado) return errorHTTP(res, resultado.estado, resultado.mensaje);
    const r = await pool.query(
      `UPDATE documentos_proyecto
          SET estado = 'INACTIVO', motivo_inactivacion = $1, id_usuario_inactiva = $2, inactivado_en = CURRENT_TIMESTAMP
        WHERE id_documento = $3 AND estado = 'ACTIVO'
        RETURNING id_documento`,
      [motivo, req.usuario.idUsuario, resultado.documento.id_documento]
    );
    if (!r.rowCount) return errorHTTP(res, 409, "El documento ya estaba inactivo.");
    return res.json({ mensaje: "Documento inactivado. Ya no aparece en la consulta normal, pero se conserva como evidencia." });
  } catch (error) {
    console.error("Error inactivando documento:", error);
    return errorHTTP(res, 500, "No fue posible inactivar el documento.");
  }
});

// GET /api/documentos/:id/archivo — abrir o descargar la versión vigente (HU-M05-03).
// ?modo=ver lo entrega en línea (solo PDF e imágenes); por defecto, como descarga.
router.get("/:id/archivo", accesoAlDocumento, async (req, res) => {
  try {
    if (req.documento.origen !== "ARCHIVO") return errorHTTP(res, 400, "Este documento es un vínculo externo; ábrelo desde su dirección.");
    return enviarArchivo(req, res, req.documento);
  } catch (error) {
    console.error("Error abriendo documento:", error);
    return errorHTTP(res, 500, "No fue posible abrir el documento.");
  }
});

// Errores del lector binario (p. ej. archivo mayor al límite) en formato JSON.
router.use((error, req, res, next) => {
  if (error?.type === "entity.too.large") return errorHTTP(res, 413, "El archivo supera el tamaño máximo permitido de 10 MB.");
  if (error?.type === "request.aborted") return errorHTTP(res, 400, "La carga del archivo se interrumpió.");
  return next(error);
});

module.exports = router;
module.exports._interno = { FORMATOS, TAMANO_MAXIMO, DIRECTORIO, validarUrl, firmaCorrecta, extension, patronBusqueda };
