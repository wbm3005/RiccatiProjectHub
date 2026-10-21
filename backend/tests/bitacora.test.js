// Pruebas simuladas aisladas: no conectan a PostgreSQL ni usan credenciales reales.
const assert = require("node:assert/strict");
const test = require("node:test");
const Module = require("node:module");
const express = require("express");

const entradas = [];
const correcciones = [];
let idSeq = 1;

function fakeRows(rows) { return { rows, rowCount: rows.length }; }
const pool = {
  connect: async () => ({ query: pool.query, release() {} }),
  async query(sql, params = []) {
    if (/^\s*(BEGIN|COMMIT|ROLLBACK)/.test(sql)) return fakeRows([]);
    if (sql.includes("FROM proyectos p") && sql.includes("WHERE p.id_proyecto = $1")) {
      if (+params[0] !== 1) return fakeRows([]);
      return fakeRows([{ id_proyecto: 1, codigo: "PRJ-0001", nombre: "Proyecto prueba", estado: "En curso", cliente: "Cliente demo", asignado: params[1] === 2 }]);
    }
    if (sql.includes("FROM proyectos p") && sql.includes("WHERE $1::boolean")) return fakeRows([{ id_proyecto: 1, nombre: "Proyecto prueba" }]);
    if (sql.includes("INSERT INTO bitacora_entradas")) {
      const actividad = sql.includes("'ACTIVIDAD'");
      const ahora = new Date();
      const entrada = actividad ? {
        id_entrada: idSeq++, id_proyecto: params[0], id_usuario: params[1], tipo: "ACTIVIDAD",
        titulo: params[2], contenido: params[3], horas: params[4], descripcion_esfuerzo: params[5],
        titulo_inicial: params[2], contenido_inicial: params[3], horas_iniciales: params[4],
        descripcion_esfuerzo_inicial: params[5], creado_en: ahora,
      } : { id_entrada: idSeq++, id_proyecto: params[0], id_usuario: params[1], tipo: "COMENTARIO", contenido: params[2], creado_en: ahora };
      entradas.push(entrada);
      return fakeRows([{ id_entrada: entrada.id_entrada, creado_en: ahora }]);
    }
    if (sql.includes("FROM bitacora_entradas e WHERE id_entrada=$1 FOR UPDATE")) {
      const entrada = entradas.find(e => e.id_entrada === params[0]);
      return fakeRows(entrada ? [{ ...entrada, dentro_plazo: Date.now() - new Date(entrada.creado_en).getTime() < 86400000 }] : []);
    }
    if (sql.includes("UPDATE bitacora_entradas SET titulo=")) {
      const entrada = entradas.find(e => e.id_entrada === params[4]);
      if (entrada) Object.assign(entrada, { titulo: params[0], contenido: params[1], horas: params[2], descripcion_esfuerzo: params[3] });
      return fakeRows([]);
    }
    if (sql.includes("INSERT INTO bitacora_correcciones")) {
      correcciones.push({ id_entrada: params[0], corrector: params[1], anterior: JSON.parse(params[2]), nuevo: JSON.parse(params[3]), justificacion: params[4] });
      return fakeRows([]);
    }
    if (sql.includes("COUNT(*)::int AS total FROM eventos")) return fakeRows([{ total: entradas.length + correcciones.length }]);
    if (sql.includes("SELECT * FROM eventos")) return fakeRows([]);
    if (sql.includes("COUNT(*) FILTER")) return fakeRows([{ actividades: entradas.filter(e=>e.tipo==='ACTIVIDAD').length, comentarios: entradas.filter(e=>e.tipo==='COMENTARIO').length, horas: 0, correcciones: correcciones.length }]);
    throw new Error(`Consulta no simulada: ${sql.slice(0,120)}`);
  },
};
const loadOriginal = Module._load;
Module._load = function(request, parent, isMain) {
  if (parent?.filename?.endsWith("bitacora.routes.js") && request === "../db") return pool;
  if (parent?.filename?.endsWith("bitacora.routes.js") && request === "../middleware/auth.middleware") {
    return { autenticarToken: (req, res, next) => {
      req.usuario = { idUsuario: Number(req.headers["x-user"] || 2), rol: req.headers["x-role"] || "Colaborador" };
      next();
    } };
  }
  return loadOriginal.apply(this, arguments);
};
const bitacora = require("../routes/bitacora.routes");
Module._load = loadOriginal;
const app = express();
app.use(express.json());
app.use("/api/bitacora", bitacora);
let server, base;
function llamada(ruta, { metodo = "GET", datos, rol = "Colaborador", usuario = 2 } = {}) {
  return fetch(`${base}/api/bitacora${ruta}`, {
    method: metodo,
    headers: { "Content-Type": "application/json", "x-role": rol, "x-user": String(usuario) },
    body: datos ? JSON.stringify(datos) : undefined,
  }).then(async r => ({ status: r.status, body: await r.json() }));
}
const actividad = { titulo: "Revisión de planos", contenido: "Se revisaron los planos del proyecto.", horas: 2.5, descripcion_esfuerzo: "" };

