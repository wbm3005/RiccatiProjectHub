import {
  useEffect,
  useMemo,
  useState,
} from "react";

import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ClienteModal from "../components/ClienteModal";
import ClienteFichaModal from "../components/ClienteFichaModal";
import ContactoModal from "../components/ContactoModal";

import {
  obtenerClientes,
  obtenerCliente,
  crearCliente,
  crearContactoCliente,
} from "../services/clientesService";


function Clientes() {
  const [clientes, setClientes] =
    useState([]);

  const [busqueda, setBusqueda] =
    useState("");

  const [cargando, setCargando] =
    useState(true);

  const [guardando, setGuardando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");


  // =====================================================
  // MODAL CLIENTE
  // =====================================================

  const [
    mostrarModalCliente,
    setMostrarModalCliente,
  ] = useState(false);


  // =====================================================
  // FICHA CLIENTE
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
    clienteSeleccionado,
    setClienteSeleccionado,
  ] = useState(null);

  const [
    contactosSeleccionados,
    setContactosSeleccionados,
  ] = useState([]);

  const [
    errorFicha,
    setErrorFicha,
  ] = useState("");


  // =====================================================
  // MODAL CONTACTO
  // =====================================================

  const [
    mostrarModalContacto,
    setMostrarModalContacto,
  ] = useState(false);

  const [
    guardandoContacto,
    setGuardandoContacto,
  ] = useState(false);

  const [
    errorContacto,
    setErrorContacto,
  ] = useState("");


  // =====================================================
  // FORM CLIENTE
  // =====================================================

  const [formulario, setFormulario] =
    useState({
      nombre_razon_social: "",
      identificacion: "",
      correo_general: "",
      telefono_general: "",
      direccion: "",
      observaciones: "",
      estado: "ACTIVO",
    });


  // =====================================================
  // CONTACTO PRINCIPAL AL CREAR CLIENTE
  // =====================================================

  const [
    contacto,
    setContacto,
  ] = useState({
    nombre: "",
    puesto: "",
    correo: "",
    telefono: "",
  });


  // =====================================================
  // NUEVO CONTACTO
  // =====================================================

  const [
    nuevoContacto,
    setNuevoContacto,
  ] = useState({
    nombre: "",
    puesto: "",
    correo: "",
    telefono: "",
    es_principal: false,
  });


  // =====================================================
  // INICIO
  // =====================================================

  useEffect(() => {
    cargarClientes();
  }, []);


  // =====================================================
  // CARGAR CLIENTES
  // =====================================================

  const cargarClientes = async () => {
    setCargando(true);
    setError("");

    try {
      const datos =
        await obtenerClientes();

      setClientes(datos);

    } catch (error) {
      setError(error.message);

    } finally {
      setCargando(false);
    }
  };


  // =====================================================
  // BUSCADOR
  // =====================================================

  const clientesFiltrados =
    useMemo(() => {
      const texto =
        busqueda
          .trim()
          .toLowerCase();

      if (!texto) {
        return clientes;
      }

      return clientes.filter(
        (cliente) =>
          cliente.nombre_razon_social
            ?.toLowerCase()
            .includes(texto) ||

          cliente.identificacion
            ?.toLowerCase()
            .includes(texto) ||

          cliente.correo_general
            ?.toLowerCase()
            .includes(texto) ||

          cliente.telefono_general
            ?.toLowerCase()
            .includes(texto)
      );

    }, [clientes, busqueda]);


  // =====================================================
  // ESTADÍSTICAS
  // =====================================================

  const activos =
    clientes.filter(
      (cliente) =>
        cliente.estado === "ACTIVO"
    ).length;


  const totalContactos =
    clientes.reduce(
      (total, cliente) =>
        total +
        Number(
          cliente.cantidad_contactos || 0
        ),
      0
    );


  // =====================================================
  // CAMBIO CLIENTE
  // =====================================================

  const manejarCambioCliente =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setFormulario(
        (anterior) => ({
          ...anterior,
          [name]: value,
        })
      );
    };


  // =====================================================
  // CAMBIO CONTACTO PRINCIPAL
  // =====================================================

  const manejarCambioContacto =
    (e) => {
      const {
        name,
        value,
      } = e.target;

      setContacto(
        (anterior) => ({
          ...anterior,
          [name]: value,
        })
      );
    };


  // =====================================================
  // CAMBIO NUEVO CONTACTO
  // =====================================================

  const manejarCambioNuevoContacto =
    (e) => {
      const {
        name,
        value,
        type,
        checked,
      } = e.target;

      setNuevoContacto(
        (anterior) => ({
          ...anterior,

          [name]:
            type === "checkbox"
              ? checked
              : value,
        })
      );
    };


  // =====================================================
  // NUEVO CLIENTE
  // =====================================================

  const abrirNuevoCliente = () => {
    setError("");

    setFormulario({
      nombre_razon_social: "",
      identificacion: "",
      correo_general: "",
      telefono_general: "",
      direccion: "",
      observaciones: "",
      estado: "ACTIVO",
    });

    setContacto({
      nombre: "",
      puesto: "",
      correo: "",
      telefono: "",
    });

    setMostrarModalCliente(true);
  };


  const cerrarModalCliente = () => {
    if (guardando) {
      return;
    }

    setMostrarModalCliente(false);
    setError("");
  };


  // =====================================================
  // GUARDAR CLIENTE
  // =====================================================

  const guardarCliente =
    async (e) => {
      e.preventDefault();

      setGuardando(true);
      setError("");
      setMensaje("");

      try {
        const datos = {
          ...formulario,

          contactoPrincipal:
            contacto.nombre.trim()
              ? contacto
              : null,
        };

        const resultado =
          await crearCliente(
            datos
          );

        setMensaje(
          resultado.mensaje
        );

        setMostrarModalCliente(
          false
        );

        await cargarClientes();

        setTimeout(() => {
          setMensaje("");
        }, 3500);

      } catch (error) {
        setError(error.message);

      } finally {
        setGuardando(false);
      }
    };


  // =====================================================
  // ABRIR FICHA
  // =====================================================

  const abrirFicha =
    async (idCliente) => {
      setMostrarFicha(true);
      setCargandoFicha(true);

      setClienteSeleccionado(
        null
      );

      setContactosSeleccionados(
        []
      );

      setErrorFicha("");

      try {
        const datos =
          await obtenerCliente(
            idCliente
          );

        setClienteSeleccionado(
          datos.cliente
        );

        setContactosSeleccionados(
          datos.contactos || []
        );

      } catch (error) {
        setErrorFicha(
          error.message
        );

      } finally {
        setCargandoFicha(false);
      }
    };


  const cerrarFicha = () => {
    if (mostrarModalContacto) {
      return;
    }

    setMostrarFicha(false);

    setClienteSeleccionado(
      null
    );

    setContactosSeleccionados(
      []
    );

    setErrorFicha("");
  };


  // =====================================================
  // ABRIR NUEVO CONTACTO
  // =====================================================

  const abrirNuevoContacto = () => {
    if (!clienteSeleccionado) {
      return;
    }

    setErrorContacto("");

    setNuevoContacto({
      nombre: "",
      puesto: "",
      correo: "",
      telefono: "",
      es_principal: false,
    });

    setMostrarModalContacto(
      true
    );
  };


  const cerrarModalContacto = () => {
    if (guardandoContacto) {
      return;
    }

    setMostrarModalContacto(
      false
    );

    setErrorContacto("");
  };


  // =====================================================
  // GUARDAR CONTACTO
  // =====================================================

  const guardarNuevoContacto =
    async (e) => {
      e.preventDefault();

      if (!clienteSeleccionado) {
        return;
      }

      setGuardandoContacto(true);
      setErrorContacto("");

      try {
        const resultado =
          await crearContactoCliente(
            clienteSeleccionado.id_cliente,
            nuevoContacto
          );

        setMostrarModalContacto(
          false
        );

        // ACTUALIZAR FICHA

        const fichaActualizada =
          await obtenerCliente(
            clienteSeleccionado.id_cliente
          );

        setClienteSeleccionado(
          fichaActualizada.cliente
        );

        setContactosSeleccionados(
          fichaActualizada.contactos || []
        );


        // ACTUALIZAR TABLA Y CONTADORES

        const listaActualizada =
          await obtenerClientes();

        setClientes(
          listaActualizada
        );


        setMensaje(
          resultado.mensaje
        );

        setTimeout(() => {
          setMensaje("");
        }, 3500);

      } catch (error) {
        setErrorContacto(
          error.message
        );

      } finally {
        setGuardandoContacto(false);
      }
    };


  // =====================================================
  // CARGANDO
  // =====================================================

  if (cargando) {
    return (
      <RiccatiLayout paginaActiva="clientes">

        <div className="riccati-loader-wrapper">

          <div className="riccati-loader">
          </div>

          <span className="riccati-loader-text">
            Cargando clientes...
          </span>

        </div>

      </RiccatiLayout>
    );
  }


  return (
    <RiccatiLayout paginaActiva="clientes">

      <PageHeader
        modulo="MÓDULO M02 · CLIENTES"
        titulo="Clientes"
        descripcion="Registro y consulta de clientes y sus contactos asociados."
        estado="PostgreSQL conectado"
      />


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


      {error &&
        !mostrarModalCliente && (
          <div className="login-error animate-up">
            {error}
          </div>
        )}


      {/* ESTADÍSTICAS */}

      <section className="riccati-stats-grid">

        <StatCard
          etiqueta="TOTAL CLIENTES"
          valor={clientes.length}
          icono="◎"
          pie="Clientes registrados"
        />

        <StatCard
          etiqueta="CLIENTES ACTIVOS"
          valor={activos}
          icono="✓"
          pie="Actualmente activos"
          clasePie="text-riccati-green"
        />

        <StatCard
          etiqueta="CONTACTOS"
          valor={totalContactos}
          icono="◇"
          pie="Contactos registrados"
        />

        <StatCard
          etiqueta="MÓDULO"
          valor="M02"
          icono="02"
          pie="Sprint 1"
          clasePie="text-riccati-cyan"
        />

      </section>


      {/* PANEL */}

      <section className="riccati-panel animate-up delay-2">

        <div className="riccati-panel-header">

          <div>

            <span className="riccati-panel-label">
              DIRECTORIO
            </span>

            <h3>
              Clientes registrados
            </h3>

          </div>


          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >

            <div className="riccati-search">

              <span className="riccati-search-icon">
                ⌕
              </span>

              <input
                type="text"
                placeholder="Buscar cliente..."
                value={busqueda}
                onChange={(e) =>
                  setBusqueda(
                    e.target.value
                  )
                }
              />

            </div>


            <button
              className="riccati-button-primary"
              onClick={
                abrirNuevoCliente
              }
            >
              + Nuevo cliente
            </button>

          </div>

        </div>


        {clientes.length === 0 ? (

          <div className="riccati-empty">

            <div className="riccati-empty-icon">
              ◎
            </div>

            <strong>
              No hay clientes registrados
            </strong>

            <span>
              Registra el primer cliente
              para comenzar.
            </span>

            <button
              className="riccati-button-primary"
              onClick={
                abrirNuevoCliente
              }
              style={{
                marginTop: "14px",
              }}
            >
              + Registrar cliente
            </button>

          </div>

        ) : (

          <>
            <div className="riccati-table-wrapper">

              <table className="riccati-table">

                <thead>

                  <tr>
                    <th>CLIENTE</th>
                    <th>IDENTIFICACIÓN</th>
                    <th>CONTACTO</th>
                    <th>CONTACTOS</th>
                    <th>ESTADO</th>
                    <th>ACCIONES</th>
                  </tr>

                </thead>

                <tbody>

                  {clientesFiltrados.map(
                    (cliente) => (

                      <tr
                        key={
                          cliente.id_cliente
                        }
                      >

                        <td>

                          <div
                            style={{
                              display: "flex",
                              alignItems:
                                "center",
                              gap: "11px",
                            }}
                          >

                            <div
                              className="riccati-user-avatar"
                              style={{
                                width: "32px",
                                height: "32px",
                              }}
                            >
                              {cliente
                                .nombre_razon_social
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <div>

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
                                  cliente.nombre_razon_social
                                }
                              </strong>

                              <span
                                style={{
                                  display:
                                    "block",
                                  marginTop:
                                    "3px",
                                  color:
                                    "#50677e",
                                  fontSize:
                                    "7px",
                                }}
                              >
                                CLI-
                                {String(
                                  cliente.id_cliente
                                ).padStart(
                                  3,
                                  "0"
                                )}
                              </span>

                            </div>

                          </div>

                        </td>


                        <td>
                          {cliente.identificacion ||
                            "No registrada"}
                        </td>


                        <td>

                          <span
                            style={{
                              display:
                                "block",
                            }}
                          >
                            {cliente.correo_general ||
                              "Sin correo"}
                          </span>

                          <span
                            style={{
                              display:
                                "block",
                              marginTop:
                                "3px",
                              color:
                                "#50677e",
                              fontSize:
                                "7px",
                            }}
                          >
                            {cliente.telefono_general ||
                              "Sin teléfono"}
                          </span>

                        </td>


                        <td>

                          <span className="riccati-badge riccati-badge-cyan">
                            {cliente.cantidad_contactos ||
                              0}{" "}
                            contacto(s)
                          </span>

                        </td>


                        <td>

                          <EstadoCliente
                            estado={
                              cliente.estado
                            }
                          />

                        </td>


                        <td>

                          <button
                            className="riccati-button-secondary"
                            onClick={() =>
                              abrirFicha(
                                cliente.id_cliente
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


            <div
              style={{
                padding: "12px 16px",
                color: "#50677e",
                fontSize: "7px",
              }}
            >
              Mostrando{" "}
              {clientesFiltrados.length} de{" "}
              {clientes.length} clientes
            </div>

          </>

        )}

      </section>


      {/* NUEVO CLIENTE */}

      <ClienteModal
        mostrar={mostrarModalCliente}
        formulario={formulario}
        contacto={contacto}
        error={
          mostrarModalCliente
            ? error
            : ""
        }
        guardando={guardando}
        onChangeCliente={
          manejarCambioCliente
        }
        onChangeContacto={
          manejarCambioContacto
        }
        onSubmit={
          guardarCliente
        }
        onClose={
          cerrarModalCliente
        }
      />


      {/* FICHA */}

      <ClienteFichaModal
        mostrar={mostrarFicha}
        cliente={
          clienteSeleccionado
        }
        contactos={
          contactosSeleccionados
        }
        cargando={
          cargandoFicha
        }
        error={
          errorFicha
        }
        onAgregarContacto={
          abrirNuevoContacto
        }
        onClose={
          cerrarFicha
        }
      />


      {/* NUEVO CONTACTO */}

      <ContactoModal
        mostrar={
          mostrarModalContacto
        }
        formulario={
          nuevoContacto
        }
        error={
          errorContacto
        }
        guardando={
          guardandoContacto
        }
        onChange={
          manejarCambioNuevoContacto
        }
        onSubmit={
          guardarNuevoContacto
        }
        onClose={
          cerrarModalContacto
        }
      />

    </RiccatiLayout>
  );
}


function EstadoCliente({
  estado,
}) {
  if (estado === "ACTIVO") {
    return (
      <span className="riccati-badge riccati-badge-green">

        <span className="riccati-badge-dot">
        </span>

        Activo

      </span>
    );
  }

  return (
    <span className="riccati-badge riccati-badge-orange">
      Inactivo
    </span>
  );
}


export default Clientes;