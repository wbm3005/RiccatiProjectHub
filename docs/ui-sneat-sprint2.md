# UI Sprint 2: Sneat Free

## Alcance
Rediseño de las pantallas existentes: login, dashboard, usuarios, clientes, proyectos, bitácora y perfil. Sin cambios de API, permisos, migraciones ni historias futuras. Sneat Free conserva su licencia en frontend/src/vendor/sneat. El modo oscuro es una adaptación propia.

## Componentes compartidos
- Layout y navegación React con tema claro/oscuro persistido en riccatiTema.
- Colores semánticos y geometría común para cards, tablas, botones y modales.
- FormField conecta etiquetas, campos obligatorios y errores de validación nativa. Los errores de API siguen presentándose como alertas generales, porque la API no ofrece un contrato común de errores por campo.
- Pagination para Usuarios y Proyectos: 10 filas, filtro antes de paginar y retorno a primera página al buscar. Clientes y Bitácora conservan su paginación. Esta paginación local no reduce el volumen descargado de la API.
- Modales en portales: foco inicial, confinamiento de Tab, Escape cuando se permite cerrar, fondo inerte y retorno del foco.
- Las tablas actuales tienen hasta dos acciones por registro; no se introducen dropdowns innecesarios.

## Validación
Build correcto, auditoría sin vulnerabilidades y lint con las cinco advertencias previas. Revisión automatizada en Edge con respuestas de API simuladas: seis módulos en ambos temas, 23 registros para paginación, búsqueda, formulario vacío, respuesta de duplicado con datos conservados, modales de clientes/proyectos/bitácora en ambos temas, etiquetas, Escape, retorno de foco, anchos móviles de 390px, navegación por rol y estados vacíos/error. Se inspeccionaron capturas de las pantallas y formularios. No se escribieron datos en PostgreSQL.

## Revisión con el equipo
Con datos de prueba y ambos roles, confirmar el flujo real cliente → proyecto → asignación → actividad, fichas con datos extensos, correcciones auditadas y cambio de contraseña. Las comprobaciones de UI simuladas no sustituyen la aceptación del flujo real. Revisar la interfaz local antes de crear commits y publicar la rama.
