import FormField from "../components/FormField";
import { useEffect, useMemo, useState } from "react";
import { Building2, CheckCircle2, ChevronLeft, ChevronRight, CircleAlert, Pencil, Plus, Search, SlidersHorizontal, UserRoundCheck, Users, X } from "lucide-react";
import { createPortal } from "react-dom";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import StatCard from "../components/StatCard";
import ClienteModal from "../components/ClienteModal";
import ClienteFichaModal from "../components/ClienteFichaModal";
import ContactoModal from "../components/ContactoModal";
import { obtenerClientes, obtenerCliente, crearCliente, actualizarCliente,
  crearContactoCliente, actualizarContactoCliente, cambiarEstadoCliente } from "../services/clientesService";
import "../styles/clientes-sprint2.css";

const clienteVacio = { nombre_razon_social: "", identificacion: "", correo_general: "", telefono_general: "", direccion: "", observaciones: "", estado: "ACTIVO" };
const contactoVacio = { nombre: "", puesto: "", correo: "", telefono: "", es_principal: false, estado: "ACTIVO" };
const TAMANIO_PAGINA = 8;

function Clientes() {
  const usuario = (() => { try { return JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { return null; } })();
  const esAdministrador = usuario?.rol === "Administrador";
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("TODOS");
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [modalCliente, setModalCliente] = useState(false);
  const [clienteEditando, setClienteEditando] = useState(null);
  const [formulario, setFormulario] = useState({ ...clienteVacio });
  const [principal, setPrincipal] = useState({ ...contactoVacio });
  const [guardando, setGuardando] = useState(false);
  const [errorModal, setErrorModal] = useState("");
  const [modalFicha, setModalFicha] = useState(false);
  const [cargandoFicha, setCargandoFicha] = useState(false);
  const [ficha, setFicha] = useState(null);
  const [errorFicha, setErrorFicha] = useState("");
  const [modalContacto, setModalContacto] = useState(false);
  const [contactoEditando, setContactoEditando] = useState(null);
  const [formContacto, setFormContacto] = useState({ ...contactoVacio });
  const [guardandoContacto, setGuardandoContacto] = useState(false);
  const [errorContacto, setErrorContacto] = useState("");
  const [clienteParaContacto, setClienteParaContacto] = useState(null);
  const [confirmacion, setConfirmacion] = useState(null);
  const [justificacion, setJustificacion] = useState("");
  const [guardandoEstado, setGuardandoEstado] = useState(false);
  const [errorEstado, setErrorEstado] = useState("");

  async function cargarClientes() {
    try {
      const datos = await obtenerClientes();
      setClientes(Array.isArray(datos) ? datos : []);
      setError("");
    } catch (e) { setError(e.message); }
    finally { setCargando(false); }
  }
  useEffect(() => { cargarClientes(); }, []);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    return clientes.filter(c => (filtroEstado === "TODOS" || c.estado === filtroEstado) &&
      [c.nombre_razon_social, c.identificacion, c.correo_general, c.telefono_general, c.estado].some(valor => String(valor || "").toLocaleLowerCase("es").includes(q)));
  }, [clientes, busqueda, filtroEstado]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / TAMANIO_PAGINA));
  const paginaActual = Math.min(pagina, totalPaginas);
  const visibles = filtrados.slice((paginaActual - 1) * TAMANIO_PAGINA, paginaActual * TAMANIO_PAGINA);
  const activos = clientes.filter(c => c.estado === "ACTIVO").length;
  const contactos = clientes.reduce((total, c) => total + Number(c.cantidad_contactos || 0), 0);

  function abrirNuevo() {
    setClienteEditando(null); setFormulario({ ...clienteVacio }); setPrincipal({ ...contactoVacio }); setErrorModal(""); setModalCliente(true);
  }
  function abrirEditar(cliente) {
    if (!esAdministrador) return;
    setModalFicha(false); setClienteEditando(cliente);
    setFormulario(Object.fromEntries(Object.keys(clienteVacio).map(k => [k, cliente[k] ?? clienteVacio[k]])));
    setPrincipal({ ...contactoVacio }); setErrorModal(""); setModalCliente(true);
  }
  function cambiarCampo(setter, evento) {
    const { name, value, checked, type } = evento.target;
    setter(anterior => ({ ...anterior, [name]: type === "checkbox" ? checked : value }));
  }
  async function guardarCliente(evento) {
    evento.preventDefault();
    if (!esAdministrador || guardando) return;
    setGuardando(true); setErrorModal("");
    try {
      if (!clienteEditando && !principal.nombre.trim() && [principal.puesto,principal.correo,principal.telefono].some(v => v.trim())) {
        throw new Error("Para registrar un contacto principal, indica también su nombre.");
      }
      const datos = clienteEditando
        ? await actualizarCliente(clienteEditando.id_cliente, formulario)
        : await crearCliente({ ...formulario, contactoPrincipal: principal.nombre.trim() ? principal : null });
      setModalCliente(false); setMensaje(datos.mensaje || "Cambios guardados correctamente.");
      await cargarClientes();
    } catch (e) { setErrorModal(e.message); }
    finally { setGuardando(false); }
  }
  async function abrirFicha(id) {
    setModalFicha(true); setCargandoFicha(true); setErrorFicha(""); setFicha(null);
    try { setFicha(await obtenerCliente(id)); }
    catch (e) { setErrorFicha(e.message); }
    finally { setCargandoFicha(false); }
  }
  function abrirContacto(clienteId, contacto = null) {
    if (!esAdministrador) return;
    setClienteParaContacto(clienteId); setContactoEditando(contacto);
    setFormContacto(contacto ? Object.fromEntries(Object.keys(contactoVacio).map(k => [k, contacto[k] ?? contactoVacio[k]])) : { ...contactoVacio });
    setErrorContacto(""); setModalFicha(false); setModalContacto(true);
  }
  async function guardarContacto(evento) {
    evento.preventDefault(); if (!esAdministrador || guardandoContacto) return;
    setGuardandoContacto(true); setErrorContacto("");
    try {
      const d = contactoEditando
        ? await actualizarContactoCliente(clienteParaContacto, contactoEditando.id_contacto, formContacto)
        : await crearContactoCliente(clienteParaContacto, formContacto);
      setModalContacto(false); setMensaje(d.mensaje || "Contacto guardado correctamente.");
      await cargarClientes(); await abrirFicha(clienteParaContacto);
    } catch (e) { setErrorContacto(e.message); }
    finally { setGuardandoContacto(false); }
  }
  function abrirConfirmacion(cliente) {
    if (!esAdministrador) return;
    setModalFicha(false); setConfirmacion(cliente); setJustificacion(""); setErrorEstado("");
  }
  async function guardarEstado(evento) {
    evento.preventDefault(); if (!confirmacion || guardandoEstado || !esAdministrador) return;
    setGuardandoEstado(true); setErrorEstado("");
    const estadoNuevo = confirmacion.estado === "ACTIVO" ? "INACTIVO" : "ACTIVO";
    try {
      const respuesta = await cambiarEstadoCliente(confirmacion.id_cliente, estadoNuevo, justificacion);
      setConfirmacion(null); setMensaje(respuesta.mensaje); await cargarClientes();
    } catch (e) { setErrorEstado(e.message); }
    finally { setGuardandoEstado(false); }
  }

  return (
    <RiccatiLayout paginaActiva="clientes">
      <div className="riccati-clientes-s2">
        <PageHeader modulo="GESTIÓN DE CLIENTES" titulo="Clientes" descripcion="Directorio, contactos e historial de proyectos de Riccati S.A." estado="Sistema conectado" />
        {mensaje && <div className="riccati-s2-success" role="status"><CheckCircle2 size={18}/>{mensaje}<button type="button" aria-label="Cerrar aviso" onClick={() => setMensaje("")}><X size={16}/></button></div>}
        {error && <div className="login-error" role="alert">{error}</div>}
        <section className="riccati-stats-grid">
          <StatCard etiqueta="TOTAL CLIENTES" valor={clientes.length} icono={<Building2 size={21}/>} pie="Clientes en la base de datos"/>
          <StatCard etiqueta="ACTIVOS" valor={activos} icono={<UserRoundCheck size={21}/>} pie="Disponibles para proyectos" clasePie="text-riccati-green"/>
          <StatCard etiqueta="INACTIVOS" valor={clientes.length - activos} icono={<CircleAlert size={21}/>} pie="Conservan su historial"/>
          <StatCard etiqueta="CONTACTOS" valor={contactos} icono={<Users size={21}/>} pie="Contactos asociados"/>
        </section>
        <section className="riccati-panel animate-up">
          <div className="riccati-panel-header riccati-s2-clientes-head">
            <div><span className="riccati-panel-label">DIRECTORIO</span><h3>Clientes registrados</h3></div>
            <div className="riccati-s2-clientes-filtros">
              <label className="riccati-search" aria-label="Buscar cliente"><Search size={18} aria-hidden="true"/><input value={busqueda} onChange={e => {setBusqueda(e.target.value); setPagina(1);}} placeholder="Nombre, identificación, correo..." /></label>
              <label className="riccati-s2-select-wrap"><SlidersHorizontal size={17}/><select value={filtroEstado} onChange={e => { setFiltroEstado(e.target.value); setPagina(1); }} aria-label="Filtrar por estado"><option value="TODOS">Todos los estados</option><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option></select></label>
              {esAdministrador && <button type="button" className="riccati-button-primary" onClick={abrirNuevo}><Plus size={17}/> Nuevo cliente</button>}
            </div>
          </div>
          {cargando ? <div className="riccati-empty"><span className="riccati-loader"/> Cargando clientes...</div> : filtrados.length === 0 ?
            <div className="riccati-empty"><Building2 size={34}/><strong>Sin resultados</strong><span>Cambia los filtros o registra un cliente nuevo.</span></div> :
            <div className="riccati-table-wrapper"><table className="riccati-table"><thead><tr><th>CLIENTE</th><th>IDENTIFICACIÓN</th><th>CONTACTO GENERAL</th><th>CONTACTOS</th><th>ESTADO</th><th>ACCIONES</th></tr></thead><tbody>
              {visibles.map(c => <tr key={c.id_cliente}>
                <td><div className="riccati-s2-cliente-identidad"><span className="riccati-user-avatar">{c.nombre_razon_social?.charAt(0).toUpperCase()}</span><div><strong>{c.nombre_razon_social}</strong><small>CLI-{String(c.id_cliente).padStart(3,"0")}</small></div></div></td>
                <td>{c.identificacion || "No registrada"}</td>
                <td><div className="riccati-s2-doble"><span>{c.correo_general || "Sin correo"}</span><small>{c.telefono_general || "Sin teléfono"}</small></div></td>
                <td><span>{c.cantidad_contactos || 0} contacto(s)</span></td>
                <td><span className={"riccati-badge " + (c.estado === "ACTIVO" ? "riccati-badge-green" : "riccati-badge-orange")}>{c.estado === "ACTIVO" ? "Activo" : "Inactivo"}</span></td>
                <td><div className="riccati-s2-actions"><button type="button" className="riccati-button-secondary" onClick={() => abrirFicha(c.id_cliente)}>Ver ficha</button>{esAdministrador && <button type="button" className="riccati-s2-icon-action" aria-label={`Editar ${c.nombre_razon_social}`} title="Editar" onClick={() => abrirEditar(c)}><Pencil size={17}/></button>}</div></td>
              </tr>)}</tbody></table></div>}
          <div className="riccati-s2-paginacion"><span>{filtrados.length === 0 ? "0 resultados" : `Mostrando ${(paginaActual - 1) * TAMANIO_PAGINA + 1}–${Math.min(paginaActual * TAMANIO_PAGINA, filtrados.length)} de ${filtrados.length} clientes`}</span><div><button type="button" className="riccati-button-secondary" disabled={paginaActual === 1} aria-label="Página anterior" onClick={() => setPagina(paginaActual - 1)}><ChevronLeft size={17}/></button><span>Página {paginaActual} de {totalPaginas}</span><button type="button" className="riccati-button-secondary" disabled={paginaActual >= totalPaginas} aria-label="Página siguiente" onClick={() => setPagina(paginaActual + 1)}><ChevronRight size={17}/></button></div></div>
        </section>
      </div>
      <ClienteModal mostrar={modalCliente} formulario={formulario} contacto={principal} esEdicion={Boolean(clienteEditando)} error={errorModal} guardando={guardando} onChangeCliente={e => cambiarCampo(setFormulario,e)} onChangeContacto={e => cambiarCampo(setPrincipal,e)} onSubmit={guardarCliente} onClose={() => !guardando && setModalCliente(false)}/>
      <ClienteFichaModal mostrar={modalFicha} cliente={ficha?.cliente} contactos={ficha?.contactos || []} proyectos={ficha?.proyectos || []} cargando={cargandoFicha} error={errorFicha} esAdministrador={esAdministrador} onEditar={() => abrirEditar(ficha.cliente)} onAgregarContacto={() => abrirContacto(ficha.cliente.id_cliente)} onEditarContacto={c => abrirContacto(ficha.cliente.id_cliente,c)} onCambiarEstado={() => abrirConfirmacion(ficha.cliente)} onClose={() => setModalFicha(false)}/>
      <ContactoModal mostrar={modalContacto} formulario={formContacto} editando={Boolean(contactoEditando)} error={errorContacto} guardando={guardandoContacto} onChange={e => cambiarCampo(setFormContacto,e)} onSubmit={guardarContacto} onClose={() => !guardandoContacto && setModalContacto(false)}/>
      {confirmacion && createPortal(<div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardandoEstado && setConfirmacion(null)}>
        <div className="riccati-modal riccati-s2-modal riccati-s2-modal-pequeno" role="dialog" aria-modal="true" aria-label="Confirmar cambio de estado">
          <div className="riccati-modal-header riccati-s2-modal-heading"><div><span className="riccati-panel-label">CONFIRMAR CAMBIO</span><h3>{confirmacion.estado === "ACTIVO" ? "Inactivar cliente" : "Reactivar cliente"}</h3><p>{confirmacion.nombre_razon_social}</p></div><button type="button" className="riccati-button-secondary" aria-label="Cerrar" onClick={() => setConfirmacion(null)}><X size={18}/></button></div>
          <form className="riccati-s2-modal-form" onSubmit={guardarEstado}><div className="riccati-modal-body">
            {errorEstado && <div className="login-error" role="alert">{errorEstado}</div>}
            <div className="riccati-s2-advertencia"><CircleAlert size={22}/><div><strong>Esta acción no elimina ningún dato.</strong><p>Los clientes inactivos no podrán asociarse a proyectos nuevos. Si hay proyectos activos, debes ingresar una justificación obligatoria.</p></div></div>
            <FormField className="riccati-form-group"><label htmlFor="justificacion-estado">Justificación {confirmacion.estado === "ACTIVO" ? "(obligatoria si tiene proyectos activos)" : "(opcional)"}</label><textarea id="justificacion-estado" rows={3} className="riccati-input" value={justificacion} onChange={e=>setJustificacion(e.target.value)} placeholder="Motivo del cambio..."/></FormField>
          </div><div className="riccati-modal-footer"><button type="button" className="riccati-button-secondary" disabled={guardandoEstado} onClick={() => setConfirmacion(null)}>Cancelar</button><button type="submit" className={confirmacion.estado === "ACTIVO" ? "riccati-button-danger" : "riccati-button-primary"} disabled={guardandoEstado}>{guardandoEstado ? "Guardando..." : confirmacion.estado === "ACTIVO" ? "Confirmar inactivación" : "Confirmar reactivación"}</button></div></form>
        </div>
      </div>,document.body)}
    </RiccatiLayout>
  );
}
export default Clientes;
