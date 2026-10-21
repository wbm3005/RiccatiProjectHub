const assert = require("node:assert/strict");
const test = require("node:test");
const { cargarConDobles, servidor, filas, authSimulada } = require("./helpers/http");

function baseSimulada(conexionesEsperadas = 1) {
  const datos = new Map([1, 2].map(id => [id, {
    id_usuario: id, estado: "ACTIVO", rol: "Administrador", correo: `admin${id}@example.test`,
    nombre: "Admin", apellidos: String(id),
  }]));
  let cola = Promise.resolve();
  let abrirBarrera;
  const barrera = new Promise(resolve => { abrirBarrera = resolve; });
  const registro = { conexiones: 0, commits: 0, rollbacks: 0, liberaciones: 0 };
  const pool = {
    query() { throw new Error("La edición debe usar la misma conexión transaccional."); },
    async connect() {
      if (++registro.conexiones === conexionesEsperadas) abrirBarrera();
      await barrera;
      let desbloquear, copia;
      return {
        async query(sql, params = []) {
          const q = sql.replace(/\s+/g, " ").trim();
          if (q === "BEGIN") return filas([]);
          if (q === "LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE") {
            const anterior = cola;
            cola = new Promise(resolve => { desbloquear = resolve; });
            await anterior;
            copia = new Map([...datos].map(([id, u]) => [id, { ...u }]));
            return filas([]);
          }
          assert.ok(copia, "No se pueden leer o modificar cuentas antes de adquirir el bloqueo.");
          if (q === "COMMIT" || q === "ROLLBACK") {
            if (q === "COMMIT") {
              datos.clear();
              for (const [id, u] of copia) datos.set(id, u);
              registro.commits++;
            } else registro.rollbacks++;
            desbloquear();
            return filas([]);
          }
          if (q.includes("r.activo = TRUE")) {
            const actor = copia.get(Number(params[0]));
            return filas(actor?.estado === "ACTIVO" && actor.rol === "Administrador" ? [actor] : []);
          }
          if (q.includes("COUNT(*)::int")) return filas([{ total: [...copia.values()].filter(u => u.estado === "ACTIVO" && u.rol === "Administrador").length }]);
          if (q.includes("LOWER(correo)")) return filas([]);
          if (q.startsWith("SELECT id_rol")) return filas([{ id_rol: params[0] === "Administrador" ? 1 : 2 }]);
          if (q.startsWith("UPDATE usuarios SET estado")) {
            const u = copia.get(Number(params[1]));
            u.estado = params[0];
            return filas([{ ...u }]);
          }
          if (q.startsWith("UPDATE usuarios SET id_rol")) {
            const u = copia.get(Number(params.at(-1)));
            Object.assign(u, { rol: params[0] === 1 ? "Administrador" : "Colaborador", nombre: params[1], apellidos: params[2], correo: params[3], estado: params.at(-2) });
            return filas([]);
          }
          if (q.startsWith("SELECT")) {
            const u = copia.get(Number(params[0]));
            return filas(u ? [{ ...u }] : []);
          }
          throw new Error(`Consulta no simulada: ${q}`);
        },
        release() { registro.liberaciones++; },
      };
    },
  };
  return { pool, datos, registro };
}

for (const metodos of [["PATCH", "PATCH"], ["PUT", "PUT"], ["PUT", "PATCH"], ["PATCH", "PUT"]]) {
  test(`Dos administradores preautorizados modifican al otro simultáneamente (${metodos.join("/")})`, async t => {
    const { pool, datos, registro } = baseSimulada(2);
    const rutas = cargarConDobles(require.resolve("../routes/usuarios.routes"), pool, authSimulada);
    const llamar = await servidor(t, app => app.use("/usuarios", rutas));
    const respuestas = await Promise.all(metodos.map((method, i) => {
      const actor = i + 1;
      const destino = actor === 1 ? 2 : 1;
      return llamar(`/usuarios/${destino}${method === "PATCH" ? "/estado" : ""}`, {
        method, headers: { "x-user": String(actor) },
        body: method === "PATCH" ? { estado: "INACTIVO" } : {
          nombre: "Admin", apellidos: String(destino), correo: `admin${destino}@example.test`,
          rol: "Colaborador", estado: "ACTIVO",
        },
      });
    }));
    assert.deepEqual(respuestas.map(r => r.status).sort(), [200, 403]);
    assert.equal([...datos.values()].filter(u => u.rol === "Administrador" && u.estado === "ACTIVO").length, 1);
    assert.equal(registro.commits, 1);
    assert.equal(registro.rollbacks, 1);
    assert.equal(registro.liberaciones, 2);
  });
}

test("La propia cuenta administrativa no puede inactivarse, bloquearse ni perder su rol", async t => {
  const { pool, datos, registro } = baseSimulada();
  const rutas = cargarConDobles(require.resolve("../routes/usuarios.routes"), pool, authSimulada);
  const llamar = await servidor(t, app => app.use("/usuarios", rutas));
  const casos = [
    { ruta: "/usuarios/1/estado", method: "PATCH", body: { estado: "INACTIVO" } },
    ...[ ["Administrador", "INACTIVO"], ["Administrador", "BLOQUEADO"], ["Colaborador", "ACTIVO"] ].map(([rol, estado]) => ({
      ruta: "/usuarios/1", method: "PUT", body: { nombre: "Admin", apellidos: "Uno", correo: "admin1@example.test", rol, estado },
    })),
  ];
  for (const { ruta, ...opciones } of casos) assert.equal((await llamar(ruta, opciones)).status, 409);
  assert.equal(datos.get(1).estado, "ACTIVO");
  assert.equal(datos.get(1).rol, "Administrador");
  assert.equal(registro.rollbacks, casos.length);
  assert.equal(registro.commits, 0);
});
