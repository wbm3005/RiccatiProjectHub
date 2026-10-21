# Integración de Sprint 2

La integración parte de `d0412bf` en `sprint-2`, que contiene el merge de
Sprint 1. Se incorporaron archivos seleccionados de
`sprint2-reference/RiccatiProjectHubSprint2/RiccatiProjectHub` sin importar
su historial, dependencias instaladas, secretos ni metadatos de Git.
La integración se organiza en los cuatro commits funcionales autorizados por
el usuario. La publicación mediante push sigue pendiente de autorización.

## Funcionalidades y decisiones

- **M01, cuentas:** perfil, cambio de contraseña, inactivación/reactivación y
  protección de administradores. El login y el middleware usan HS256 y una
  huella HMAC del hash de contraseña. Los JWT anteriores a esta integración
  requieren un nuevo login; cambiar la contraseña invalida los JWT existentes.
  El middleware comprueba estado, rol y activación del rol en cada petición.
- **Concurrencia de administradores:** PUT y PATCH utilizan una conexión y
  transacción por petición. `LOCK TABLE usuarios IN SHARE ROW EXCLUSIVE MODE`
  serializa los cambios; después del bloqueo se comprueban otra vez los
  permisos del actor. Esto también detiene una petición preautorizada cuyo
  actor acaba de ser inactivado o degradado por otro administrador. El conteo,
  actualización y lectura de respuesta ocurren dentro de la transacción.
  El bloqueo se libera por COMMIT o ROLLBACK, también en validaciones fallidas.
  Las escrituras de cuentas se serializan durante esa transacción.
- **M02, clientes:** consultas para ambos roles; creación, edición y cambios
  de estado de clientes/contactos solo para administradores. Filtros,
  paginación de la lista en el navegador e historial de proyectos visibles
  según las asignaciones del usuario. Los cambios de estado quedan auditados;
  inactivar con proyectos abiertos exige justificación. La edición general
  de la ficha no modifica el estado ni elude la auditoría.
- **Proyectos y clientes:** crear o reasignar requiere cliente activo. Al
  editar se permite conservar el cliente histórico aunque esté inactivo,
  para no bloquear cambios de otros datos. Lo mismo aplica al contacto
  histórico: un contacto nuevo debe estar activo y pertenecer al cliente.
  La edición bloquea el cliente y el proyecto hasta terminar su transacción.
  El selector ofrece clientes/contactos activos y la asociación histórica.
- **M04, bitácora:** actividades, comentarios, horas o descripción del
  esfuerzo, cronología paginada y correcciones con valores anteriores/nuevos.
  Los colaboradores acceden a proyectos asignados y corrigen actividades
  propias dentro de 24 horas. El administrador puede corregir fuera de ese
  alcance indicando justificación. No hay rutas de borrado de entradas.
- **Interfaz:** diseño compartido, navegación móvil, modales en portales,
  iconos Lucide, metadatos HTML y favicon. Los avisos de éxito están en la
  hoja global para que bitácora no dependa de los estilos de clientes.

No se identificó una discrepancia con los permisos de clientes aprobados.
Los permisos existentes de proyectos no se ampliaron ni restringieron como
parte de esta integración. La autorización efectiva reside en el backend;
ocultar controles en la interfaz no sustituye esa comprobación.

## Archivos modificados

Todos los caminos son relativos a la raíz del repositorio.

| Grupo | Archivos existentes modificados |
| --- | --- |
| Backend compartido | `backend/package.json`, `backend/server.js`, `backend/middleware/auth.middleware.js` |
| API | `backend/routes/auth.routes.js`, `backend/routes/usuarios.routes.js`, `backend/routes/clientes.routes.js`, `backend/routes/proyectos.routes.js` |
| Frontend y recursos | `frontend/package.json`, `frontend/package-lock.json`, `frontend/index.html`, `frontend/public/favicon.svg` |
| Rutas | `frontend/src/App.jsx` |
| Componentes de clientes | `frontend/src/components/ClienteModal.jsx`, `frontend/src/components/ClienteFichaModal.jsx`, `frontend/src/components/ContactoModal.jsx` |
| Componentes de proyectos | `frontend/src/components/ProyectoModal.jsx`, `frontend/src/components/ProyectoFichaModal.jsx` |
| Componentes compartidos | `frontend/src/components/RiccatiLayout.jsx`, `frontend/src/components/Sidebar.jsx`, `frontend/src/components/StatCard.jsx`, `frontend/src/components/UsuarioModal.jsx` |
| Páginas | `frontend/src/pages/Clientes.jsx`, `frontend/src/pages/Usuarios.jsx`, `frontend/src/pages/Proyectos.jsx`, `frontend/src/pages/Dashboard.jsx`, `frontend/src/pages/Login.jsx` |
| Servicios y estilos | `frontend/src/services/clientesService.js`, `frontend/src/services/usuariosService.js`, `frontend/src/styles/riccati.css` |

