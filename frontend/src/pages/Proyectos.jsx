import {
  useEffect,
  useMemo,
  useState,
} from "react";

import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ProyectoModal from "../components/ProyectoModal";
import ProyectoFichaModal from "../components/ProyectoFichaModal";

import {
  obtenerProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  obtenerPrioridades,
  obtenerEstados,
  obtenerResponsables,
  asignarResponsable,
  cambiarEstadoProyecto,
} from "../services/proyectosService";

import {
  obtenerClientes,
  obtenerCliente,
} from "../services/clientesService";


function Proyectos() {
  // =====================================================
  // DATOS PRINCIPALES
  // =====================================================

  const [proyectos, setProyectos] =
    useState([]);

  const [clientes, setClientes] =
    useState([]);

  const [prioridades, setPrioridades] =
    useState([]);

  const [estados, setEstados] =
    useState([]);

  const [responsables, setResponsables] =
    useState([]);

  const [contactos, setContactos] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");


  // =====================================================
  // MODAL CREAR / EDITAR
  // =====================================================

  const [
    mostrarModal,
    setMostrarModal,
  ] = useState(false);

  const [
    proyectoEditando,
    setProyectoEditando,
  ] = useState(null);


  // =====================================================
  // FICHA DEL PROYECTO
  // =====================================================

  const [
    mostrarFicha,
    setMostrarFicha,
  ] = useState(false);

  const [
    cargandoFicha,
    setCargandoFicha,
  ] = useState(false);

  const [
    proyectoSeleccionado,
    setProyectoSeleccionado,
  ] = useState(null);

  const [
    responsablesProyecto,
    setResponsablesProyecto,
  ] = useState([]);

  const [
    errorFicha,
    setErrorFicha,
  ] = useState("");

  const [
    estadoSeleccionado,
    setEstadoSeleccionado,
  ] = useState("");

  const [
    responsableSeleccionado,
    setResponsableSeleccionado,
  ] = useState("");


  // =====================================================
  // FORMULARIO
  // =====================================================

  const formularioInicial = {
    nombre: "",
    id_cliente: "",
    id_contacto_principal: "",
    id_responsable: "",
    id_prioridad: "",
    descripcion: "",
    contrato: "",
    observaciones: "",
    fecha_inicio: "",
    fecha_compromiso: "",
    fecha_finalizacion: "",
  };

  const [
    formulario,
    setFormulario,
  ] = useState(formularioInicial);


  // =====================================================
  // CARGA INICIAL
  // =====================================================

  useEffect(() => {
    // Evita que Fast Refresh conserve
    // una ficha abierta anteriormente.
    setMostrarFicha(false);
    setProyectoSeleccionado(null);
    setCargandoFicha(false);
    setErrorFicha("");

    setMostrarModal(false);
    setProyectoEditando(null);

    cargarTodo();
  }, []);


  const cargarTodo = async () => {
    setCargando(true);
    setError("");

    try {
      const [
        datosProyectos,
        datosClientes,
        datosPrioridades,
        datosEstados,
        datosResponsables,
      ] = await Promise.all([
        obtenerProyectos(),
        obtenerClientes(),
        obtenerPrioridades(),
        obtenerEstados(),
        obtenerResponsables(),
      ]);

      setProyectos(
        Array.isArray(datosProyectos)
          ? datosProyectos
          : []
      );

      setClientes(
        Array.isArray(datosClientes)
          ? datosClientes
          : []
      );

      setPrioridades(
        Array.isArray(datosPrioridades)
          ? datosPrioridades
          : []
      );

      setEstados(
        Array.isArray(datosEstados)
          ? datosEstados
          : []
      );

      setResponsables(
        Array.isArray(datosResponsables)
          ? datosResponsables
          : []
      );

    } catch (error) {
      setError(
        error.message ||
          "No fue posible cargar los proyectos."
      );

    } finally {
      setCargando(false);
    }
  };


  // =====================================================
  // RECARGAR PROYECTOS
  // =====================================================

  const recargarProyectos = async () => {
    const datos =
      await obtenerProyectos();

    setProyectos(
      Array.isArray(datos)
        ? datos
        : []
    );
  };


  // =====================================================
  // BUSCADOR
  // =====================================================

  const proyectosFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return proyectos;
      }

      return proyectos.filter(
        (proyecto) =>
          proyecto.codigo
            ?.toLowerCase()
            .includes(texto) ||

          proyecto.nombre
            ?.toLowerCase()
            .includes(texto) ||

          proyecto.cliente
            ?.toLowerCase()
            .includes(texto) ||

          proyecto.responsable
            ?.toLowerCase()
            .includes(texto) ||

          proyecto.estado
            ?.toLowerCase()
            .includes(texto)
      );

    }, [proyectos, busqueda]);


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const enCurso =
    proyectos.filter(
      (p) =>
        p.estado === "En curso"
    ).length;

  const suspendidos =
    proyectos.filter(
      (p) =>
        p.estado === "Suspendido"
    ).length;

  const finalizados =
    proyectos.filter(
      (p) =>
        p.estado === "Finalizado"
    ).length;


  // =====================================================
  // CONTACTOS DEL CLIENTE
  // =====================================================

  const cargarContactos =
    async (idCliente) => {

      if (!idCliente) {
        setContactos([]);
        return;
      }

      try {
        const datos =
          await obtenerCliente(
            idCliente
          );

        setContactos(
          Array.isArray(datos?.contactos)
            ? datos.contactos
            : []
        );

      } catch (error) {
        console.error(
          "Error cargando contactos:",
          error
        );

        setContactos([]);
      }
    };


  // =====================================================
  // CAMBIOS DEL FORMULARIO
  // =====================================================

  const manejarCambio =
    async (e) => {

      const {
        name,
        value,
      } = e.target;


      // Si cambia el cliente,
      // cargamos sus contactos.

      if (name === "id_cliente") {
        setFormulario(
          (anterior) => ({
            ...anterior,
            id_cliente: value,
            id_contacto_principal: "",
          })
        );

        await cargarContactos(
          value
        );

        return;
      }


      setFormulario(
        (anterior) => ({
          ...anterior,
          [name]: value,
        })
      );
    };


  // =====================================================
  // NUEVO PROYECTO
  // =====================================================

  const abrirNuevoProyecto = () => {
    // Cerramos cualquier ficha
    // antes de abrir creación.
    setMostrarFicha(false);
    setProyectoSeleccionado(null);
    setResponsablesProyecto([]);
    setErrorFicha("");

    setProyectoEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setContactos([]);

    setError("");
    setMensaje("");

    setMostrarModal(true);
  };


  // =====================================================
  // EDITAR PROYECTO
  // =====================================================

  const abrirEditarProyecto =
    async (
      proyecto =
        proyectoSeleccionado
    ) => {

      if (!proyecto) {
        return;
      }

      setError("");

      setProyectoEditando(
        proyecto
      );

      await cargarContactos(
        proyecto.id_cliente
      );


      const responsablePrincipal =
        responsablesProyecto.find(
          (responsable) =>
            responsable
              .es_responsable_principal
        );


      setFormulario({
        nombre:
          proyecto.nombre || "",

        id_cliente:
          String(
            proyecto.id_cliente || ""
          ),

        id_contacto_principal:
          String(
            proyecto
              .id_contacto_principal ||
              ""
          ),

        id_responsable:
          responsablePrincipal
            ?.id_usuario
            ? String(
                responsablePrincipal
                  .id_usuario
              )
            : "",

        id_prioridad:
          String(
            proyecto.id_prioridad || ""
          ),

        descripcion:
          proyecto.descripcion || "",

        contrato:
          proyecto.contrato || "",

        observaciones:
          proyecto.observaciones || "",

        fecha_inicio:
          prepararFecha(
            proyecto.fecha_inicio
          ),

        fecha_compromiso:
          prepararFecha(
            proyecto
              .fecha_compromiso
          ),

        fecha_finalizacion:
          prepararFecha(
            proyecto
              .fecha_finalizacion
          ),
      });


      // Cerramos ficha y abrimos
      // modal de edición.

      setMostrarFicha(false);
      setMostrarModal(true);
    };


  // =====================================================
  // CERRAR MODAL
  // =====================================================

  const cerrarModal = () => {
    if (guardando) {
      return;
    }

    setMostrarModal(false);
    setProyectoEditando(null);

    setFormulario({
      ...formularioInicial,
    });

    setContactos([]);
    setError("");
  };


  // =====================================================
  // GUARDAR PROYECTO
  // =====================================================

  const guardarProyecto =
    async (e) => {

      e.preventDefault();

      setGuardando(true);
      setError("");
      setMensaje("");

      try {

        // =========================
        // EDITAR
        // =========================

        if (proyectoEditando) {
          const resultado =
            await actualizarProyecto(
              proyectoEditando
                .id_proyecto,
              formulario
            );


          if (
            formulario
              .id_responsable
          ) {
            await asignarResponsable(
              proyectoEditando
                .id_proyecto,
              formulario
                .id_responsable
            );
          }


          setMensaje(
            resultado.mensaje ||
              "Proyecto actualizado correctamente."
          );

        }

        // =========================
        // CREAR
        // =========================

        else {
          const resultado =
            await crearProyecto(
              formulario
            );


          const codigo =
            resultado?.proyecto
              ?.codigo || "";


          setMensaje(
            `${
              resultado.mensaje ||
              "Proyecto registrado correctamente."
            } ${codigo}`
          );
        }


        setMostrarModal(false);
        setProyectoEditando(null);

        setFormulario({
          ...formularioInicial,
        });

        setContactos([]);

        await recargarProyectos();


        setTimeout(() => {
          setMensaje("");
        }, 4000);

      } catch (error) {
        setError(
          error.message ||
            "No fue posible guardar el proyecto."
        );

      } finally {
        setGuardando(false);
      }
    };


  // =====================================================
  // ABRIR FICHA
  // =====================================================

  const abrirFicha =
    async (idProyecto) => {

      if (!idProyecto) {
        return;
      }


      // Evitamos tener ambos
      // modales abiertos.
      setMostrarModal(false);

      setProyectoSeleccionado(
        null
      );

      setResponsablesProyecto(
        []
      );

      setEstadoSeleccionado("");
      setResponsableSeleccionado("");

      setErrorFicha("");
      setCargandoFicha(true);

      // Ahora sí mostramos ficha.
      setMostrarFicha(true);


      try {
        const datos =
          await obtenerProyecto(
            idProyecto
          );


        if (!datos?.proyecto) {
          throw new Error(
            "No fue posible cargar la información del proyecto."
          );
        }


        setProyectoSeleccionado(
          datos.proyecto
        );

        setResponsablesProyecto(
          Array.isArray(
            datos.responsables
          )
            ? datos.responsables
            : []
        );

      } catch (error) {
        setErrorFicha(
          error.message ||
            "No fue posible cargar la ficha del proyecto."
        );

      } finally {
        setCargandoFicha(false);
      }
    };


  // =====================================================
  // RECARGAR FICHA
  // =====================================================

  const recargarFicha =
    async () => {

      if (!proyectoSeleccionado) {
        return;
      }


      const datos =
        await obtenerProyecto(
          proyectoSeleccionado
            .id_proyecto
        );


      if (datos?.proyecto) {
        setProyectoSeleccionado(
          datos.proyecto
        );
      }


      setResponsablesProyecto(
        Array.isArray(
          datos?.responsables
        )
          ? datos.responsables
          : []
      );
    };


  // =====================================================
  // CAMBIAR RESPONSABLE
  // =====================================================

  const cambiarResponsable =
    async () => {

      if (
        !proyectoSeleccionado ||
        !responsableSeleccionado
      ) {
        return;
      }


      setActualizando(true);
      setErrorFicha("");


      try {
        const resultado =
          await asignarResponsable(
            proyectoSeleccionado
              .id_proyecto,
            responsableSeleccionado
          );


        setMensaje(
          resultado.mensaje ||
            "Responsable actualizado correctamente."
        );


        setResponsableSeleccionado(
          ""
        );


        await recargarFicha();
        await recargarProyectos();


        setTimeout(() => {
          setMensaje("");
        }, 3500);

      } catch (error) {
        setErrorFicha(
          error.message ||
            "No fue posible cambiar el responsable."
        );

      } finally {
        setActualizando(false);
      }
    };


  // =====================================================
  // CAMBIAR ESTADO
  // =====================================================

  const cambiarEstado =
    async () => {

      if (
        !proyectoSeleccionado ||
        !estadoSeleccionado
      ) {
        return;
      }


      setActualizando(true);
      setErrorFicha("");


      try {
        const resultado =
          await cambiarEstadoProyecto(
            proyectoSeleccionado
              .id_proyecto,
            estadoSeleccionado
          );


        setMensaje(
          resultado.mensaje ||
            "Estado actualizado correctamente."
        );


        setEstadoSeleccionado(
          ""
        );


        await recargarFicha();
        await recargarProyectos();


        setTimeout(() => {
          setMensaje("");
        }, 3500);

      } catch (error) {
        setErrorFicha(
          error.message ||
            "No fue posible cambiar el estado."
        );

      } finally {
        setActualizando(false);
      }
    };


  // =====================================================
  // CERRAR FICHA
  // =====================================================

  const cerrarFicha = () => {
    if (actualizando) {
      return;
    }


    setMostrarFicha(false);

    setCargandoFicha(false);

    setProyectoSeleccionado(
      null
    );

    setResponsablesProyecto(
      []
    );

    setEstadoSeleccionado("");
    setResponsableSeleccionado("");

    setErrorFicha("");
  };


  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (cargando) {
    return (
      <RiccatiLayout
        paginaActiva="proyectos"
      >
        <div className="riccati-loader-wrapper">

          <div className="riccati-loader">
          </div>

          <span className="riccati-loader-text">
            Cargando proyectos...
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
      paginaActiva="proyectos"
    >

      <PageHeader
        modulo="MÓDULO M03 · PROYECTOS"
        titulo="Proyectos"
        descripcion="Creación, actualización y seguimiento operativo de proyectos."
        estado="PostgreSQL conectado"
      />


      {/* =================================================
          MENSAJE
      ================================================= */}

      {mensaje && (
        <div
          className="animate-up"
          style={{
            marginBottom: "16px",
            padding: "12px 15px",
            borderRadius: "10px",

            border:
              "1px solid rgba(45,226,166,0.15)",

            background:
              "rgba(45,226,166,0.06)",

            color: "#2de2a6",
            fontSize: "9px",
          }}
        >
          ✓ {mensaje}
        </div>
      )}


      {/* =================================================
          ERROR GENERAL
      ================================================= */}

      {error &&
        !mostrarModal && (
          <div className="login-error animate-up">
            {error}
          </div>
        )}


      {/* =================================================
          ESTADÍSTICAS
      ================================================= */}

      <section className="riccati-stats-grid">

        <StatCard
          etiqueta="TOTAL PROYECTOS"
          valor={proyectos.length}
          icono="◉"
          pie="Proyectos registrados"
        />

        <StatCard
          etiqueta="EN CURSO"
          valor={enCurso}
          icono="▶"
          pie="Actualmente en desarrollo"
          clasePie="text-riccati-green"
        />

        <StatCard
          etiqueta="SUSPENDIDOS"
          valor={suspendidos}
          icono="!"
          pie="Proyectos suspendidos"
          clasePie="text-riccati-orange"
        />

        <StatCard
          etiqueta="FINALIZADOS"
          valor={finalizados}
          icono="✓"
          pie="Proyectos completados"
          clasePie="text-riccati-cyan"
        />

      </section>


      {/* =================================================
          PANEL DE PROYECTOS
      ================================================= */}

      <section className="riccati-panel animate-up delay-2">

        <div className="riccati-panel-header">

          <div>
            <span className="riccati-panel-label">
              PORTAFOLIO
            </span>

            <h3>
              Proyectos registrados
            </h3>
          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            {/* BUSCADOR */}

            <div className="riccati-search">

              <span className="riccati-search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Buscar proyecto..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
              />

            </div>


            {/* NUEVO PROYECTO */}

            <button
              type="button"
              className="riccati-button-primary"
              onClick={
                abrirNuevoProyecto
              }
            >
              + Nuevo proyecto
            </button>

          </div>

        </div>


        {/* =================================================
            SIN PROYECTOS
        ================================================= */}

        {proyectos.length === 0 ? (

          <div className="riccati-empty">

            <div className="riccati-empty-icon">
              ◉
            </div>

            <strong>
              No hay proyectos registrados
            </strong>

            <span>
              Crea el primer proyecto para comenzar.
            </span>

            <button
              type="button"
              className="riccati-button-primary"
              onClick={
                abrirNuevoProyecto
              }
              style={{
                marginTop: "14px",
              }}
            >
              + Crear proyecto
            </button>

          </div>

        ) : (

          <>
            {/* =============================================
                TABLA
            ============================================= */}

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
                      PRIORIDAD
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

                    <th>
                      ACCIONES
                    </th>
                  </tr>
                </thead>


                <tbody>

                  {proyectosFiltrados.map(
                    (proyecto) => (

                      <tr
                        key={
                          proyecto
                            .id_proyecto
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
                              proyecto
                                .nombre
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
                              proyecto
                                .codigo
                            }
                          </span>

                        </td>


                        {/* CLIENTE */}

                        <td>
                          {proyecto.cliente ||
                            "Sin cliente"}
                        </td>


                        {/* PRIORIDAD */}

                        <td>
                          <PrioridadBadge
                            prioridad={
                              proyecto
                                .prioridad
                            }
                          />
                        </td>


                        {/* RESPONSABLE */}

                        <td>
                          {proyecto
                            .responsable ||
                            "Sin asignar"}
                        </td>


                        {/* ESTADO */}

                        <td>
                          <EstadoProyecto
                            estado={
                              proyecto
                                .estado
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


                        {/* ACCIONES */}

                        <td>
                          <button
                            type="button"
                            className="riccati-button-secondary"
                            onClick={() =>
                              abrirFicha(
                                proyecto
                                  .id_proyecto
                              )
                            }
                          >
                            Ver ficha
                          </button>
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>


            {/* CONTADOR */}

            <div
              style={{
                padding:
                  "12px 16px",

                color:
                  "#50677e",

                fontSize:
                  "7px",
              }}
            >
              Mostrando{" "}
              {
                proyectosFiltrados.length
              }{" "}
              de{" "}
              {
                proyectos.length
              }{" "}
              proyectos
            </div>

          </>
        )}

      </section>


      {/* =================================================
          MODAL CREAR / EDITAR

          Solo existe cuando realmente debe mostrarse.
      ================================================= */}

      {mostrarModal && (
        <ProyectoModal
          mostrar={mostrarModal}

          proyectoEditando={
            proyectoEditando
          }

          formulario={
            formulario
          }

          clientes={
            clientes.filter(
              (cliente) =>
                cliente.estado ===
                "ACTIVO"
            )
          }

          contactos={
            contactos
          }

          prioridades={
            prioridades
          }

          responsables={
            responsables
          }

          error={error}

          guardando={
            guardando
          }

          onChange={
            manejarCambio
          }

          onSubmit={
            guardarProyecto
          }

          onClose={
            cerrarModal
          }
        />
      )}


      {/* =================================================
          FICHA DEL PROYECTO

          IMPORTANTE:
          No se monta si mostrarFicha es false.

          Y si por alguna razón mostrarFicha queda true,
          necesita estar cargando, tener un proyecto
          o tener un error para poder aparecer.
      ================================================= */}

      {mostrarFicha &&
        (
          cargandoFicha ||
          proyectoSeleccionado ||
          errorFicha
        ) && (
          <ProyectoFichaModal
            mostrar={true}

            proyecto={
              proyectoSeleccionado
            }

            responsablesProyecto={
              responsablesProyecto
            }

            estados={
              estados
            }

            responsables={
              responsables
            }

            estadoSeleccionado={
              estadoSeleccionado
            }

            responsableSeleccionado={
              responsableSeleccionado
            }

            cargando={
              cargandoFicha
            }

            actualizando={
              actualizando
            }

            error={
              errorFicha
            }

            onCambiarEstado={
              cambiarEstado
            }

            onCambiarResponsable={
              cambiarResponsable
            }

            onChangeEstado={
              setEstadoSeleccionado
            }

            onChangeResponsable={
              setResponsableSeleccionado
            }

            onEditar={() =>
              abrirEditarProyecto(
                proyectoSeleccionado
              )
            }

            onClose={
              cerrarFicha
            }
          />
        )}

    </RiccatiLayout>
  );
}


/* =====================================================
   PRIORIDAD
===================================================== */

function PrioridadBadge({
  prioridad,
}) {
  if (prioridad === "Alta") {
    return (
      <span className="riccati-badge riccati-badge-red">
        Alta
      </span>
    );
  }


  if (prioridad === "Media") {
    return (
      <span className="riccati-badge riccati-badge-orange">
        Media
      </span>
    );
  }


  if (prioridad === "Baja") {
    return (
      <span className="riccati-badge riccati-badge-green">
        Baja
      </span>
    );
  }


  return (
    <span className="riccati-badge riccati-badge-cyan">
      Sin prioridad
    </span>
  );
}


/* =====================================================
   ESTADO
===================================================== */

function EstadoProyecto({
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
   PREPARAR FECHA PARA INPUT
===================================================== */

function prepararFecha(fecha) {
  if (!fecha) {
    return "";
  }

  return String(fecha)
    .split("T")[0];
}


/* =====================================================
   MOSTRAR FECHA
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


export default Proyectos;