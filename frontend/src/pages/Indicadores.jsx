import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Indicadores.css";

function Indicadores() {
  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [
          respuestaClientes,
          respuestaProyectos,
          respuestaActividades,
          respuestaDocumentos,
          respuestaPagos,
        ] = await Promise.all([
          fetch("http://localhost:3000/api/clientes"),
          fetch("http://localhost:3000/api/proyectos"),
          fetch("http://localhost:3000/api/actividades"),
          fetch("http://localhost:3000/api/documentos"),
          fetch("http://localhost:3000/api/pagos"),
        ]);

        const [
          datosClientes,
          datosProyectos,
          datosActividades,
          datosDocumentos,
          datosPagos,
        ] = await Promise.all([
          respuestaClientes.json(),
          respuestaProyectos.json(),
          respuestaActividades.json(),
          respuestaDocumentos.json(),
          respuestaPagos.json(),
        ]);

        setClientes(datosClientes);
        setProyectos(datosProyectos);
        setActividades(datosActividades);
        setDocumentos(datosDocumentos);
        setPagos(datosPagos);
      } catch (error) {
        console.error(
          "Error al cargar indicadores:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  /* ========================================
     CLIENTES
  ======================================== */

  const clientesActivos = clientes.filter(
    (cliente) => cliente.estado === "Activo"
  ).length;

  /* ========================================
     PROYECTOS
  ======================================== */

  const proyectosEnCurso = proyectos.filter(
    (proyecto) => proyecto.estado === "En curso"
  ).length;

  const proyectosRegistrados = proyectos.filter(
    (proyecto) => proyecto.estado === "Registrado"
  ).length;

  const proyectosSuspendidos = proyectos.filter(
    (proyecto) => proyecto.estado === "Suspendido"
  ).length;

  const proyectosFinalizados = proyectos.filter(
    (proyecto) => proyecto.estado === "Finalizado"
  ).length;

  const proyectosArchivados = proyectos.filter(
    (proyecto) => proyecto.estado === "Archivado"
  ).length;

  const prioridadAlta = proyectos.filter(
    (proyecto) => proyecto.prioridad === "Alta"
  ).length;

  const prioridadMedia = proyectos.filter(
    (proyecto) => proyecto.prioridad === "Media"
  ).length;

  const prioridadBaja = proyectos.filter(
    (proyecto) => proyecto.prioridad === "Baja"
  ).length;

  /* ========================================
     ACTIVIDADES
  ======================================== */

  const horasTotales = actividades.reduce(
    (total, actividad) =>
      total + Number(actividad.horas || 0),
    0
  );

  /* ========================================
     FINANZAS
  ======================================== */

  const proyectosFinancieros = pagos.reduce(
    (resultado, pago) => {
      const existente = resultado.find(
        (item) =>
          item.projectId === pago.projectId
      );

      if (!existente) {
        resultado.push({
          projectId: pago.projectId,
          montoAcordado:
            Number(pago.montoAcordado) || 0,
        });
      }

      return resultado;
    },
    []
  );

  const totalAcordado =
    proyectosFinancieros.reduce(
      (total, proyecto) =>
        total + proyecto.montoAcordado,
      0
    );

  const totalPagado = pagos
    .filter(
      (pago) => pago.estado === "Válido"
    )
    .reduce(
      (total, pago) =>
        total + Number(pago.monto || 0),
      0
    );

  const saldoPendiente =
    totalAcordado - totalPagado;

  const porcentajeCobrado =
    totalAcordado > 0
      ? (totalPagado / totalAcordado) * 100
      : 0;

  /* ========================================
     DOCUMENTOS
  ======================================== */

  const documentosLocales = documentos.filter(
    (documento) =>
      documento.almacenamiento === "Local"
  ).length;

  const documentosExternos = documentos.filter(
    (documento) =>
      documento.almacenamiento === "Externo"
  ).length;

  /* ========================================
     FUNCIONES
  ======================================== */

  const formatearColones = (monto) => {
    return `₡${Number(monto || 0).toLocaleString(
      "es-CR"
    )}`;
  };

  const calcularPorcentaje = (cantidad) => {
    if (proyectos.length === 0) {
      return 0;
    }

    return Math.round(
      (cantidad / proyectos.length) * 100
    );
  };

  if (cargando) {
    return (
      <div className="riccati-app">
        <main className="indicadores-loading">
          <div className="loading-orbit">
            <span></span>
          </div>

          <strong>
            Cargando indicadores...
          </strong>

          <p>
            Analizando información del sistema
          </p>
        </main>
      </div>
    );
  }

  return (
    <div className="riccati-app">

      {/* ========================================
          SIDEBAR
      ======================================== */}

      <aside className="riccati-sidebar">

        <div className="brand">
          <div className="brand-icon">
            R
          </div>

          <div>
            <h2>Riccati</h2>
            <span>PROJECT HUB</span>
          </div>
        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            MENÚ PRINCIPAL
          </span>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            <span className="menu-icon">
              ◈
            </span>
            Dashboard
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/proyectos")
            }
          >
            <span className="menu-icon">
              ◉
            </span>
            Proyectos
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/clientes")
            }
          >
            <span className="menu-icon">
              ◎
            </span>
            Clientes
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/bitacora")
            }
          >
            <span className="menu-icon">
              ◫
            </span>
            Bitácora
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/documentos")
            }
          >
            <span className="menu-icon">
              ▱
            </span>
            Documentos
          </button>

          <button
            className="menu-item"
            onClick={() =>
              navigate("/finanzas")
            }
          >
            <span className="menu-icon">
              ₡
            </span>
            Finanzas
          </button>

          <button
            className="menu-item active"
            onClick={() =>
              navigate("/indicadores")
            }
          >
            <span className="menu-icon">
              ◬
            </span>
            Indicadores
          </button>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            ADMINISTRACIÓN
          </span>

          {usuario?.rol === "Administrador" && (
            <button
              className="menu-item"
              onClick={() =>
                navigate("/usuarios")
              }
            >
              <span className="menu-icon">
                ◇
              </span>
              Usuarios
            </button>
          )}

        </div>

        <div className="sidebar-user">

          <div className="user-avatar">
            {usuario?.nombre?.charAt(0) || "A"}
          </div>

          <div>
            <strong>
              {usuario?.nombre ||
                "Administrador"}
            </strong>

            <span>
              {usuario?.rol ||
                "Administrador"}
            </span>
          </div>

        </div>

      </aside>

      {/* ========================================
          CONTENIDO
      ======================================== */}

      <main className="riccati-main">

        {/* HEADER */}

        <header className="topbar">

          <div>

            <span className="page-label">
              MÓDULO M07
            </span>

            <h1>
              Consultas e indicadores
            </h1>

            <p>
              Visión general del rendimiento,
              estado operativo y situación
              financiera de Riccati Project Hub.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot">
              </span>

              Datos actualizados

            </div>

            <button className="notification-button">
              ◬
            </button>

          </div>

        </header>

        {/* ========================================
            KPI PRINCIPALES
        ======================================== */}

        <section className="indicator-kpis">

          <div className="indicator-kpi-card">

            <div className="indicator-kpi-top">

              <span>
                PROYECTOS
              </span>

              <div className="indicator-kpi-icon">
                ◈
              </div>

            </div>

            <strong>
              {proyectos.length}
            </strong>

            <small>
              {proyectosEnCurso} en curso
            </small>

          </div>

          <div className="indicator-kpi-card">

            <div className="indicator-kpi-top">

              <span>
                CLIENTES ACTIVOS
              </span>

              <div className="indicator-kpi-icon green">
                ◎
              </div>

            </div>

            <strong>
              {clientesActivos}
            </strong>

            <small className="indicator-green">
              de {clientes.length} registrados
            </small>

          </div>

          <div className="indicator-kpi-card">

            <div className="indicator-kpi-top">

              <span>
                HORAS REGISTRADAS
              </span>

              <div className="indicator-kpi-icon purple">
                ◷
              </div>

            </div>

            <strong>
              {horasTotales}
            </strong>

            <small>
              {actividades.length} actividades
            </small>

          </div>

          <div className="indicator-kpi-card">

            <div className="indicator-kpi-top">

              <span>
                DOCUMENTOS
              </span>

              <div className="indicator-kpi-icon orange">
                ▱
              </div>

            </div>

            <strong>
              {documentos.length}
            </strong>

            <small>
              Repositorio general
            </small>

          </div>

        </section>

        {/* ========================================
            GRID ANALÍTICO
        ======================================== */}

        <section className="analytics-grid">

          {/* ESTADOS */}

          <div className="analytics-panel">

            <div className="analytics-header">

              <div>
                <span className="panel-label">
                  PORTAFOLIO
                </span>

                <h3>
                  Estado de proyectos
                </h3>
              </div>

              <span className="analytics-total">
                {proyectos.length} total
              </span>

            </div>

            <div className="analytics-content">

              <div className="indicator-row">

                <div className="indicator-row-info">
                  <span className="indicator-dot green-dot"></span>

                  <span>
                    En curso
                  </span>
                </div>

                <div className="indicator-bar">

                  <div
                    className="indicator-fill green-fill"
                    style={{
                      width: `${calcularPorcentaje(
                        proyectosEnCurso
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {proyectosEnCurso}
                </strong>

              </div>

              <div className="indicator-row">

                <div className="indicator-row-info">
                  <span className="indicator-dot cyan-dot"></span>

                  <span>
                    Registrados
                  </span>
                </div>

                <div className="indicator-bar">

                  <div
                    className="indicator-fill cyan-fill"
                    style={{
                      width: `${calcularPorcentaje(
                        proyectosRegistrados
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {proyectosRegistrados}
                </strong>

              </div>

              <div className="indicator-row">

                <div className="indicator-row-info">
                  <span className="indicator-dot orange-dot"></span>

                  <span>
                    Suspendidos
                  </span>
                </div>

                <div className="indicator-bar">

                  <div
                    className="indicator-fill orange-fill"
                    style={{
                      width: `${calcularPorcentaje(
                        proyectosSuspendidos
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {proyectosSuspendidos}
                </strong>

              </div>

              <div className="indicator-row">

                <div className="indicator-row-info">
                  <span className="indicator-dot purple-dot"></span>

                  <span>
                    Finalizados
                  </span>
                </div>

                <div className="indicator-bar">

                  <div
                    className="indicator-fill purple-fill"
                    style={{
                      width: `${calcularPorcentaje(
                        proyectosFinalizados
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {proyectosFinalizados}
                </strong>

              </div>

              <div className="indicator-row">

                <div className="indicator-row-info">
                  <span className="indicator-dot gray-dot"></span>

                  <span>
                    Archivados
                  </span>
                </div>

                <div className="indicator-bar">

                  <div
                    className="indicator-fill gray-fill"
                    style={{
                      width: `${calcularPorcentaje(
                        proyectosArchivados
                      )}%`,
                    }}
                  ></div>

                </div>

                <strong>
                  {proyectosArchivados}
                </strong>

              </div>

            </div>

          </div>

          {/* PRIORIDADES */}

          <div className="analytics-panel">

            <div className="analytics-header">

              <div>
                <span className="panel-label">
                  PRIORIDAD
                </span>

                <h3>
                  Distribución de carga
                </h3>
              </div>

            </div>

            <div className="priority-analytics">

              <div className="priority-circle priority-high-circle">

                <strong>
                  {prioridadAlta}
                </strong>

                <span>
                  Alta
                </span>

              </div>

              <div className="priority-circle priority-medium-circle">

                <strong>
                  {prioridadMedia}
                </strong>

                <span>
                  Media
                </span>

              </div>

              <div className="priority-circle priority-low-circle">

                <strong>
                  {prioridadBaja}
                </strong>

                <span>
                  Baja
                </span>

              </div>

            </div>

            <div className="priority-summary">

              <span>
                Proyectos prioritarios
              </span>

              <strong>
                {prioridadAlta}
              </strong>

            </div>

          </div>

        </section>

        {/* ========================================
            FINANZAS
        ======================================== */}

        <section className="indicator-finance-panel">

          <div className="analytics-header">

            <div>
              <span className="panel-label">
                FINANZAS
              </span>

              <h3>
                Indicadores financieros
              </h3>
            </div>

            <button
              className="indicator-details-button"
              onClick={() =>
                navigate("/finanzas")
              }
            >
              Ver finanzas →
            </button>

          </div>

          <div className="indicator-finance-grid">

            <div className="indicator-finance-value">

              <span>
                MONTO ACORDADO
              </span>

              <strong>
                {formatearColones(
                  totalAcordado
                )}
              </strong>

            </div>

            <div className="indicator-finance-value">

              <span>
                COBRADO
              </span>

              <strong className="finance-value-green">
                {formatearColones(
                  totalPagado
                )}
              </strong>

            </div>

            <div className="indicator-finance-value">

              <span>
                PENDIENTE
              </span>

              <strong className="finance-value-orange">
                {formatearColones(
                  saldoPendiente
                )}
              </strong>

            </div>

            <div className="indicator-finance-progress">

              <div className="indicator-progress-title">

                <span>
                  Porcentaje cobrado
                </span>

                <strong>
                  {porcentajeCobrado.toFixed(0)}%
                </strong>

              </div>

              <div className="indicator-big-track">

                <div
                  className="indicator-big-fill"
                  style={{
                    width: `${Math.min(
                      porcentajeCobrado,
                      100
                    )}%`,
                  }}
                ></div>

              </div>

            </div>

          </div>

        </section>

        {/* ========================================
            DOCUMENTOS + ACTIVIDAD
        ======================================== */}

        <section className="bottom-indicators-grid">

          {/* DOCUMENTOS */}

          <div className="analytics-panel">

            <div className="analytics-header">

              <div>
                <span className="panel-label">
                  DOCUMENTACIÓN
                </span>

                <h3>
                  Almacenamiento
                </h3>
              </div>

              <button
                className="indicator-mini-button"
                onClick={() =>
                  navigate("/documentos")
                }
              >
                Ver
              </button>

            </div>

            <div className="storage-indicators">

              <div className="storage-indicator-card">

                <div className="storage-indicator-icon local">
                  ↓
                </div>

                <div>
                  <span>
                    Local
                  </span>

                  <strong>
                    {documentosLocales}
                  </strong>
                </div>

              </div>

              <div className="storage-indicator-card">

                <div className="storage-indicator-icon external">
                  ↗
                </div>

                <div>
                  <span>
                    Externo
                  </span>

                  <strong>
                    {documentosExternos}
                  </strong>
                </div>

              </div>

            </div>

          </div>

          {/* ACTIVIDAD */}

          <div className="analytics-panel">

            <div className="analytics-header">

              <div>
                <span className="panel-label">
                  TRAZABILIDAD
                </span>

                <h3>
                  Actividad reciente
                </h3>
              </div>

              <button
                className="indicator-mini-button"
                onClick={() =>
                  navigate("/bitacora")
                }
              >
                Ver
              </button>

            </div>

            <div className="recent-indicator-list">

              {actividades
                .slice(-3)
                .reverse()
                .map((actividad) => (

                  <div
                    className="recent-indicator-item"
                    key={actividad.id}
                  >

                    <div className="recent-indicator-line">
                      <span></span>
                    </div>

                    <div>

                      <strong>
                        {actividad.projectId}
                      </strong>

                      <p>
                        {actividad.descripcion}
                      </p>

                      <small>
                        {actividad.usuario}
                        {" · "}
                        {actividad.horas} h
                      </small>

                    </div>

                  </div>

                ))}

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Indicadores;