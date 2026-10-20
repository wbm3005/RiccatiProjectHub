import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useNavigate } from "react-router-dom";

import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";

import {
  obtenerClientes,
} from "../services/clientesService";

import {
  obtenerProyectos,
} from "../services/proyectosService";


function Dashboard() {
  const navigate = useNavigate();


  // =====================================================
  // USUARIO ACTUAL
  // =====================================================

  const usuario = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "usuarioRiccati"
        )
      );
    } catch {
      return null;
    }
  }, []);


  // =====================================================
  // ESTADOS
  // =====================================================

  const [
    clientes,
    setClientes,
  ] = useState([]);

  const [
    proyectos,
    setProyectos,
  ] = useState([]);

  const [
    cargando,
    setCargando,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    cargarDashboard();
  }, []);


  const cargarDashboard = async () => {
    setCargando(true);
    setError("");

    try {
      const [
        datosClientes,
        datosProyectos,
      ] = await Promise.all([
        obtenerClientes(),
        obtenerProyectos(),
      ]);

      setClientes(
        Array.isArray(datosClientes)
          ? datosClientes
          : []
      );

      setProyectos(
        Array.isArray(datosProyectos)
          ? datosProyectos
          : []
      );

    } catch (error) {
      setError(
        error.message ||
          "No fue posible cargar la información del Dashboard."
      );

    } finally {
      setCargando(false);
    }
  };


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const clientesActivos =
    clientes.filter(
      (cliente) =>
        cliente.estado === "ACTIVO"
    ).length;


  const proyectosEnCurso =
    proyectos.filter(
      (proyecto) =>
        proyecto.estado === "En curso"
    ).length;


  const proyectosSuspendidos =
    proyectos.filter(
      (proyecto) =>
        proyecto.estado === "Suspendido"
    ).length;


  const proyectosFinalizados =
    proyectos.filter(
      (proyecto) =>
        proyecto.estado === "Finalizado"
    ).length;


  const proyectosRegistrados =
    proyectos.filter(
      (proyecto) =>
        proyecto.estado === "Registrado"
    ).length;


  // =====================================================
  // PROYECTOS RECIENTES
  // =====================================================

  const proyectosRecientes =
    useMemo(() => {
      return [...proyectos]
        .sort(
          (a, b) =>
            Number(b.id_proyecto) -
            Number(a.id_proyecto)
        )
        .slice(0, 5);
    }, [proyectos]);


  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <RiccatiLayout
        paginaActiva="dashboard"
      >
        <div className="riccati-loader-wrapper">

          <div className="riccati-loader">
          </div>

          <span className="riccati-loader-text">
            Cargando Dashboard...
          </span>

        </div>
      </RiccatiLayout>
    );
  }


  // =====================================================
  // INTERFAZ
  // =====================================================

  return (
    <RiccatiLayout
      paginaActiva="dashboard"
    >

      {/* =================================================
          HEADER
      ================================================= */}

      <PageHeader
        modulo="RICCATI PROJECT HUB"
        titulo="Dashboard"
        descripcion={
          `Bienvenido de nuevo, ${
            usuario?.nombre ||
            "Usuario"
          }. Aquí tienes el estado general de tus proyectos.`
        }
        estado="Sistema operativo"
      />


      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div
          className="login-error animate-up"
          style={{
            marginBottom: "16px",
          }}
        >
          {error}
        </div>
      )}


      {/* =================================================
          TARJETAS PRINCIPALES
      ================================================= */}

      <section className="riccati-stats-grid">

        <StatCard
          etiqueta="CLIENTES ACTIVOS"
          valor={clientesActivos}
          icono="◎"
          pie={`${clientes.length} clientes registrados`}
          clasePie="text-riccati-cyan"
        />

        <StatCard
          etiqueta="TOTAL PROYECTOS"
          valor={proyectos.length}
          icono="◉"
          pie="Proyectos registrados"
        />

        <StatCard
          etiqueta="EN CURSO"
          valor={proyectosEnCurso}
          icono="▶"
          pie="Actualmente en desarrollo"
          clasePie="text-riccati-green"
        />

        <StatCard
          etiqueta="FINALIZADOS"
          valor={proyectosFinalizados}
          icono="✓"
          pie="Proyectos completados"
          clasePie="text-riccati-cyan"
        />

      </section>


      {/* =================================================
          CONTENIDO PRINCIPAL
      ================================================= */}

      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "minmax(0, 2fr) minmax(280px, 0.8fr)",
          gap: "16px",
          marginTop: "16px",
        }}
      >

        {/* ===============================================
            PROYECTOS RECIENTES
        =============================================== */}

        <section className="riccati-panel animate-up delay-2">

          <div className="riccati-panel-header">

            <div>

              <span className="riccati-panel-label">
                PORTAFOLIO
              </span>

              <h3>
                Proyectos recientes
              </h3>

            </div>


            <button
              type="button"
              className="riccati-button-secondary"
              onClick={() =>
                navigate("/proyectos")
              }
            >
              Ver proyectos
            </button>

          </div>


          {/* SIN PROYECTOS */}

          {proyectosRecientes.length ===
          0 ? (

            <div className="riccati-empty">

              <div className="riccati-empty-icon">
                ◉
              </div>

              <strong>
                No hay proyectos registrados
              </strong>

              <span>
                Crea tu primer proyecto
                para comenzar.
              </span>

              <button
                type="button"
                className="riccati-button-primary"
                onClick={() =>
                  navigate("/proyectos")
                }
                style={{
                  marginTop: "14px",
                }}
              >
                Ir a proyectos
              </button>

            </div>

          ) : (

            <div className="riccati-table-wrapper">

              <table className="riccati-table">

                <thead>

                  <tr>

                    <th>
                      PROYECTO
                    </th>

                    <th>
                      CLIENTE
                    </th>

                    <th>
                      RESPONSABLE
                    </th>

                    <th>
                      ESTADO
                    </th>

                    <th>
                      COMPROMISO
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {proyectosRecientes.map(
                    (proyecto) => (

                      <tr
                        key={
                          proyecto.id_proyecto
                        }
                      >

                        {/* PROYECTO */}

                        <td>

                          <strong
                            style={{
                              display:
                                "block",

                              color:
                                "#e8f0f7",

                              fontSize:
                                "9px",
                            }}
                          >
                            {
                              proyecto.nombre
                            }
                          </strong>


                          <span
                            style={{
                              display:
                                "block",

                              marginTop:
                                "4px",

                              color:
                                "#26d9ff",

                              fontSize:
                                "7px",
                            }}
                          >
                            {
                              proyecto.codigo
                            }
                          </span>

                        </td>


                        {/* CLIENTE */}

                        <td>
                          {proyecto.cliente ||
                            "Sin cliente"}
                        </td>


                        {/* RESPONSABLE */}

                        <td>
                          {proyecto.responsable ||
                            "Sin asignar"}
                        </td>


                        {/* ESTADO */}

                        <td>

                          <EstadoBadge
                            estado={
                              proyecto.estado
                            }
                          />

                        </td>


                        {/* FECHA */}

                        <td>
                          {formatearFecha(
                            proyecto
                              .fecha_compromiso
                          )}
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


        {/* ===============================================
            RESUMEN OPERATIVO
        =============================================== */}

        <section className="riccati-panel animate-up delay-3">

          <div className="riccati-panel-header">

            <div>

              <span className="riccati-panel-label">
                RESUMEN
              </span>

              <h3>
                Estado de proyectos
              </h3>

            </div>

          </div>


          <div
            style={{
              padding: "18px",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
            }}
          >

            {/* REGISTRADOS */}

            <ResumenEstado
              etiqueta="Registrados"
              valor={
                proyectosRegistrados
              }
              total={
                proyectos.length
              }
              tipo="cyan"
            />


            {/* EN CURSO */}

            <ResumenEstado
              etiqueta="En curso"
              valor={
                proyectosEnCurso
              }
              total={
                proyectos.length
              }
              tipo="green"
            />


            {/* SUSPENDIDOS */}

            <ResumenEstado
              etiqueta="Suspendidos"
              valor={
                proyectosSuspendidos
              }
              total={
                proyectos.length
              }
              tipo="orange"
            />


            {/* FINALIZADOS */}

            <ResumenEstado
              etiqueta="Finalizados"
              valor={
                proyectosFinalizados
              }
              total={
                proyectos.length
              }
              tipo="cyan"
            />


            {/* ACCIONES */}

            <div
              style={{
                marginTop: "8px",
                paddingTop: "16px",

                borderTop:
                  "1px solid rgba(255,255,255,0.05)",

                display: "grid",
                gap: "8px",
              }}
            >

              <button
                type="button"
                className="riccati-button-primary"
                onClick={() =>
                  navigate("/proyectos")
                }
                style={{
                  width: "100%",
                }}
              >
                Gestionar proyectos
              </button>


              <button
                type="button"
                className="riccati-button-secondary"
                onClick={() =>
                  navigate("/clientes")
                }
                style={{
                  width: "100%",
                }}
              >
                Ver clientes
              </button>

            </div>

          </div>

        </section>

      </div>

    </RiccatiLayout>
  );
}


/* =====================================================
   RESUMEN DE ESTADO
===================================================== */

function ResumenEstado({
  etiqueta,
  valor,
  total,
  tipo,
}) {
  const porcentaje =
    total > 0
      ? Math.round(
          (valor / total) * 100
        )
      : 0;


  const colores = {
    cyan: "#26d9ff",
    green: "#2de2a6",
    orange: "#ffb84d",
    red: "#ff7185",
  };


  const color =
    colores[tipo] ||
    colores.cyan;


  return (
    <div
      style={{
        padding: "14px",

        border:
          "1px solid rgba(255,255,255,0.05)",

        borderRadius: "12px",

        background:
          "rgba(255,255,255,0.015)",
      }}
    >

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent:
            "space-between",
          gap: "12px",
          marginBottom: "10px",
        }}
      >

        <span
          style={{
            color: "#8ba0b5",
            fontSize: "8px",
            fontWeight: "600",
          }}
        >
          {etiqueta}
        </span>


        <strong
          style={{
            color,
            fontSize: "12px",
          }}
        >
          {valor}
        </strong>

      </div>


      {/* BARRA */}

      <div
        style={{
          height: "4px",

          borderRadius: "10px",

          background:
            "rgba(255,255,255,0.05)",

          overflow: "hidden",
        }}
      >

        <div
          style={{
            width:
              `${porcentaje}%`,

            height: "100%",

            background: color,

            borderRadius: "10px",

            transition:
              "width 0.8s ease",
          }}
        />

      </div>


      <span
        style={{
          display: "block",

          marginTop: "7px",

          color: "#50677e",

          fontSize: "7px",
        }}
      >
        {porcentaje}% del total
      </span>

    </div>
  );
}


/* =====================================================
   BADGE DE ESTADO
===================================================== */

function EstadoBadge({
  estado,
}) {
  if (estado === "En curso") {
    return (
      <span className="riccati-badge riccati-badge-green">
        En curso
      </span>
    );
  }


  if (estado === "Suspendido") {
    return (
      <span className="riccati-badge riccati-badge-orange">
        Suspendido
      </span>
    );
  }


  if (estado === "Finalizado") {
    return (
      <span className="riccati-badge riccati-badge-cyan">
        Finalizado
      </span>
    );
  }


  if (estado === "Archivado") {
    return (
      <span className="riccati-badge riccati-badge-purple">
        Archivado
      </span>
    );
  }


  return (
    <span className="riccati-badge riccati-badge-cyan">
      {estado || "Registrado"}
    </span>
  );
}


/* =====================================================
   FORMATEAR FECHA
===================================================== */

function formatearFecha(fecha) {
  if (!fecha) {
    return "No definida";
  }


  const valor =
    String(fecha)
      .split("T")[0];


  const partes =
    valor.split("-");


  if (partes.length !== 3) {
    return valor;
  }


  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


export default Dashboard;