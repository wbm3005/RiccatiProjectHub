"use strict";
// =====================================================
// SPRINT 3 · M05 GESTIÓN DOCUMENTAL
// HU-M05-01 Adjuntar documentos · HU-M05-02 Clasificar · HU-M05-03 Consultar y abrir
// =====================================================
const express = require("express");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const pool = require("../db");
const { autenticarToken } = require("../middleware/auth.middleware");
const { permisoProyecto, idValido } = require("../services/accesoProyecto");

const router = express.Router();
router.use(autenticarToken);

// Carpeta privada: nunca se sirve como estática; solo se lee desde la ruta
// protegida de descarga. Se puede cambiar con DOCUMENTOS_DIR en .env.
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

const texto = (v) => (typeof v === "string" ? v.trim() : "");
const errorHTTP = (res, estado, mensaje) => res.status(estado).json({ mensaje });
const nombreAlmacenadoValido = (v) => /^[0-9a-f-]{36}\.[a-z]{3,4}$/.test(String(v || ""));

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

const COLUMNAS_DOCUMENTO = `
  d.id_documento, d.id_proyecto, d.nombre, d.descripcion, d.origen, d.url_externa,
  d.nombre_original, d.tipo_mime, d.tamano_bytes, d.creado_en, d.actualizado_en,
  d.id_tipo_documento, t.nombre AS tipo,
  d.id_usuario_carga, CONCAT(u.nombre, ' ', u.apellidos) AS usuario_carga,
  CASE WHEN ua.id_usuario IS NULL THEN NULL ELSE CONCAT(ua.nombre, ' ', ua.apellidos) END AS usuario_actualiza`;
const JOINS_DOCUMENTO = `
  JOIN tipos_documento t ON t.id_tipo_documento = d.id_tipo_documento
  JOIN usuarios u ON u.id_usuario = d.id_usuario_carga
  LEFT JOIN usuarios ua ON ua.id_usuario = d.id_usuario_actualiza`;

const puedeReclasificar = (req, documento) =>
  req.usuario.rol === "Administrador" || Number(documento.id_usuario_carga) === Number(req.usuario.idUsuario);

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