| Grupo | Archivos nuevos |
| --- | --- |
| Migraciones preparadas | `backend/database/06_sprint2_clientes.sql`, `backend/database/07_sprint2_bitacora.sql` |
| API | `backend/routes/bitacora.routes.js` |
| Pruebas y soporte | `backend/tests/auth.test.js`, `backend/tests/usuarios.test.js`, `backend/tests/clientes.test.js`, `backend/tests/proyectos.test.js`, `backend/tests/bitacora.test.js`, `backend/tests/helpers/http.js` |
| PostgreSQL aislado | `backend/tests/postgres/integration.test.js`, `backend/tests/postgres/start-isolated.ps1`, `backend/tests/postgres/stop-isolated.ps1` |
| Páginas | `frontend/src/pages/Perfil.jsx`, `frontend/src/pages/Bitacora.jsx` |
| Servicios | `frontend/src/services/authService.js`, `frontend/src/services/bitacoraService.js` |
| Estilos | `frontend/src/styles/clientes-sprint2.css`, `frontend/src/styles/bitacora.css` |
| Documentación | `docs/sprint-2-integration.md`, `docs/sprint-2-postgres-validation.md` |

## Configuración preservada y descartes

- Se conservaron ambos `.gitignore`, `.git/info/exclude` y la exclusión local
  de `sprint2-reference/`.
- No se incorporó el `package-lock.json` raíz, vacío y sin manifest asociado.
- No se incorporó `riccati-v2.css`, que no tenía imports.
- Se conservó `backend/.env.example`; no se copiaron los valores sensibles
  de la referencia ni se modificaron archivos `.env`.
- Se conservaron `backend/package-lock.json`, `frontend/vite.config.js`,
  `frontend/src/main.jsx`, las migraciones 01–05 y el seed de Sprint 1.
- Se evitaron los cambios que eran únicamente de finales de línea. Los
  archivos existentes mantienen sus finales de línea originales.
- El único paquete agregado es `lucide-react` 1.53.0. El lockfile del frontend
  mantiene las versiones anteriores del resto de paquetes.
- Continúan las URL de API en `http://localhost:3000`, CORS y la configuración
  existente de PostgreSQL. El rediseño carga fuentes de Google Fonts.

## Validación ejecutada

Entorno utilizado: Node 24.21.0 y npm 11.19.0. Según el lockfile, Vite y las
herramientas del frontend requieren Node `^20.19.0 || >=22.12.0`.

Desde `backend`:

```powershell
npm.cmd test
```

Resultado: 36 pruebas aprobadas, sin fallos ni omisiones. Incluyen login y
JWT reales, cambio de contraseña, revocación por estado/rol, permisos de
clientes, auditoría, edición de proyectos, bitácora y cuatro combinaciones
concurrentes de PUT/PATCH entre administradores.

Las pruebas usan conexiones simuladas y servidores HTTP locales efímeros.
No importan `db.js`, no cargan `.env` ni conectan a la base principal.
Los tests de concurrencia simulan la espera del bloqueo y el orden de las
transacciones; no constituyen una validación del motor PostgreSQL real.

Desde `frontend`:

```powershell
npm.cmd ci --ignore-scripts --no-audit --no-fund
npm.cmd run lint
npm.cmd run build
```

La instalación con lockfile, el lint y la compilación de producción terminaron
correctamente. Tras revisar las siete advertencias iniciales se eliminó el
parámetro de catch sin uso en Login y los reinicios redundantes de estados
iniciales en Proyectos. Clientes usa su estado de carga inicial sin volver a
activarlo al montar. Lint informa cinco advertencias pendientes:

- Dashboard, Usuarios y Proyectos: el analizador señala funciones declaradas
  después de registrar un efecto. El callback del efecto se ejecuta después
  del render, cuando ya están inicializadas; no se observó un acceso prematuro
  en ejecución. No se reordenaron componentes para silenciar el diagnóstico.
- Clientes y Bitácora: efectos que coordinan la carga remota y sus estados.
  Son rutas de carga necesarias; sustituirlas por una abstracción de fetching
  excede una corrección mínima. No se añadieron supresiones de lint.

No son errores de compilación y no justifican por sí solas una refactorización.

También se comprobaron la sintaxis de todos los JS del backend, los imports
locales del frontend, la correspondencia de las rutas nuevas con sus servicios,
la ausencia de eliminaciones accidentales y `git diff --check`.

## Validación con PostgreSQL de pruebas

**No se ejecutó ninguna migración ni operación contra la base principal.**
Después de presentar el plan, el usuario autorizó expresamente un clúster
portátil e independiente de PostgreSQL 18.6 en `127.0.0.1:55432`, dentro de
`C:\Users\willi\AppData\Local\Temp\riccati-s2-pg-20261021`. Los binarios de EDB
se verificaron mediante SHA-256 antes de ejecutarlos. No se instaló un servicio.

