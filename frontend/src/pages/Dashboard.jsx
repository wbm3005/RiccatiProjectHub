import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  const [clientes, setClientes] = useState([]);
  const [proyectos, setProyectos] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [cargando, setCargando] = useState(true);

  /* ========================================
     CARGAR DATOS DEL BACKEND
  ======================================== */

  useEffect(() => {
    const cargarDashboard = async () => {
      try {
        const [
          respuestaClientes,
          respuestaProyectos,
          respuestaPagos,
        ] = await Promise.all([
          fetch("http://localhost:3000/api/clientes"),
          fetch("http://localhost:3000/api/proyectos"),
          fetch("http://localhost:3000/api/pagos"),
        ]);

        const [
          datosClientes,
          datosProyectos,
          datosPagos,
        ] = await Promise.all([
          respuestaClientes.json(),
          respuestaProyectos.json(),
          respuestaPagos.json(),
        ]);

        setClientes(datosClientes);
        setProyectos(datosProyectos);
        setPagos(datosPagos);
      } catch (error) {
        console.error(
          "Error al cargar el dashboard:",
          error
        );
      } finally {
        setCargando(false);
      }
    };

    cargarDashboard();
  }, []);

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

  /* ========================================
     PRÓXIMOS A VENCER
  ======================================== */

  const hoy = new Date();

  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() + 45);

  const proyectosProximos = proyectos.filter(
    (proyecto) => {
      if (!proyecto.fechaCompromiso) {
        return false;
      }

      if (
        proyecto.estado === "Finalizado" ||
        proyecto.estado === "Archivado"
      ) {
        return false;
      }

      const fechaCompromiso = new Date(
        `${proyecto.fechaCompromiso}T23:59:59`
      );

      return (
        fechaCompromiso >= hoy &&
        fechaCompromiso <= fechaLimite
      );
    }
  ).length;

  /* ========================================
     FINANZAS
  ======================================== */

  const proyectosFinancieros = pagos.reduce(
    (resultado, pago) => {
      const proyectoExistente = resultado.find(
        (proyecto) =>
          proyecto.projectId === pago.projectId
      );

      if (!proyectoExistente) {
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

  /* ========================================
     PROYECTOS RECIENTES
  ======================================== */

  const proyectosRecientes = [...proyectos]
    .sort((a, b) => b.id - a.id)
    .slice(0, 3);

  /* ========================================
     ESTADOS
  ======================================== */

  const obtenerClaseEstado = (estado) => {
    switch (estado) {
      case "En curso":
        return "badge-status status-progress";

      case "Registrado":
        return "badge-status status-registered";

      case "Suspendido":
        return "badge-status status-paused";

      case "Finalizado":
        return "badge-status status-finished";

      default:
        return "badge-status status-registered";
    }
  };

  /* ========================================
     CERRAR SESIÓN
  ======================================== */

  const cerrarSesion = () => {
    localStorage.removeItem("usuarioRiccati");
    navigate("/");
  };

  /* ========================================
     CARGANDO
  ======================================== */

  if (cargando) {
    return (
      <div className="riccati-app">
        <main
          className="riccati-main"
          style={{
            marginLeft: 0,
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              textAlign: "center",
            }}
          >
            <div
              className="brand-icon"
              style={{
                margin: "0 auto 15px",
              }}
            >
              R
            </div>

            <strong>
              Cargando Riccati Project Hub...
            </strong>
          </div>
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

        {/* LOGO */}
        <div>

          <div className="brand">

            <div className="brand-icon">
              R
            </div>

            <div>
              <h2>Riccati</h2>
              <span>PROJECT HUB</span>
            </div>

          </div>

          {/* ========================================
              MENÚ PRINCIPAL
          ======================================== */}

          <div className="sidebar-section">

            <span className="sidebar-title">
              MENÚ PRINCIPAL
            </span>

            {/* DASHBOARD */}
            <button
              className="menu-item active"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              <span className="menu-icon">
                ◈
              </span>

              Dashboard
            </button>

            {/* PROYECTOS */}
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

            {/* CLIENTES */}
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

            {/* BITÁCORA */}
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

            {/* DOCUMENTOS */}
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

            {/* FINANZAS */}
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

            {/* INDICADORES */}
            <button
              className="menu-item"
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

          {/* ========================================
              ADMINISTRACIÓN
          ======================================== */}

          {usuario?.rol === "Administrador" && (

            <div className="sidebar-section">

              <span className="sidebar-title">
                ADMINISTRACIÓN
              </span>

              {/* USUARIOS */}
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

            </div>

          )}

        </div>

        {/* ========================================
            USUARIO ACTUAL
        ======================================== */}

        <div className="sidebar-user">

          <div className="user-avatar">
            {usuario?.nombre?.charAt(0) || "A"}
          </div>

          <div
            style={{
              flex: 1,
              minWidth: 0,
            }}
          >
            <strong>
              {usuario?.nombre || "Administrador"}
            </strong>

            <span>
              {usuario?.rol || "Administrador"}
            </span>
          </div>

          <button
            onClick={cerrarSesion}
            title="Cerrar sesión"
            style={{
              width: "31px",
              height: "31px",
              flexShrink: 0,
              borderRadius: "8px",
              border:
                "1px solid rgba(255,255,255,0.06)",
              background:
                "rgba(255,255,255,0.02)",
              color: "#778ca1",
              cursor: "pointer",
            }}
          >
            ↪
          </button>

        </div>

      </aside>

      {/* ========================================
          CONTENIDO PRINCIPAL
      ======================================== */}

      <main className="riccati-main">

        {/* ========================================
            HEADER
        ======================================== */}

        <header className="topbar">

          <div>

            <span className="page-label">
              OVERVIEW
            </span>

            <h1>
              Dashboard
            </h1>

            <p>
              Bienvenido de nuevo,{" "}
              {usuario?.nombre || "Administrador"}.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot"></span>

              Sistema operativo

            </div>

            <button
              className="notification-button"
              onClick={() =>
                navigate("/indicadores")
              }
              title="Ver indicadores"
            >
              ◬
            </button>

          </div>

        </header>

        {/* ========================================
            ESTADÍSTICAS
        ======================================== */}

        <section className="stats-grid">

          {/* PROYECTOS */}
          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                PROYECTOS
              </span>

              <div className="stat-icon">
                ◈
              </div>

            </div>

            <div className="stat-number">
              {proyectos.length}
            </div>

            <div className="stat-footer positive">
              {proyectosEnCurso} en curso
            </div>

          </div>

          {/* CLIENTES */}
          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                CLIENTES
              </span>

              <div className="stat-icon">
                ◎
              </div>

            </div>

            <div className="stat-number">
              {clientes.length}
            </div>

            <div className="stat-footer">
              Registro total
            </div>

          </div>

          {/* PRÓXIMOS A VENCER */}
          <div className="stat-card warning-card">

            <div className="stat-top">

              <span className="stat-label">
                PRÓXIMOS A VENCER
              </span>

              <div className="stat-icon warning-icon">
                !
              </div>

            </div>

            <div className="stat-number">
              {proyectosProximos}
            </div>

            <div className="stat-footer warning-text">
              Próximos 45 días
            </div>

          </div>

          {/* SALDO PENDIENTE */}
          <div className="stat-card">

            <div className="stat-top">

              <span className="stat-label">
                SALDO PENDIENTE
              </span>

              <div className="stat-icon">
                ₡
              </div>

            </div>

            <div className="stat-number money">
              {formatearColones(
                saldoPendiente
              )}
            </div>

            <div className="stat-footer">
              Pendiente de cobro
            </div>

          </div>

        </section>

        {/* ========================================
            CONTENIDO INFERIOR
        ======================================== */}

        <section className="dashboard-grid">

          {/* ========================================
              PROYECTOS RECIENTES
          ======================================== */}

          <div className="dashboard-panel">

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  ACTIVIDAD
                </span>

                <h3>
                  Proyectos recientes
                </h3>

              </div>

              <button
                className="panel-button"
                onClick={() =>
                  navigate("/proyectos")
                }
              >
                Ver todos
              </button>

            </div>

            <div className="project-list">

              {proyectosRecientes.map(
                (proyecto) => (

                  <div
                    className="project-row"
                    key={proyecto.id}
                  >

                    <div className="project-code">
                      {proyecto.projectId}
                    </div>

                    <div className="project-info">

                      <strong>
                        {proyecto.nombre}
                      </strong>

                      <span>
                        {proyecto.cliente}
                      </span>

                    </div>

                    <span
                      className={obtenerClaseEstado(
                        proyecto.estado
                      )}
                    >
                      {proyecto.estado}
                    </span>

                  </div>

                )
              )}

            </div>

          </div>

          {/* ========================================
              ESTADO GENERAL
          ======================================== */}

          <div className="dashboard-panel">

            <div className="panel-header">

              <div>

                <span className="panel-label">
                  RESUMEN
                </span>

                <h3>
                  Estado general
                </h3>

              </div>

              <button
                className="panel-button"
                onClick={() =>
                  navigate("/indicadores")
                }
              >
                Detalles
              </button>

            </div>

            <div className="summary-container">

              {/* EN CURSO */}
              <div className="summary-row">

                <span>
                  En curso
                </span>

                <div className="progress-track">

                  <div
                    className="progress-fill"
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

              {/* REGISTRADOS */}
              <div className="summary-row">

                <span>
                  Registrados
                </span>

                <div className="progress-track">

                  <div
                    className="progress-fill"
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

              {/* SUSPENDIDOS */}
              <div className="summary-row">

                <span>
                  Suspendidos
                </span>

                <div className="progress-track">

                  <div
                    className="progress-fill warning-fill"
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

              {/* FINALIZADOS */}
              <div className="summary-row">

                <span>
                  Finalizados
                </span>

                <div className="progress-track">

                  <div
                    className="progress-fill"
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

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;