// GET /api/documentos/proyectos/:id — expediente documental (HU-M05-03).
router.get("/proyectos/:id", accesoAlProyecto, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT ${COLUMNAS_DOCUMENTO} FROM documentos_proyecto d ${JOINS_DOCUMENTO}
        WHERE d.id_proyecto = $1 AND d.estado = 'ACTIVO'
        ORDER BY d.creado_en DESC, d.id_documento DESC`,
      [Number(req.params.id)]
    );
    const documentos = r.rows.map(d => ({ ...d, puede_reclasificar: puedeReclasificar(req, d) }));
    return res.json({ proyecto: req.proyecto, documentos });
  } catch (error) {
    console.error("Error consultando documentos:", error);
    return errorHTTP(res, 500, "No fue posible consultar los documentos. Comprueba que ejecutaste la migración 08.");
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
    try {
      const datos = await validarDatosDocumento({
        nombre: cabecera(req, "X-Documento-Nombre"),
        idTipo: cabecera(req, "X-Documento-Tipo"),
        descripcion: cabecera(req, "X-Documento-Descripcion"),
      });
      if (datos.error) return errorHTTP(res, 400, datos.error);

      const nombreOriginal = texto(cabecera(req, "X-Archivo-Nombre") ?? "").replace(/[\\/\u0000-\u001f]/g, "_").slice(-255);
      const ext = extension(nombreOriginal);
      const formato = FORMATOS[ext];
      if (!nombreOriginal || !formato) {
        return errorHTTP(res, 400, "Tipo de archivo no permitido. Formatos aceptados: PDF, Word, Excel, PowerPoint, JPG, PNG y DWG.");
      }
      if (!Buffer.isBuffer(req.body) || req.body.length === 0) {
        return errorHTTP(res, 400, "Selecciona un archivo con contenido para adjuntar.");
      }
      if (!firmaCorrecta(req.body, formato)) {
        return errorHTTP(res, 400, `El contenido del archivo no corresponde a un ${ext.toUpperCase()} válido.`);
      }

      const nombreAlmacenado = `${crypto.randomUUID()}.${ext}`;
      const hash = crypto.createHash("sha256").update(req.body).digest("hex");
      try {
        await fs.promises.mkdir(DIRECTORIO, { recursive: true });
        rutaGuardada = path.join(DIRECTORIO, nombreAlmacenado);
        await fs.promises.writeFile(rutaGuardada, req.body, { flag: "wx" });
      } catch (error) {
        rutaGuardada = null;
        console.error("Error de almacenamiento de documento:", error);
        return errorHTTP(res, 500, "No fue posible almacenar el archivo en el servidor. Intenta de nuevo o contacta al administrador.");
      }

      const r = await pool.query(
        `INSERT INTO documentos_proyecto
           (id_proyecto, id_tipo_documento, nombre, descripcion, origen,
            nombre_original, nombre_almacenado, tipo_mime, tamano_bytes, hash_sha256, id_usuario_carga)
         VALUES ($1, $2, $3, $4, 'ARCHIVO', $5, $6, $7, $8, $9, $10)
         RETURNING id_documento, creado_en`,
        [Number(req.params.id), datos.idTipo, datos.nombre, datos.descripcion,
          nombreOriginal, nombreAlmacenado, formato.mime, req.body.length, hash, req.usuario.idUsuario]
      );
      rutaGuardada = null; // Persistido: no se debe limpiar.
      return res.status(201).json({ mensaje: "Archivo adjuntado correctamente al expediente.", documento: r.rows[0] });
    } catch (error) {
      console.error("Error adjuntando archivo:", error);
      return errorHTTP(res, 500, "No fue posible registrar el archivo.");
    } finally {
      // Si el registro en la base falló, no se deja un archivo huérfano.
      if (rutaGuardada) await fs.promises.unlink(rutaGuardada).catch(() => {});
    }
  }
);

// PUT /api/documentos/:id/tipo — actualizar clasificación (HU-M05-02).
// Permitido al administrador o a quien cargó el documento, si conserva acceso al proyecto.
router.put("/:id/tipo", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Documento inválido.");
  try {
    const tipo = await validarTipo(req.body?.id_tipo_documento);
    if (tipo.error) return errorHTTP(res, 400, tipo.error);
    const actual = await pool.query(
      "SELECT id_documento, id_proyecto, id_usuario_carga, id_tipo_documento FROM documentos_proyecto WHERE id_documento = $1 AND estado = 'ACTIVO'",
      [Number(req.params.id)]
    );
    if (!actual.rowCount) return errorHTTP(res, 404, "El documento no existe o ya no está disponible.");
    const documento = actual.rows[0];
    const acceso = await permisoProyecto(pool, req, documento.id_proyecto);
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    if (!puedeReclasificar(req, documento)) {
      return errorHTTP(res, 403, "Solo el administrador o la persona que cargó el documento puede cambiar su clasificación.");
    }
    if (Number(documento.id_tipo_documento) === tipo.idTipo) return errorHTTP(res, 400, "El documento ya tiene esa clasificación.");
    await pool.query(
      `UPDATE documentos_proyecto
          SET id_tipo_documento = $1, id_usuario_actualiza = $2, actualizado_en = CURRENT_TIMESTAMP
        WHERE id_documento = $3`,
      [tipo.idTipo, req.usuario.idUsuario, Number(req.params.id)]
    );
    return res.json({ mensaje: "Clasificación del documento actualizada." });
  } catch (error) {
    console.error("Error reclasificando documento:", error);
    return errorHTTP(res, 500, "No fue posible actualizar la clasificación.");
  }
});

// GET /api/documentos/:id/archivo — abrir o descargar (HU-M05-03).
// ?modo=ver lo entrega en línea (solo PDF e imágenes); por defecto, como descarga.
router.get("/:id/archivo", async (req, res) => {
  if (!idValido(req.params.id)) return errorHTTP(res, 400, "Documento inválido.");
  try {
    const r = await pool.query(
      `SELECT id_documento, id_proyecto, origen, nombre_original, nombre_almacenado, tipo_mime, tamano_bytes
         FROM documentos_proyecto WHERE id_documento = $1 AND estado = 'ACTIVO'`,
      [Number(req.params.id)]
    );
    if (!r.rowCount) return errorHTTP(res, 404, "El documento no existe o ya no está disponible.");
    const documento = r.rows[0];
    const acceso = await permisoProyecto(pool, req, documento.id_proyecto);
    if (acceso.estado) return errorHTTP(res, acceso.estado, acceso.mensaje);
    if (documento.origen !== "ARCHIVO") return errorHTTP(res, 400, "Este documento es un vínculo externo; ábrelo desde su dirección.");
    if (!nombreAlmacenadoValido(documento.nombre_almacenado)) return errorHTTP(res, 404, "El archivo no se encuentra disponible.");

    const ruta = path.join(DIRECTORIO, documento.nombre_almacenado);
    let info;
    try { info = await fs.promises.stat(ruta); } catch { info = null; }
    if (!info || !info.isFile()) {
      return errorHTTP(res, 404, "El archivo no se encuentra en el almacenamiento del servidor. Contacta al administrador.");
    }

    const formato = FORMATOS[extension(documento.nombre_almacenado)];
    const enLinea = req.query.modo === "ver" && formato?.vista;
    const respaldo = documento.nombre_original.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
    res.setHeader("Content-Type", documento.tipo_mime);
    res.setHeader("Content-Length", info.size);
    res.setHeader("Content-Disposition",
      `${enLinea ? "inline" : "attachment"}; filename="${respaldo}"; filename*=UTF-8''${encodeURIComponent(documento.nombre_original)}`);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    const lectura = fs.createReadStream(ruta);
    lectura.on("error", (error) => {
      console.error("Error leyendo documento:", error);
      if (!res.headersSent) errorHTTP(res, 500, "No fue posible leer el archivo.");
      else res.destroy(error);
    });
    return lectura.pipe(res);
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
module.exports._interno = { FORMATOS, TAMANO_MAXIMO, DIRECTORIO, validarUrl, firmaCorrecta, extension };
