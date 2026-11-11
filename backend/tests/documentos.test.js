// Pruebas aisladas de M05 (Sprint 3): no conectan a PostgreSQL ni escriben en la carpeta real.
const assert = require("node:assert/strict");
const test = require("node:test");
const path = require("node:path");
const os = require("node:os");
const fs = require("node:fs");
const { cargarConDobles, filas, authSimulada } = require("./helpers/http");

const carpeta = fs.mkdtempSync(path.join(os.tmpdir(), "riccati-docs-"));
process.env.DOCUMENTOS_DIR = carpeta;
const documentos = [];
const versiones = [];
const pool = {
  connect: async () => ({ query: pool.query, release() {} }),
  async query(sql, p = []) {
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/.test(sql)) return filas([]);
    if (sql.includes("INSERT INTO documento_versiones")) { versiones.push(p); return filas([]); }
    if (sql.includes("FROM proyectos p") && sql.includes("WHERE p.id_proyecto = $1")) {
      if (+p[0] !== 1) return filas([]);
      return filas([{ id_proyecto: 1, codigo: "PRJ-0001", nombre: "Proyecto prueba", estado: "En curso", cliente: "Cliente", asignado: p[1] === 2 }]);
    }
    if (sql.includes("FROM tipos_documento WHERE id_tipo_documento")) return filas(+p[0] === 1 ? [{ id_tipo_documento: 1 }] : []);
    if (sql.includes("INSERT INTO documentos_proyecto")) { documentos.push(p); return filas([{ id_documento: documentos.length, creado_en: new Date() }]); }
    throw new Error("Consulta no simulada: " + sql.slice(0, 80));
  },
};
const ruta = require.resolve("../routes/documentos.routes");
const router = cargarConDobles(ruta, pool, authSimulada);
const { validarUrl, firmaCorrecta, FORMATOS, extension } = router._interno;
const PDF = Buffer.from("%PDF-1.4\n%%EOF\n");

test("M05: validaciones de vínculos y firmas de archivo", () => {
  assert.equal(validarUrl("https://drive.google.com/x").url, "https://drive.google.com/x");
  assert.ok(validarUrl("javascript:alert(1)").error);
  assert.ok(validarUrl("ftp://servidor/archivo").error);
  assert.ok(validarUrl("https://u:clave@ejemplo.com").error);
  assert.ok(validarUrl("").error);
  assert.equal(extension("Planta Nivel 1.PDF"), "pdf");
  assert.ok(firmaCorrecta(PDF, FORMATOS.pdf));
  assert.ok(!firmaCorrecta(Buffer.from("<html>"), FORMATOS.pdf));
});

test("M05: carga de archivos con permisos y validaciones", async t => {
  t.after(() => fs.rmSync(carpeta, { recursive: true, force: true }));
  const express = require("express");
  // Se usan peticiones binarias directas contra un servidor efímero propio.
  const app = express();
  app.use(express.json());
  app.use("/api/documentos", router);
  const srv = app.listen(0, "127.0.0.1");
  await new Promise(r => srv.once("listening", r));
  t.after(() => new Promise(r => { srv.close(r); srv.closeAllConnections(); }));
  const base = `http://127.0.0.1:${srv.address().port}/api/documentos`;
  const enviar = (cuerpo, h = {}, proyecto = 1) => fetch(`${base}/proyectos/${proyecto}/archivos`, {
    method: "POST", body: cuerpo,
    headers: { "Content-Type": "application/octet-stream", "x-user": "2", "x-role": "Colaborador",
      "X-Documento-Nombre": encodeURIComponent("Plano de prueba"), "X-Documento-Tipo": "1",
      "X-Archivo-Nombre": encodeURIComponent("plano.pdf"), ...h },
  }).then(async r => ({ status: r.status, body: await r.json() }));

  let r = await enviar(PDF);
  assert.equal(r.status, 201, r.body.mensaje);
  assert.equal(fs.readdirSync(carpeta).length, 1);
  assert.equal(documentos[0][2], "Plano de prueba");
  assert.equal(documentos[0][9], 2, "registra el usuario que cargó el archivo");
  assert.equal(versiones.length, 1, "la carga inicial queda registrada como versión 1");

  r = await enviar(PDF, { "x-user": "3" });
  assert.equal(r.status, 403, "colaborador sin asignación");
  r = await enviar(PDF, {}, 99);
  assert.equal(r.status, 404, "proyecto inexistente");
  r = await enviar(Buffer.from("MZ"), { "X-Archivo-Nombre": "virus.exe" });
  assert.equal(r.status, 400, "extensión no permitida");
  r = await enviar(Buffer.from("<html></html>"));
  assert.equal(r.status, 400, "contenido que no corresponde a la extensión");
  r = await enviar(PDF, { "X-Documento-Tipo": "9" });
  assert.equal(r.status, 400, "tipo de documento inexistente");
  r = await enviar(Buffer.concat([PDF, Buffer.alloc(10 * 1024 * 1024)]));
  assert.equal(r.status, 413, "archivo mayor a 10 MB");
  assert.equal(fs.readdirSync(carpeta).length, 1, "los rechazos no dejan archivos");
  assert.equal(documentos.length, 1, "los rechazos no crean registros");
});
