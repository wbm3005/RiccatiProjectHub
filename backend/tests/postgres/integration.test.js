// Ejecución explícita, fuera de npm test. Nunca carga db.js ni archivos .env.
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const crypto = require("node:crypto");
const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { cargarConDobles, servidor } = require("../helpers/http");

const configPath = process.env.RICCATI_TEST_CONFIG;
const nombres = ["riccati_s2_full", "riccati_s2_upgrade"];
const archivos = [
  "01_roles_usuarios.sql", "02_clientes_contactos.sql", "03_proyectos.sql",
  "04_ajuste_clientes.sql", "05_ajuste_proyectos.sql", "06_sprint2_clientes.sql",
  "07_sprint2_bitacora.sql",
];
const tablasSprint1 = ["roles", "usuarios", "clientes", "contactos_cliente", "prioridades_proyecto", "estados_proyecto", "proyectos", "proyecto_usuarios"];
const normalizarRuta = valor => path.resolve(valor).replace(/\\/g, "/").toLowerCase();

async function snapshot(pool) {
  const datos = {};
  for (const tabla of tablasSprint1) {
    const r = await pool.query(`SELECT row_to_json(t) AS fila FROM public.${tabla} t ORDER BY row_to_json(t)::text`);
    datos[tabla] = r.rows.map(r => r.fila);
  }
  return datos;
}

async function esquema(pool) {
  const columnas = await pool.query(`SELECT table_name, column_name, data_type,
      is_nullable, column_default, character_maximum_length, numeric_precision, numeric_scale
    FROM information_schema.columns WHERE table_schema='public'
    ORDER BY table_name, ordinal_position`);
  const constraints = await pool.query(`SELECT c.relname AS tabla, con.conname,
      pg_get_constraintdef(con.oid) AS definicion
    FROM pg_constraint con JOIN pg_class c ON c.oid=con.conrelid
    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='public'
    ORDER BY c.relname, con.conname`);
  const indices = await pool.query("SELECT tablename,indexname,indexdef FROM pg_indexes WHERE schemaname='public' ORDER BY tablename,indexname");
  const secuencias = await pool.query("SELECT sequencename,start_value,increment_by FROM pg_sequences WHERE schemaname='public' ORDER BY sequencename");
  return { columnas: columnas.rows, constraints: constraints.rows, indices: indices.rows, secuencias: secuencias.rows };
}

async function migrar(pool, desde, hasta) {
  for (const archivo of archivos.slice(desde - 1, hasta)) {
    await pool.query(fs.readFileSync(path.join(__dirname, "../../database", archivo), "utf8"));
  }
}

async function fixtures(pool) {
  const password = `Prueba1!${crypto.randomBytes(12).toString("hex")}`;
  const hash = await bcrypt.hash(password, 4);
  for (const [correo, rol] of [["admin-a", "Administrador"], ["admin-b", "Administrador"], ["asignado", "Colaborador"], ["ajeno", "Colaborador"]]) {
    await pool.query(`INSERT INTO usuarios(id_rol,nombre,apellidos,correo,password_hash)
      SELECT id_rol,$1,'Fixture',$2,$3 FROM roles WHERE nombre=$4`, [correo, `${correo}@example.test`, hash, rol]);
  }
  await pool.query(`INSERT INTO clientes(nombre_razon_social,estado) VALUES
    ('Cliente Sprint 1','ACTIVO'),('Cliente inactivo','INACTIVO'),('Otro cliente','ACTIVO');
    INSERT INTO contactos_cliente(id_cliente,nombre,es_principal) VALUES (1,'Contacto histórico',TRUE),(3,'Otro contacto',TRUE);
    INSERT INTO proyectos(codigo,nombre,id_cliente,id_contacto_principal,id_prioridad,id_estado,creado_por)
      SELECT 'S1-01','Proyecto asignado',1,1,id_prioridad,
        (SELECT id_estado FROM estados_proyecto WHERE nombre='Registrado'),1
      FROM prioridades_proyecto WHERE nombre='Media';
    INSERT INTO proyectos(codigo,nombre,id_cliente,id_prioridad,id_estado,creado_por)
      SELECT 'S1-02','Proyecto sin asignación',1,id_prioridad,
        (SELECT id_estado FROM estados_proyecto WHERE nombre='Registrado'),1
      FROM prioridades_proyecto WHERE nombre='Media';
    INSERT INTO proyecto_usuarios(id_proyecto,id_usuario,es_responsable_principal) VALUES (1,3,TRUE)`);
  return { password, hash };
}

