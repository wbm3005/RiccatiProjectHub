# Plan de validación con PostgreSQL independiente

Plan autorizado expresamente por el usuario para este clúster temporal y
estas dos bases. No autoriza conexiones ni modificaciones a la base principal.

## Entorno propuesto

- PostgreSQL 18.6 portátil para Windows x64, descargado de EDB. No instalar
  servicios de Windows, modificar PATH ni reutilizar instalaciones existentes.
- Carpeta exclusiva: `C:\Users\willi\AppData\Local\Temp\riccati-s2-pg-20261021`.
- Servidor: únicamente `127.0.0.1:55432`; abortar si el puerto está ocupado.
- `cluster_name = 'riccati_s2_validation'`, almacenamiento en `data` dentro de
  esa carpeta; verificar estos valores antes de crear las bases de aplicación.
- Autenticación SCRAM con credenciales nuevas, generadas para pruebas y
  guardadas únicamente en la carpeta temporal. No publicar contraseñas ni JWT.
- Bases permitidas: `riccati_s2_full` y `riccati_s2_upgrade`. Abortar si ya
  existen; no eliminar ni sobrescribir una base para repetir las pruebas.
- Superusuario exclusivo del clúster: `riccati_test_admin`. La aplicación se
  probará con otro rol que solo tenga acceso a tablas/secuencias de pruebas.
- Datos ficticios: dos administradores, un colaborador asignado, otro sin
  asignación, clientes/contactos y proyectos. No copiar datos de la base real.
- Conexiones explícitas del ejecutor de pruebas, sin importar `backend/db.js`,
  `server.js` ni cargar `backend/.env`. No usar valores PG/DB heredados.

Fuentes: [binarios de EDB](https://www.enterprisedb.com/download-postgresql-binaries),
[initdb](https://www.postgresql.org/docs/18/app-initdb.html) y
[pg_ctl](https://www.postgresql.org/docs/18/app-pg-ctl.html).
El archivo 18.6-5 se verifica con el [SHA-256 publicado por EDB](https://github.com/EnterpriseDB/edb-installers/issues/746).

## Orden de ejecución después de autorizar

1. Descargar y verificar el archivo de binarios; extraerlo en la carpeta
   temporal. Comprobar la versión antes de ejecutarlo.
2. Ejecutar `initdb` con UTF-8 y autenticación SCRAM dentro de esa carpeta.
   Iniciar el servidor sin registrar un servicio y con log temporal.
3. Comprobar puerto, dirección, nombre del clúster y directorio de datos.
4. Crear `riccati_s2_full`, aplicar 01–07 en orden y verificar tablas, índices,
   constraints, secuencias y catálogos iniciales.
5. Crear `riccati_s2_upgrade`, aplicar 01–05 e insertar fixtures sintéticos de
   Sprint 1. Guardar una representación de todas sus filas, ejecutar 06–07 y
   comprobar que los datos anteriores son idénticos.
6. Comparar el esquema de ambas instalaciones. Ejecutar contra cada base la
   misma batería HTTP/SQL con rutas y middleware reales y conexiones `pg`
   reales; solo se sustituye la elección del pool por el de pruebas.
7. Probar reglas SQL directamente y rollback ante un fallo provocado dentro
   del clúster de pruebas. No provocar fallos en la base principal.
8. Probar los cuatro cruces PUT/PATCH concurrentes entre dos administradores,
   haciendo que ambos hayan pasado autenticación antes de competir por el
   bloqueo real de PostgreSQL. Debe persistir un administrador activo.
9. Cerrar conexiones y detener solo la instancia identificada por ese
   directorio de datos. Conservar sus archivos y resultados para revisión;
   no eliminar bases ni carpetas automáticamente.

## Ejecutor preparado

Ejecutar desde `backend`, únicamente después de autorizar el destino:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/postgres/start-isolated.ps1 -Authorized
$env:RICCATI_TEST_CONFIG = Join-Path ([IO.Path]::GetTempPath()) 'riccati-s2-pg-20261021\test-config.json'
node --test tests/postgres/integration.test.js
powershell.exe -NoProfile -ExecutionPolicy Bypass -File tests/postgres/stop-isolated.ps1
```

`-ExecutionPolicy Bypass` se aplica solo al proceso de los scripts revisados;
no cambia la política de ejecución persistente. El ejecutor HTTP/SQL rechaza
otro host, puerto, directorio, usuario o nombre de clúster antes de crear bases.
Sin configuración explícita la prueba se omite; esa omisión no cuenta como
una validación de PostgreSQL. `npm test` conserva las pruebas sin base real.

## Matriz de aceptación

| Área | Comprobaciones |
| --- | --- |
| Migraciones | Instalación limpia 01–07; actualización 01–05 con datos + 06–07; igualdad de esquemas; preservación de filas previas |
| Autenticación | Login real, JWT HS256, expiración, JWT de Sprint 1 rechazado, cambios de contraseña invalidan tokens y admiten nuevo login |
| Usuarios | Consultas/alta/edición/estado de Sprint 1; colaborador rechazado; cuenta propia protegida; estado y rol actuales prevalecen sobre claims |
| Concurrencia | Dos conexiones y cuatro cruces PUT/PATCH; revalidación del actor tras el bloqueo; queda un administrador; no quedan bloqueos abiertos |
| Clientes | Lectura para ambos roles; todas las escrituras solo administrador; edición de contactos; justificación y auditoría; datos históricos preservados |
| Proyectos | Alta/consulta/edición existentes; rechazo de reasignación a cliente inactivo; preservación de asociación histórica; contacto del cliente correcto |
| Bitácora | Actividad, comentario, esfuerzo/horas, resumen, cronología, filtros, paginación, asignación y correcciones dentro/fuera de 24 horas |
| SQL | Foreign keys, límites de horas, original/correcciones persistidos y rollback de actualización si falla la escritura de auditoría |

## Si no se autoriza o no se puede iniciar el entorno

Mantener las pruebas de PostgreSQL pendientes: los tests simulados y el build
no sustituyen esta batería. Puede prepararse el mismo clúster en otra máquina
o en Docker, con puerto exclusivo, volumen nuevo y las mismas dos bases.
La conexión y el destino concretos deben aprobarse antes de modificarlos.

## Resultado de esta ejecución

El usuario autorizó el plan y se ejecutó con PostgreSQL 18.6. La instalación
completa 01–07 y la actualización 01–05 con datos + 06–07 pasaron junto con
la batería HTTP/SQL: **37 pruebas aprobadas, cero fallos, cero omisiones**.
Los esquemas resultantes coincidieron y los datos de Sprint 1 se preservaron.
El servidor quedó detenido; los dos juegos de datos ficticios se conservaron
en la carpeta temporal. La base principal y sus credenciales no se utilizaron.

La batería es de una sola ejecución por clúster: rechaza reutilizar las bases
ya existentes. Repetirla desde cero requiere aprobar un destino nuevo o una
limpieza explícita del clúster de pruebas; no borra ni reinicia datos por sí sola.

## Comprobación manual posterior desde el navegador

Conectar el backend únicamente a una base de pruebas y verificar login/salida,
cambio de contraseña, estados de usuarios, fichas/contactos de clientes,
asociaciones de proyectos y registro/corrección de bitácora con ambos roles.
Revisar filtros, paginación, mensajes de error, vencimiento de sesión, links
desde proyectos, teclado/foco de modales, menú móvil y tamaños de pantalla.
No iniciar el backend habitual con su `.env` para realizar esta revisión.