test("M04 end-to-end simulada de rutas y permisos", async t => {
  server = app.listen(0, "127.0.0.1");
  await new Promise(resolve => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  t.after(() => new Promise(resolve => server.close(resolve)));

  await t.test("RN-008: sin horas exige descripción de esfuerzo", async () => {
    const r = await llamada("/proyectos/1/actividades", { metodo: "POST", datos: {...actividad, horas: "", descripcion_esfuerzo: ""} });
    assert.equal(r.status, 400);
    assert.match(r.body.mensaje, /esfuerzo/);
  });
  await t.test("RN-008: horas no válidas (cero o más de 24)", async () => {
    for (const horas of [0, 24.1, -1, 100, "2.999"]) {
      const r = await llamada("/proyectos/1/actividades", { metodo: "POST", datos: {...actividad, horas} });
      assert.equal(r.status, 400);
    }
  });
  await t.test("Colaborador sin asignación recibe HTTP 403", async () => {
    const r = await llamada("/proyectos/1/actividades", { metodo: "POST", usuario: 3, datos: actividad });
    assert.equal(r.status, 403);
    assert.equal(entradas.length, 0);
  });
  await t.test("El colaborador asignado registra actividad", async () => {
    const r = await llamada("/proyectos/1/actividades", { metodo: "POST", datos: actividad });
    assert.equal(r.status, 201);
    assert.equal(entradas[0].titulo, "Revisión de planos");
  });
  await t.test("Comentarios se guardan sin esfuerzo/horas", async () => {
    const r = await llamada("/proyectos/1/comentarios", { metodo: "POST", datos: { contenido: "Revisaremos las medidas mañana." } });
    assert.equal(r.status, 201);
    assert.equal(entradas[1].tipo, "COMENTARIO");
  });
  await t.test("Cronología paginada contiene resumen y proyecto", async () => {
    const r = await llamada("/proyectos/1/cronologia?pagina=1&limite=8");
    assert.equal(r.status, 200);
    assert.equal(r.body.resumen.actividades, 1);
    assert.equal(r.body.proyecto.codigo, "PRJ-0001");
  });
  await t.test("RN-009: colaborador corrige su propia actividad y deja auditoría", async () => {
    const r = await llamada("/actividades/1", { metodo: "PUT", datos: {...actividad, titulo: "Planos revisados y verificados"} });
    assert.equal(r.status, 200);
    assert.equal(correcciones.length, 1);
    assert.equal(correcciones[0].anterior.titulo, "Revisión de planos");
    assert.equal(correcciones[0].nuevo.titulo, "Planos revisados y verificados");
  });
  await t.test("RN-009: un colaborador ajeno no puede corregir", async () => {
    const r = await llamada("/actividades/1", { metodo: "PUT", usuario: 3, datos: {...actividad, titulo:"Edición ajena"} });
    assert.equal(r.status, 403);
  });
  await t.test("RN-009: después de 24 horas el colaborador no puede corregir", async () => {
    entradas[0].creado_en = new Date(Date.now() - 25 * 3600000);
    const r = await llamada("/actividades/1", { metodo: "PUT", datos: {...actividad, titulo:"Edición fuera de plazo"} });
    assert.equal(r.status, 403);
  });
  await t.test("Administrador fuera de plazo requiere motivo y registra auditoría", async () => {
    const sinMotivo = await llamada("/actividades/1", { metodo: "PUT", rol: "Administrador", usuario: 1, datos: {...actividad, titulo:"Edición admin"} });
    assert.equal(sinMotivo.status, 400);
    const conMotivo = await llamada("/actividades/1", { metodo: "PUT", rol: "Administrador", usuario: 1, datos: {...actividad, titulo:"Edición admin", justificacion:"Corrección administrativa por error material."} });
    assert.equal(conMotivo.status, 200);
    assert.equal(correcciones.length, 2);
  });
  await t.test("No se permite corregir sin cambiar datos", async () => {
    const r = await llamada("/actividades/1", { metodo: "PUT", rol: "Administrador", usuario: 1, datos: {...actividad, titulo:"Edición admin", justificacion:"Se revisaron los datos originales."} });
    assert.equal(r.status, 400);
    assert.equal(correcciones.length, 2);
  });
});