test("PostgreSQL real: instalación, actualización y regresión HTTP/SQL", {
  skip: !configPath && "Requiere autorización y RICCATI_TEST_CONFIG de un clúster temporal independiente.",
  timeout: 180000,
}, async t => {
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const raiz = path.join(os.tmpdir(), "riccati-s2-pg-20261021");
  assert.equal(config.approved, true, "Falta autorización explícita para el entorno aislado.");
  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 55432);
  assert.equal(config.user, "riccati_test_admin");
  assert.equal(normalizarRuta(config.dataDirectory), normalizarRuta(path.join(raiz, "data")));
  assert.ok(normalizarRuta(configPath).startsWith(normalizarRuta(raiz) + "/"));
  assert.ok(typeof config.password === "string" && config.password.length >= 32);
  const conexion = database => ({
    host: config.host, port: config.port, user: config.user, password: config.password,
    database, ssl: false, connectionTimeoutMillis: 5000, max: 10,
    options: "-c statement_timeout=15000 -c lock_timeout=10000",
  });
  const admin = new Pool(conexion("postgres"));
  t.after(() => admin.end());
  const identidad = await admin.query("SELECT current_setting('data_directory') AS directorio, current_setting('cluster_name') AS nombre, host(inet_server_addr()) AS host, inet_server_port() AS puerto");
  assert.equal(normalizarRuta(identidad.rows[0].directorio), normalizarRuta(config.dataDirectory));
  assert.equal(identidad.rows[0].nombre, "riccati_s2_validation");
  assert.equal(identidad.rows[0].host, "127.0.0.1");
  assert.equal(identidad.rows[0].puerto, 55432);
  const existentes = await admin.query("SELECT datname FROM pg_database WHERE datname=ANY($1::text[])", [nombres]);
  assert.equal(existentes.rowCount, 0, "No sobrescribir bases ya existentes: preparar otro clúster con autorización.");

  const appPassword = crypto.randomBytes(32).toString("hex");
  // Valor generado hexadecimal, sin interpolar credenciales externas.
  await admin.query(`CREATE ROLE riccati_s2_app LOGIN PASSWORD '${appPassword}'`);
  process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
  process.env.JWT_EXPIRES_IN = "30m";
  let esquemaCompleto;

  for (const nombre of nombres) {
    await t.test(nombre, async escenario => {
      await admin.query(`CREATE DATABASE ${nombre} TEMPLATE template0 ENCODING 'UTF8'`);
      const db = new Pool(conexion(nombre));
      escenario.after(() => db.end());
      let fixture;
      await escenario.test("migraciones y preservación de Sprint 1", async () => {
        if (nombre.endsWith("upgrade")) {
          await migrar(db, 1, 5);
          fixture = await fixtures(db);
          const antes = await snapshot(db);
          await migrar(db, 6, 7);
          assert.deepEqual(await snapshot(db), antes);
        } else {
          await migrar(db, 1, 7);
          fixture = await fixtures(db);
        }
        const actual = await esquema(db);
        assert.equal(actual.columnas.filter(c => c.table_name === "bitacora_entradas").length, 14);
        if (esquemaCompleto) assert.deepEqual(actual, esquemaCompleto);
        else esquemaCompleto = actual;
      });

      await db.query(`GRANT CONNECT ON DATABASE ${nombre} TO riccati_s2_app;
        GRANT USAGE ON SCHEMA public TO riccati_s2_app;
        GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO riccati_s2_app;
        GRANT USAGE,SELECT ON ALL SEQUENCES IN SCHEMA public TO riccati_s2_app`);
      const appPool = new Pool({ ...conexion(nombre), user: "riccati_s2_app", password: appPassword });
      escenario.after(() => appPool.end());
      let barrera;
      const pool = {
        query: (...args) => appPool.query(...args),
        async connect() {
          const cliente = await appPool.connect();
          if (barrera) {
            const actual = barrera;
            actual.llegadas++;
            if (actual.llegadas === 2) { clearTimeout(actual.reloj); barrera = null; actual.abrir(); }
            try { await actual.promesa; } catch (error) { cliente.release(); throw error; }
          }
          return cliente;
        },
      };
      const rutas = ["auth", "usuarios", "clientes", "proyectos", "bitacora"];
      for (const ruta of [...rutas.map(r => `../../routes/${r}.routes`), "../../middleware/auth.middleware"]) delete require.cache[require.resolve(ruta)];
      const modulos = rutas.map(r => cargarConDobles(require.resolve(`../../routes/${r}.routes`), pool));
      assert.equal(require.cache[require.resolve("../../db")], undefined, "No importar la conexión principal.");
      const llamar = await servidor(escenario, app => rutas.forEach((r, i) => app.use(`/api/${r}`, modulos[i])));
      const login = async (correo, password = fixture.password) => {
        const r = await llamar("/api/auth/login", { method: "POST", body: { correo: `${correo}@example.test`, password } });
        assert.equal(r.status, 200, `Login de fixture ${correo}`);
        return r.body.token;
      };
      let tokenA = await login("admin-a"), tokenB = await login("admin-b");
      const tokenC = await login("asignado"), tokenD = await login("ajeno");
      const request = (ruta, token, method = "GET", body) => llamar(`/api/${ruta}`, {
        method, body, headers: { Authorization: `Bearer ${token}` },
      });
      const estadoUsuario = (id, token, estado) => request(`usuarios/${id}/estado`, token, "PATCH", { estado });

      await escenario.test("JWT anteriores, expirados o inválidos; permisos administrativos", async () => {
        const viejo = jwt.sign({ idUsuario: 1, rol: "Administrador" }, process.env.JWT_SECRET);
        const claims = jwt.verify(tokenA, process.env.JWT_SECRET);
        const expirado = jwt.sign({ idUsuario: 1, versionCredencial: claims.versionCredencial }, process.env.JWT_SECRET, { expiresIn: -1 });
        for (const token of [viejo, expirado, "invalido"]) assert.equal((await request("clientes", token)).status, 401);
        assert.equal((await request("usuarios", tokenC)).status, 403);
        assert.equal((await request("usuarios", tokenA)).status, 200);
        assert.equal((await estadoUsuario(1, tokenA, "INACTIVO")).status, 409);
      });
      await escenario.test("usuarios: alta, edición, bloqueo, reactivación y rol actual", async () => {
        const datos = { nombre: "Nueva", apellidos: "Cuenta", correo: "nueva@example.test", password: fixture.password, rol: "Colaborador", estado: "ACTIVO" };
        const creada = await request("usuarios", tokenA, "POST", datos);
        assert.equal(creada.status, 201);
        assert.equal((await request("usuarios", tokenA, "POST", datos)).status, 409);
        const id = creada.body.usuario.id_usuario;
        assert.equal((await request(`usuarios/${id}`, tokenA, "PUT", { ...datos, estado: "BLOQUEADO" })).status, 200);
        const denegada = await llamar("/api/auth/login", { method: "POST", body: { correo: datos.correo, password: datos.password } });
        assert.equal(denegada.status, 403);
        assert.equal((await estadoUsuario(id, tokenA, "ACTIVO")).status, 200);
        assert.equal((await estadoUsuario(3, tokenA, "INACTIVO")).status, 200);
        assert.equal((await request("clientes", tokenC)).status, 401);
        assert.equal((await estadoUsuario(3, tokenA, "ACTIVO")).status, 200);
        await db.query("UPDATE usuarios SET id_rol=(SELECT id_rol FROM roles WHERE nombre='Colaborador') WHERE id_usuario=2");
        assert.equal((await request("usuarios", tokenB)).status, 403);
        await db.query("UPDATE usuarios SET id_rol=(SELECT id_rol FROM roles WHERE nombre='Administrador') WHERE id_usuario=2");
      });
      await escenario.test("clientes: lectura compatible y escrituras solo de administrador", async () => {
        for (const token of [tokenA, tokenC]) {
          const r = await request("clientes", token);
          assert.equal(r.status, 200);
          assert.ok(Array.isArray(r.body));
        }
        for (const [ruta, method] of [["clientes", "POST"], ["clientes/1", "PUT"], ["clientes/1/estado", "PUT"], ["clientes/1/contactos", "POST"], ["clientes/1/contactos/1", "PUT"]]) {
          assert.equal((await request(ruta, tokenC, method, {})).status, 403);
        }
        const ficha = await request("clientes/1", tokenC);
        assert.equal(ficha.status, 200);
        assert.deepEqual(ficha.body.proyectos.map(p => p.id_proyecto), [1]);
        assert.equal((await request("clientes/1", tokenA)).body.proyectos.length, 2);
        const creada = await request("clientes", tokenA, "POST", { nombre_razon_social: "Cliente nuevo", contactoPrincipal: { nombre: "Contacto nuevo" } });
        assert.equal(creada.status, 201);
        const nuevaFicha = await request(`clientes/${creada.body.cliente.id_cliente}`, tokenA);
        assert.equal(nuevaFicha.body.contactos.length, 1);
        assert.equal(nuevaFicha.body.contactos[0].es_principal, true);
      });
      await escenario.test("contactos: crear, editar y mantener un principal", async () => {
        const r = await request("clientes/1/contactos", tokenA, "POST", { nombre: "Segundo contacto", es_principal: true });
        assert.equal(r.status, 201);
        const id = r.body.contacto.id_contacto;
        assert.equal((await request(`clientes/1/contactos/${id}`, tokenA, "PUT", { nombre: "Contacto editado", es_principal: true, estado: "ACTIVO" })).status, 200);
        assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM contactos_cliente WHERE id_cliente=1 AND es_principal")).rows[0].total, 1);
        assert.equal((await request(`clientes/3/contactos/${id}`, tokenA, "PUT", { nombre: "Ajeno" })).status, 404);
      });
      await escenario.test("estados de clientes: justificación, auditoría e historial", async () => {
        assert.equal((await request("clientes/1/estado", tokenA, "PUT", { estado: "INACTIVO" })).status, 400);
        assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM clientes_cambios_estado")).rows[0].total, 0);
        assert.equal((await request("clientes/1/estado", tokenA, "PUT", { estado: "INACTIVO", justificacion: "Cierre administrativo de prueba" })).status, 200);
        const cambio = (await db.query("SELECT * FROM clientes_cambios_estado ORDER BY id_cambio")).rows[0];
        assert.equal(cambio.id_usuario, 1);
        assert.equal(cambio.estado_anterior, "ACTIVO");
        assert.equal(cambio.estado_nuevo, "INACTIVO");
        assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM proyectos WHERE id_cliente=1")).rows[0].total, 2);
        assert.equal((await request("clientes/1/estado", tokenA, "PUT", { estado: "ACTIVO" })).status, 200);
        assert.equal((await request("clientes/1", tokenA, "PUT", { nombre_razon_social: "Cliente editado", estado: "INACTIVO" })).body.cliente.estado, "ACTIVO");
      });
      await escenario.test("regresión de proyectos y asociaciones activas/históricas", async () => {
        assert.equal((await request("proyectos", tokenA)).status, 200);
        assert.equal((await request("proyectos/1", tokenC)).status, 200);
        const prioridad = (await request("proyectos/catalogos/prioridades", tokenA)).body[0].id_prioridad;
        const datos = { nombre: "Proyecto API", id_cliente: 3, id_contacto_principal: 2, id_prioridad: prioridad, id_responsable: 3 };
        const creado = await request("proyectos", tokenA, "POST", datos);
        assert.equal(creado.status, 201);
        const id = creado.body.proyecto.id_proyecto;
        assert.equal((await request(`proyectos/${id}`, tokenA, "PUT", { ...datos, id_cliente: 2, id_contacto_principal: null })).status, 400);
        assert.equal((await request(`proyectos/${id}`, tokenA, "PUT", { ...datos, id_contacto_principal: 1 })).status, 400);
        assert.equal((await request("clientes/3/estado", tokenA, "PUT", { estado: "INACTIVO", justificacion: "Prueba de asociación histórica" })).status, 200);
        assert.equal((await request(`proyectos/${id}`, tokenA, "PUT", { ...datos, nombre: "Edición histórica" })).status, 200);
        assert.equal((await request("proyectos", tokenA, "POST", datos)).status, 400);
        assert.equal((await request("clientes/3/estado", tokenA, "PUT", { estado: "ACTIVO" })).status, 200);
      });

      let entrada;
      const actividad = { titulo: "Avance de prueba", contenido: "Descripción de avance verificable", horas: 2.5, descripcion_esfuerzo: "" };
      await escenario.test("bitácora: asignación, actividades, esfuerzo y comentarios persistidos", async () => {
        const lista = await request("bitacora/proyectos", tokenC);
        assert.equal(lista.status, 200);
        assert.ok(lista.body.some(p => p.id_proyecto === 1));
        assert.ok(!lista.body.some(p => p.id_proyecto === 2));
        assert.equal((await request("bitacora/proyectos/1/cronologia", tokenD)).status, 403);
        assert.equal((await request("bitacora/proyectos/1/actividades", tokenD, "POST", actividad)).status, 403);
        for (const horas of [0, 25, "2.999"]) assert.equal((await request("bitacora/proyectos/1/actividades", tokenC, "POST", { ...actividad, horas })).status, 400);
        assert.equal((await request("bitacora/proyectos/1/actividades", tokenC, "POST", { ...actividad, horas: null })).status, 400);
        const creada = await request("bitacora/proyectos/1/actividades", tokenC, "POST", actividad);
        assert.equal(creada.status, 201);
        entrada = creada.body.entrada.id_entrada;
        assert.equal((await request("bitacora/proyectos/1/actividades", tokenC, "POST", { ...actividad, horas: null, descripcion_esfuerzo: "Revisión cualitativa del avance" })).status, 201);
        assert.equal((await request("bitacora/proyectos/1/comentarios", tokenC, "POST", { contenido: "Comentario persistente" })).status, 201);
        const cronologia = await request("bitacora/proyectos/1/cronologia", tokenC);
        assert.equal(cronologia.status, 200);
        assert.equal(cronologia.body.total, 3);
        assert.equal(cronologia.body.resumen.actividades, 2);
        assert.equal(Number(cronologia.body.resumen.horas), 2.5);
        assert.equal(cronologia.body.resumen.comentarios, 1);
      });
      await escenario.test("correcciones: originales, JSONB anterior/nuevo y restricciones temporales", async () => {
        const datos = { ...actividad, titulo: "Avance corregido" };
        assert.equal((await request(`bitacora/actividades/${entrada}`, tokenC, "PUT", datos)).status, 200);
        const registro = (await db.query("SELECT * FROM bitacora_entradas WHERE id_entrada=$1", [entrada])).rows[0];
        assert.equal(registro.titulo_inicial, actividad.titulo);
        assert.equal(registro.titulo, datos.titulo);
        const auditoria = (await db.query("SELECT * FROM bitacora_correcciones WHERE id_entrada=$1", [entrada])).rows[0];
        assert.equal(auditoria.anterior.titulo, actividad.titulo);
        assert.equal(auditoria.nuevo.titulo, datos.titulo);
        assert.equal((await request(`bitacora/actividades/${entrada}`, tokenC, "PUT", datos)).status, 400);
        await db.query("UPDATE bitacora_entradas SET creado_en=CURRENT_TIMESTAMP-INTERVAL '25 hours' WHERE id_entrada=$1", [entrada]);
        assert.equal((await request(`bitacora/actividades/${entrada}`, tokenC, "PUT", actividad)).status, 403);
        assert.equal((await request(`bitacora/actividades/${entrada}`, tokenA, "PUT", actividad)).status, 400);
        assert.equal((await request(`bitacora/actividades/${entrada}`, tokenA, "PUT", { ...actividad, justificacion: "Corrección administrativa de prueba" })).status, 200);
        const historial = await request("bitacora/proyectos/1/cronologia?tipo=CORRECCION", tokenA);
        assert.equal(historial.status, 200);
        assert.equal(historial.body.total, 2);
        assert.ok(historial.body.eventos.every(e => e.tipo_evento === "CORRECCION" && e.anterior && e.nuevo));
      });
      await escenario.test("cronología SQL: filtros, orden y paginación sin duplicados", async () => {
        for (let i = 0; i < 9; i++) assert.equal((await request("bitacora/proyectos/1/comentarios", tokenC, "POST", { contenido: `Comentario paginado ${i}` })).status, 201);
        const primera = await request("bitacora/proyectos/1/cronologia?pagina=1&limite=8", tokenC);
        const segunda = await request("bitacora/proyectos/1/cronologia?pagina=2&limite=8", tokenC);
        assert.equal(primera.status, 200);
        assert.equal(segunda.status, 200);
        assert.equal(primera.body.total, 14);
        assert.equal(primera.body.eventos.length, 8);
        assert.equal(segunda.body.eventos.length, 6);
        assert.equal(new Set([...primera.body.eventos, ...segunda.body.eventos].map(e => e.clave)).size, 14);
        for (let i = 1; i < primera.body.eventos.length; i++) assert.ok(new Date(primera.body.eventos[i - 1].fecha_evento) >= new Date(primera.body.eventos[i].fecha_evento));
      });
      await escenario.test("constraints reales de horas, referencias y correcciones distintas", async () => {
        const insert = `INSERT INTO bitacora_entradas(id_proyecto,id_usuario,tipo,titulo,contenido,horas,titulo_inicial,contenido_inicial,horas_iniciales)
          VALUES ($1,3,'ACTIVIDAD','Prueba constraint','Contenido de prueba',$2,'Original','Contenido de prueba',$2)`;
        await assert.rejects(db.query(insert, [1, 25]), { code: "23514" });
        await assert.rejects(db.query(insert, [999999, 1]), { code: "23503" });
        await assert.rejects(db.query("INSERT INTO bitacora_correcciones(id_entrada,id_usuario_corrector,anterior,nuevo) VALUES ($1,1,'{}','{}')", [entrada]), { code: "23514" });
        await assert.rejects(db.query("DELETE FROM proyectos WHERE id_proyecto=1"), { code: "23503" });
      });
      await escenario.test("rollback atómico cuando falla la auditoría de corrección", async () => {
        const antes = (await db.query("SELECT titulo,contenido,horas FROM bitacora_entradas WHERE id_entrada=$1", [entrada])).rows;
        const total = (await db.query("SELECT COUNT(*)::int AS total FROM bitacora_correcciones")).rows[0].total;
        await db.query(`CREATE FUNCTION forzar_fallo_auditoria() RETURNS trigger LANGUAGE plpgsql AS $$ BEGIN RAISE EXCEPTION 'Fallo sintético para comprobar rollback'; END $$;
          CREATE TRIGGER prueba_rollback BEFORE INSERT ON bitacora_correcciones FOR EACH ROW EXECUTE FUNCTION forzar_fallo_auditoria()`);
        try {
          assert.equal((await request(`bitacora/actividades/${entrada}`, tokenA, "PUT", { ...actividad, titulo: "Este cambio debe revertirse", justificacion: "Prueba controlada de rollback" })).status, 500);
          assert.deepEqual((await db.query("SELECT titulo,contenido,horas FROM bitacora_entradas WHERE id_entrada=$1", [entrada])).rows, antes);
          assert.equal((await db.query("SELECT COUNT(*)::int AS total FROM bitacora_correcciones")).rows[0].total, total);
        } finally {
          await db.query("DROP TRIGGER prueba_rollback ON bitacora_correcciones; DROP FUNCTION forzar_fallo_auditoria()");
        }
      });
      await escenario.test("cambio de contraseña invalida JWT y conserva el login posterior", async () => {
        const nueva = `Nueva1!${crypto.randomBytes(12).toString("hex")}`;
        assert.equal((await request("auth/cambiar-contrasena", tokenA, "PUT", { passwordActual: fixture.password, passwordNueva: nueva, confirmarPassword: nueva })).status, 200);
        assert.equal((await request("clientes", tokenA)).status, 401);
        tokenA = await login("admin-a", nueva);
        fixture.passwordA = nueva;
        assert.equal((await request("clientes", tokenA)).status, 200);
      });
      for (const metodos of [["PATCH", "PATCH"], ["PUT", "PUT"], ["PUT", "PATCH"], ["PATCH", "PUT"]]) {
        await escenario.test(`concurrencia PostgreSQL ${metodos.join("/")}`, async () => {
          await db.query("UPDATE usuarios SET estado='ACTIVO',id_rol=(SELECT id_rol FROM roles WHERE nombre='Administrador') WHERE id_usuario IN (1,2)");
          tokenA = await login("admin-a", fixture.passwordA);
          tokenB = await login("admin-b");
          let abrir, fallar;
          const promesa = new Promise((resolve, reject) => { abrir = resolve; fallar = reject; });
          barrera = { llegadas: 0, promesa, abrir, reloj: setTimeout(() => fallar(new Error("No llegaron ambas operaciones a la barrera.")), 8000) };
          const respuestas = await Promise.all(metodos.map((method, i) => {
            const id = i === 0 ? 2 : 1;
            const token = i === 0 ? tokenA : tokenB;
            return request(`usuarios/${id}${method === "PATCH" ? "/estado" : ""}`, token, method,
              method === "PATCH" ? { estado: "INACTIVO" } : { nombre: `Admin ${id}`, apellidos: "Fixture", correo: `admin-${id === 1 ? "a" : "b"}@example.test`, rol: "Colaborador", estado: "ACTIVO" });
          }));
          assert.deepEqual(respuestas.map(r => r.status).sort(), [200, 403]);
          const activos = await db.query("SELECT COUNT(*)::int AS total FROM usuarios u JOIN roles r ON r.id_rol=u.id_rol WHERE u.estado='ACTIVO' AND r.nombre='Administrador'");
          assert.equal(activos.rows[0].total, 1);
          const bloqueos = await db.query("SELECT COUNT(*)::int AS total FROM pg_locks WHERE relation='usuarios'::regclass AND mode='ShareRowExclusiveLock'");
          assert.equal(bloqueos.rows[0].total, 0);
        });
      }
    });
  }
});