El plan concreto y los ejecutores están en
[sprint-2-postgres-validation.md](sprint-2-postgres-validation.md). Usan un
clúster portátil exclusivo y dos bases: instalación 01–07 y actualización de
01–05 con fixtures sintéticos mediante 06–07. Las conexiones no cargan `.env`.

El ejecutor verificó directorio de datos, nombre de clúster, host y puerto
antes de crear las bases. La API se ejecutó con un rol de base de datos
sin privilegios DDL. No se ejecutó el seed administrativo del proyecto.

Resultado: **37 pruebas reales aprobadas, sin fallos ni omisiones**:

- `riccati_s2_full`: instalación limpia 01–07 y batería HTTP/SQL completa.
- `riccati_s2_upgrade`: instalación 01–05, fixtures sintéticos de Sprint 1,
  aplicación 06–07 y la misma batería. Las filas previas se conservaron y el
  esquema resultante coincide con el de la instalación completa.
- Autenticación, usuarios, clientes/contactos, asociaciones de proyectos y
  bitácora con middleware, rutas, JWT, bcrypt y consultas PostgreSQL reales.
- Permisos de administrador/colaborador, JWT de Sprint 1/expirados/inválidos,
  revocación por estado/rol y por cambio de contraseña, y login posterior.
- Cronología, JSONB de auditoría, originales, resúmenes, filtros y paginación;
  referencias y constraints de SQL; rollback ante fallo provocado de auditoría.
- Los cuatro cruces concurrentes PUT/PATCH se aprobaron en cada base. Ambos
  actores pasaron autenticación antes de competir por el bloqueo real: una
  petición terminó en 200 y la otra en 403; quedó un administrador activo y
  no quedaron bloqueos de administración pendientes.

El log del test contiene dos errores sintéticos `P0001`, uno por base, esperados
para comprobar que se revierten tanto la edición como la auditoría. No son
fallos pendientes del producto. Antes de crear bases se corrigió un detalle
del ejecutor: la representación textual de `inet` incluía `/32`; se usó
`host(inet_server_addr())` para comprobar la dirección sin máscara.

El clúster de pruebas quedó detenido y sus archivos se conservaron en Temp.
El primer intento de detenerlo desde el sandbox fue rechazado por permisos;
se repitió fuera del sandbox y `pg_ctl` confirmó la detención. La rutina de
inicio espera solo al proceso `pg_ctl`, sin esperar indefinidamente a su
servidor descendiente. No se eliminaron bases ni carpetas.

## Revisión final y comprobaciones manuales pendientes

La revisión de archivos candidatos no encontró dependencias, generados,
metadatos Git, archivos sensibles ni patrones de secretos incorporados. Los
`.gitignore`, `.env.example`, configuración de conexión, lockfile del backend
y migraciones 01–05 coinciden con HEAD. No se eliminaron archivos versionados.
La búsqueda de patrones es una comprobación adicional y no una certificación
exhaustiva de ausencia de secretos.

La regresión HTTP/SQL cubierta de Sprint 1 pasó en ambas bases. Falta revisar
desde el navegador los flujos visuales de login/salida, perfil y contraseña,
estados de usuarios, fichas/contactos de clientes, edición de proyectos y
bitácora con ambos roles; formularios, mensajes de error, paginación, enlaces,
menú móvil y foco/teclado de modales. Las pruebas HTTP no verifican esos aspectos.

Conclusión: no hay bloqueos detectados en migraciones, API, pruebas o build
para crear los commits propuestos. La aceptación visual queda pendiente y
debe completarse antes de dar por cerrado el Sprint 2. El usuario autorizó
crear los cuatro commits; hacer push sigue requiriendo aprobación adicional.

## Organización de commits

El usuario autorizó estos cuatro commits funcionales, con staging selectivo
de archivos y fragmentos compartidos, conservando la identidad Git configurada.
No se autoriza ejecutar `git push`:

1. `feat(ui): integrar diseño compartido y navegación adaptable`
   — dependencia y lockfile de Lucide, estilos globales, layout, componentes
   compartidos, portales, metadatos y favicon. Las entradas de menú de módulos
   nuevos se reservan para sus commits correspondientes.
2. `feat(cuentas): integrar perfil y administración segura de usuarios`
   — autenticación, JWT, cambio de contraseña, estado de usuarios, protección
   concurrente, interfaz M01, ruta/enlace de perfil, soporte de pruebas y tests
   de autenticación/usuarios. Incluye el script `npm test`.
3. `feat(clientes): integrar gestión y auditoría de clientes y contactos`
   — migración 06, API y UI M02, servicio/estilos, validación de asociaciones
   activas en proyectos y pruebas de clientes/proyectos.
4. `feat(bitacora): integrar seguimiento y correcciones auditadas`
   — migración 07, API, UI, servicio y estilos M04, enlaces desde navegación y
   ficha de proyecto, pruebas de bitácora y esta guía de integración.

Cada commit incluye sus correcciones y pruebas relacionadas. La aplicación
de migraciones en la base principal y cualquier push requieren autorización
independiente.
