import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import "./Finanzas.css";

function Finanzas() {
  const [pagos, setPagos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("Todos");

  const navigate = useNavigate();

  const usuario = JSON.parse(
    localStorage.getItem("usuarioRiccati")
  );

  useEffect(() => {
    fetch("http://localhost:3000/api/pagos")
      .then((respuesta) => respuesta.json())
      .then((datos) => setPagos(datos))
      .catch((error) =>
        console.error(
          "Error al cargar pagos:",
          error
        )
      );
  }, []);

  /* ========================================
     FORMATO DE DINERO
  ======================================== */

  const formatearColones = (monto) => {
    return `₡${Number(monto || 0).toLocaleString(
      "es-CR"
    )}`;
  };

  const formatearFecha = (fecha) => {
    if (!fecha) {
      return "-";
    }

    const [anio, mes, dia] = fecha.split("-");

    return `${dia}/${mes}/${anio}`;
  };

  /* ========================================
     PROYECTOS FINANCIEROS
  ======================================== */

  const proyectosFinancieros = pagos.reduce(
    (resultado, pago) => {
      let proyecto = resultado.find(
        (item) =>
          item.projectId === pago.projectId
      );

      if (!proyecto) {
        proyecto = {
          projectId: pago.projectId,
          montoAcordado:
            Number(pago.montoAcordado) || 0,
          pagado: 0,
          anulado: 0,
        };

        resultado.push(proyecto);
      }

      if (pago.estado === "Válido") {
        proyecto.pagado += Number(
          pago.monto || 0
        );
      }

      if (pago.estado === "Anulado") {
        proyecto.anulado += Number(
          pago.monto || 0
        );
      }

      return resultado;
    },
    []
  );

  /* ========================================
     TOTALES
  ======================================== */

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

  const totalAnulado = pagos
    .filter(
      (pago) => pago.estado === "Anulado"
    )
    .reduce(
      (total, pago) =>
        total + Number(pago.monto || 0),
      0
    );

  const saldoPendiente =
    totalAcordado - totalPagado;

  /* ========================================
     FILTROS
  ======================================== */

  const pagosFiltrados = pagos.filter(
    (pago) => {
      const texto =
        busqueda.toLowerCase();

      const coincideBusqueda =
        pago.projectId
          .toLowerCase()
          .includes(texto) ||
        pago.metodo
          .toLowerCase()
          .includes(texto) ||
        pago.referencia
          .toLowerCase()
          .includes(texto) ||
        pago.observaciones
          .toLowerCase()
          .includes(texto);

      const coincideEstado =
        filtroEstado === "Todos" ||
        pago.estado === filtroEstado;

      return (
        coincideBusqueda &&
        coincideEstado
      );
    }
  );

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
            className="menu-item active"
            onClick={() =>
              navigate("/finanzas")
            }
          >
            <span className="menu-icon">
              ₡
            </span>
            Finanzas
          </button>

        </div>

        <div className="sidebar-section">

          <span className="sidebar-title">
            ADMINISTRACIÓN
          </span>

          <button className="menu-item">
            <span className="menu-icon">
              ◇
            </span>
            Usuarios
          </button>

        </div>

        <div className="sidebar-user">

          <div className="user-avatar">
            {usuario?.nombre?.charAt(0) ||
              "A"}
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
              MÓDULO M06
            </span>

            <h1>
              Finanzas
            </h1>

            <p>
              Control básico de pagos,
              montos acordados y saldos
              pendientes de los proyectos.
            </p>

          </div>

          <div className="topbar-actions">

            <div className="system-status">

              <span className="status-dot">
              </span>

              {pagos.length} movimientos

            </div>

            <button className="notification-button">
              ₡
            </button>

          </div>

        </header>

        {/* ========================================
            TARJETAS
        ======================================== */}

        <section className="finanzas-stats">

          <div className="finance-stat-card">

            <div className="finance-stat-top">

              <span>
                MONTO ACORDADO
              </span>

              <div className="finance-stat-icon">
                ₡
              </div>

            </div>

            <strong>
              {formatearColones(
                totalAcordado
              )}
            </strong>

            <small>
              Total contratado
            </small>

          </div>

          <div className="finance-stat-card">

            <div className="finance-stat-top">

              <span>
                PAGOS RECIBIDOS
              </span>

              <div className="finance-stat-icon green">
                ✓
              </div>

            </div>

            <strong>
              {formatearColones(
                totalPagado
              )}
            </strong>

            <small className="finance-green">
              Pagos válidos
            </small>

          </div>

          <div className="finance-stat-card">

            <div className="finance-stat-top">

              <span>
                SALDO PENDIENTE
              </span>

              <div className="finance-stat-icon orange">
                !
              </div>

            </div>

            <strong>
              {formatearColones(
                saldoPendiente
              )}
            </strong>

            <small className="finance-orange">
              Pendiente de cobro
            </small>

          </div>

          <div className="finance-stat-card">

            <div className="finance-stat-top">

              <span>
                PAGOS ANULADOS
              </span>

              <div className="finance-stat-icon red">
                ×
              </div>

            </div>

            <strong>
              {formatearColones(
                totalAnulado
              )}
            </strong>

            <small className="finance-red">
              No contabilizados
            </small>

          </div>

        </section>

        {/* ========================================
            BALANCE POR PROYECTO
        ======================================== */}

        <section className="finance-projects-panel">

          <div className="finance-projects-header">

            <div>

              <span className="panel-label">
                BALANCE
              </span>

              <h3>
                Estado financiero por proyecto
              </h3>

            </div>

            <span className="finance-project-count">
              {proyectosFinancieros.length}
              {" "}
              proyectos
            </span>

          </div>

          <div className="finance-project-grid">

            {proyectosFinancieros.map(
              (proyecto) => {
                const pendiente =
                  proyecto.montoAcordado -
                  proyecto.pagado;

                const porcentaje =
                  proyecto.montoAcordado > 0
                    ? Math.min(
                        (
                          proyecto.pagado /
                          proyecto.montoAcordado
                        ) * 100,
                        100
                      )
                    : 0;

                return (

                  <div
                    className="finance-project-card"
                    key={proyecto.projectId}
                  >

                    <div className="finance-project-title">

                      <div className="finance-project-icon">
                        ◈
                      </div>

                      <div>

                        <strong>
                          {proyecto.projectId}
                        </strong>

                        <span>
                          Estado financiero
                        </span>

                      </div>

                    </div>

                    <div className="finance-project-values">

                      <div>
                        <span>
                          Acordado
                        </span>

                        <strong>
                          {formatearColones(
                            proyecto.montoAcordado
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pagado
                        </span>

                        <strong className="paid-value">
                          {formatearColones(
                            proyecto.pagado
                          )}
                        </strong>
                      </div>

                      <div>
                        <span>
                          Pendiente
                        </span>

                        <strong className="pending-value">
                          {formatearColones(
                            pendiente
                          )}
                        </strong>
                      </div>

                    </div>

                    <div className="finance-progress-info">

                      <span>
                        Progreso de pago
                      </span>

                      <strong>
                        {porcentaje.toFixed(0)}%
                      </strong>

                    </div>

                    <div className="finance-progress-track">

                      <div
                        className="finance-progress-fill"
                        style={{
                          width:
                            `${porcentaje}%`,
                        }}
                      ></div>

                    </div>

                  </div>

                );
              }
            )}

          </div>

        </section>

        {/* ========================================
            MOVIMIENTOS
        ======================================== */}

        <section className="finanzas-panel">

          <div className="finanzas-panel-header">

            <div>

              <span className="panel-label">
                MOVIMIENTOS
              </span>

              <h3>
                Historial de pagos
              </h3>

            </div>

            <div className="finanzas-actions">

              {/* BUSCADOR */}

              <div className="finanzas-search">

                <span>
                  ⌕
                </span>

                <input
                  type="text"
                  placeholder="Buscar pago..."
                  value={busqueda}
                  onChange={(e) =>
                    setBusqueda(
                      e.target.value
                    )
                  }
                />

              </div>

              {/* FILTRO */}

              <select
                className="finanzas-filter"
                value={filtroEstado}
                onChange={(e) =>
                  setFiltroEstado(
                    e.target.value
                  )
                }
              >

                <option value="Todos">
                  Todos
                </option>

                <option value="Válido">
                  Válidos
                </option>

                <option value="Anulado">
                  Anulados
                </option>

              </select>

              <button className="new-payment-button">
                + Registrar pago
              </button>

            </div>

          </div>

          {/* TABLA */}

          <div className="finanzas-table-wrapper">

            <table className="finanzas-table">

              <thead>

                <tr>
                  <th>PAGO</th>
                  <th>PROYECTO</th>
                  <th>MÉTODO</th>
                  <th>REFERENCIA</th>
                  <th>MONTO</th>
                  <th>ESTADO</th>
                  <th>FECHA</th>
                  <th>OBSERVACIONES</th>
                  <th></th>
                </tr>

              </thead>

              <tbody>

                {pagosFiltrados.map(
                  (pago) => (

                    <tr key={pago.id}>

                      <td>

                        <div className="payment-name">

                          <div className="payment-icon">
                            ₡
                          </div>

                          <div>

                            <strong>
                              Pago
                            </strong>

                            <span>
                              PAG-
                              {String(
                                pago.id
                              ).padStart(
                                3,
                                "0"
                              )}
                            </span>

                          </div>

                        </div>

                      </td>

                      <td>

                        <span className="payment-project">
                          {pago.projectId}
                        </span>

                      </td>

                      <td className="payment-method">
                        {pago.metodo}
                      </td>

                      <td>

                        <span className="payment-reference">
                          {pago.referencia}
                        </span>

                      </td>

                      <td>

                        <strong
                          className={
                            pago.estado ===
                            "Anulado"
                              ? "payment-amount annulled"
                              : "payment-amount"
                          }
                        >
                          {formatearColones(
                            pago.monto
                          )}
                        </strong>

                      </td>

                      <td>

                        <span
                          className={
                            pago.estado ===
                            "Válido"
                              ? "payment-status valid-payment"
                              : "payment-status cancelled-payment"
                          }
                        >

                          <span></span>

                          {pago.estado}

                        </span>

                      </td>

                      <td>

                        <span className="payment-date">
                          {formatearFecha(
                            pago.fecha
                          )}
                        </span>

                      </td>

                      <td>

                        <div className="payment-observation">
                          {pago.observaciones}
                        </div>

                      </td>

                      <td>

                        <button className="payment-options">
                          ···
                        </button>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

          {pagosFiltrados.length === 0 && (

            <div className="finance-empty">

              <div>
                ₡
              </div>

              <strong>
                No se encontraron pagos
              </strong>

              <span>
                Intenta cambiar la búsqueda
                o el filtro.
              </span>

            </div>

          )}

          <div className="finanzas-footer">

            <span>
              Mostrando{" "}
              {pagosFiltrados.length} de{" "}
              {pagos.length} movimientos
            </span>

            <span>
              Control financiero · M06
            </span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Finanzas;