// Sprint 3 · M05 Gestión documental:
// HU-M05-01 (adjuntar), HU-M05-02 (clasificar), HU-M05-03 (consultar y abrir),
// HU-M05-04 (nueva versión), HU-M05-05 (buscar y filtrar), HU-M05-06 (inactivar).
import FormField from "../components/FormField";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Ban, CalendarRange, Check, Download, ExternalLink, Eye, FileText, FileUp, FilterX, FolderKanban, FolderOpen,
  History, Link2, ListFilter, Pencil, RefreshCcw, Search, SearchX, ShieldAlert, Upload, X,
} from "lucide-react";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import { proyectosDeBitacora } from "../services/bitacoraService";
import {
  ACEPTAR_ARCHIVOS, EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO, adjuntarArchivo, cambiarTipoDocumento, cargarVersion,
  documentosDeProyecto, inactivarDocumento, obtenerArchivo, registrarVinculo, tiposDocumento, versionesDocumento,
} from "../services/documentosService";
import "../styles/bitacora.css";
import "../styles/clientes-sprint2.css";
import "../styles/documentos.css";

const VISTA_PREVIA = ["application/pdf", "image/png", "image/jpeg"];
const FILTROS_INICIALES = { q: "", tipo: "", desde: "", hasta: "", estado: "ACTIVO" };
const fechaTexto = (valor) => valor ? new Date(valor).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" }) : "Sin fecha";
const esAdministrador = (usuario) => usuario?.rol === "Administrador";
function tamanoTexto(bytes) {
  const n = Number(bytes || 0);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toLocaleString("es-CR", { maximumFractionDigits: 1 })} KB`;
  return `${(n / 1024 / 1024).toLocaleString("es-CR", { maximumFractionDigits: 1 })} MB`;
}
const dominio = (url) => { try { return new URL(url).hostname; } catch { return ""; } };
const urlSegura = (url) => /^https?:\/\//i.test(url || "");
const sinExtension = (nombre) => nombre.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ").trim().slice(0, 180);

function validarArchivo(archivo) {
  if (!archivo) return "Selecciona el archivo que deseas adjuntar.";
  const ext = (/\.([^.]+)$/.exec(archivo.name)?.[1] || "").toLowerCase();
  if (!EXTENSIONES_PERMITIDAS.includes(ext)) return "Formato no permitido. Usa PDF, Word, Excel, PowerPoint, JPG, PNG o DWG.";
  if (archivo.size === 0) return "El archivo seleccionado está vacío.";
  if (archivo.size > TAMANO_MAXIMO) return `El archivo pesa ${tamanoTexto(archivo.size)}; el máximo permitido es 10 MB.`;
  return "";
}

// Selector de archivo compartido por "Adjuntar archivo" y "Nueva versión".
function SelectorArchivo({ id, archivo, error, ayuda, onElegir }) {
  return <div className="riccati-form-group">
    <label htmlFor={id}>Archivo *</label>
    <label htmlFor={id} className={`documentos-dropzone${error ? " con-error" : ""}`}>
      <Upload size={22}/>
      {archivo ? <span><strong>{archivo.name}</strong><small>{tamanoTexto(archivo.size)} · Haz clic para cambiarlo</small></span>
        : <span><strong>Selecciona un archivo</strong><small>PDF, Word, Excel, PowerPoint, JPG, PNG o DWG · Máximo 10 MB</small></span>}
    </label>
    <input id={id} className="documentos-input-archivo" type="file" accept={ACEPTAR_ARCHIVOS} onChange={e => {
      const elegido = e.target.files?.[0] || null;
      onElegir(elegido, elegido ? validarArchivo(elegido) : "");
    }}/>
    {error ? <span className="rp-field-error" role="alert">{error}</span> : <small className="bitacora-ayuda">{ayuda}</small>}
  </div>;
}

// Estructura de modal común (misma plantilla que la bitácora).
function Modal({ etiqueta, titulo, subtitulo, pequeno, guardando, onCerrar, children }) {
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className={`riccati-modal bitacora-modal${pequeno ? " documentos-modal-pequeno" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="riccati-modal-header bitacora-modal-header">
          <div><span className="riccati-page-label">{etiqueta}</span><h3>{titulo}</h3>{subtitulo && <p>{subtitulo}</p>}</div>
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

function ModalAdjuntar({ modo, tipos, proyecto, guardando, error, onCerrar, onGuardar }) {
  const esVinculo = modo === "vinculo";
  const [form, setForm] = useState({ nombre: "", idTipo: "", descripcion: "", url: "" });
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState("");
  const cambio = (e) => setForm(antes => ({ ...antes, [e.target.name]: e.target.value }));
  const elegir = (elegido, problema) => {
    setErrorArchivo(problema);
    setArchivo(problema ? null : elegido);
    if (elegido && !problema && !form.nombre.trim()) setForm(antes => ({ ...antes, nombre: sinExtension(elegido.name) }));
  };
  const enviar = (e) => {
    e.preventDefault();
    if (!esVinculo) {
      const problema = validarArchivo(archivo);
      if (problema) { setErrorArchivo(problema); return; }
    }
    onGuardar({ ...form, archivo });
  };

  return <Modal etiqueta="M05 · GESTIÓN DOCUMENTAL" titulo={esVinculo ? "Registrar vínculo externo" : "Adjuntar archivo"}
    subtitulo={proyecto ? `${proyecto.codigo} · ${proyecto.nombre}` : ""} guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={enviar}>
      <div className="riccati-modal-body">
        {error && <div className="login-error" role="alert">{error}</div>}
        {esVinculo ? <FormField className="riccati-form-group">
          <label htmlFor="doc-url">Dirección del vínculo *</label>
          <input id="doc-url" className="riccati-input" name="url" type="url" value={form.url} onChange={cambio} required maxLength={2000} placeholder="https://drive.google.com/..." pattern="https?://.+"/>
          <small className="bitacora-ayuda">Solo vínculos que empiecen con http:// o https://.</small>
        </FormField> : <SelectorArchivo id="doc-archivo" archivo={archivo} error={errorArchivo} onElegir={elegir}
          ayuda="El archivo se guarda de forma privada y solo lo pueden abrir usuarios con acceso al proyecto."/>}
        <FormField className="riccati-form-group">
          <label htmlFor="doc-nombre">Nombre del documento *</label>
          <input id="doc-nombre" className="riccati-input" name="nombre" value={form.nombre} onChange={cambio} required minLength={3} maxLength={180} placeholder="Ej.: Planta arquitectónica nivel 1"/>
        </FormField>
        <FormField className="riccati-form-group">
          <label htmlFor="doc-tipo">Tipo de documento *</label>
          <select id="doc-tipo" className="riccati-select" name="idTipo" value={form.idTipo} onChange={cambio} required>
            <option value="">Selecciona una clasificación</option>
            {tipos.map(t => <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>)}
          </select>
          <small className="bitacora-ayuda">{tipos.find(t => String(t.id_tipo_documento) === String(form.idTipo))?.descripcion || "La clasificación facilita encontrar el documento en el expediente."}</small>
        </FormField>
        <FormField className="riccati-form-group">
          <label htmlFor="doc-descripcion">Descripción (opcional)</label>
          <textarea id="doc-descripcion" className="riccati-input" name="descripcion" value={form.descripcion} onChange={cambio} maxLength={2000} rows={3} placeholder="Ej.: Versión enviada al cliente para revisión"/>
        </FormField>
      </div>
      <div className="riccati-modal-footer">
        <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
        <button className="riccati-button-primary" type="submit" disabled={guardando}><Check size={17}/> {guardando ? (esVinculo ? "Guardando..." : "Subiendo archivo...") : esVinculo ? "Registrar vínculo" : "Adjuntar archivo"}</button>
      </div>
    </form>
  </Modal>;
}

function ModalClasificar({ documento, tipos, guardando, error, onCerrar, onGuardar }) {
  const [idTipo, setIdTipo] = useState(String(documento.id_tipo_documento));
  const sinCambio = String(documento.id_tipo_documento) === String(idTipo);
  return <Modal etiqueta="M05 · CLASIFICACIÓN" titulo="Cambiar clasificación" subtitulo={documento.nombre} pequeno guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); if (!sinCambio) onGuardar(idTipo); }}>
      <div className="riccati-modal-body">
        {error && <div className="login-error" role="alert">{error}</div>}
        <FormField className="riccati-form-group">
          <label htmlFor="doc-tipo-nuevo">Tipo de documento *</label>
          <select id="doc-tipo-nuevo" className="riccati-select" value={idTipo} onChange={e => setIdTipo(e.target.value)} required>
            {tipos.map(t => <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>)}
          </select>
        </FormField>
        <div className="bitacora-alert"><ShieldAlert size={19}/><span>Quedará registrado quién hizo el cambio y cuándo.</span></div>
      </div>
      <div className="riccati-modal-footer">
        <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
        <button className="riccati-button-primary" type="submit" disabled={guardando || sinCambio}><Check size={17}/> {guardando ? "Guardando..." : "Guardar clasificación"}</button>
      </div>
    </form>
  </Modal>;
}

// HU-M05-04: carga de una nueva versión. La anterior se conserva en el historial.
function ModalVersion({ documento, guardando, error, onCerrar, onGuardar }) {
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState("");
  const [comentario, setComentario] = useState("");
  const enviar = (e) => {
    e.preventDefault();
    const problema = validarArchivo(archivo);
    if (problema) { setErrorArchivo(problema); return; }
    onGuardar({ archivo, comentario });
  };
  return <Modal etiqueta="M05 · CONTROL DE VERSIONES" titulo="Cargar nueva versión" subtitulo={`${documento.nombre} · versión vigente ${documento.version_actual}`} guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={enviar}>
      <div className="riccati-modal-body">
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="bitacora-alert"><History size={19}/><span>El archivo nuevo será la versión {Number(documento.version_actual) + 1}. La versión {documento.version_actual} se conserva y podrás descargarla desde el historial.</span></div>
        <SelectorArchivo id="doc-version-archivo" archivo={archivo} error={errorArchivo}
          onElegir={(elegido, problema) => { setErrorArchivo(problema); setArchivo(problema ? null : elegido); }}
          ayuda={`Archivo vigente: ${documento.nombre_original}. Puedes subir otro formato permitido si es necesario.`}/>
        <FormField className="riccati-form-group">
          <label htmlFor="doc-version-comentario">Cambios de esta versión (opcional)</label>
          <textarea id="doc-version-comentario" className="riccati-input" value={comentario} onChange={e => setComentario(e.target.value)} maxLength={1000} rows={3} placeholder="Ej.: Se ajustaron las cotas de la fachada norte"/>
        </FormField>
      </div>
      <div className="riccati-modal-footer">
        <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
        <button className="riccati-button-primary" type="submit" disabled={guardando}><Check size={17}/> {guardando ? "Subiendo versión..." : "Cargar versión"}</button>
      </div>
    </form>
  </Modal>;
}

// HU-M05-04: historial de versiones con descarga de cada una.
function ModalHistorial({ documento, onCerrar, onAbrir, abriendo }) {
  const [estado, setEstado] = useState({ cargando: true, error: "", versiones: [] });
  useEffect(() => {
    let activo = true;
    versionesDocumento(documento.id_documento)
      .then(datos => { if (activo) setEstado({ cargando: false, error: "", versiones: datos.versiones || [] }); })
      .catch(e => { if (activo) setEstado({ cargando: false, error: e.message, versiones: [] }); });
    return () => { activo = false; };
  }, [documento.id_documento]);
  return <Modal etiqueta="M05 · CONTROL DE VERSIONES" titulo="Historial de versiones" subtitulo={documento.nombre} onCerrar={onCerrar}>
    <div className="riccati-modal-body">
      {estado.error && <div className="login-error" role="alert">{estado.error}</div>}
      {estado.cargando ? <div className="bitacora-vacio"><div className="riccati-loader"/><p>Cargando versiones...</p></div>
        : <ol className="documentos-versiones">
          {estado.versiones.map(v => <li key={v.numero} className={v.vigente ? "vigente" : ""}>
            <div className="documentos-version-numero">v{v.numero}</div>
            <div className="documentos-version-info">
              <strong>{v.nombre_original}{v.vigente && <span className="riccati-badge riccati-badge-green">Vigente</span>}</strong>
              <small>{fechaTexto(v.creado_en)} · {tamanoTexto(v.tamano_bytes)}</small>
              {v.comentario && <p>{v.comentario}</p>}
              <div className="rp-historial-responsable">Cargado por <strong>{v.usuario_carga}</strong></div>
            </div>
            <div className="riccati-s2-actions">
              {VISTA_PREVIA.includes(v.tipo_mime) && <button type="button" className="riccati-button-secondary rp-accion" onClick={() => onAbrir(documento, "ver", v.numero, v.nombre_original)} disabled={Boolean(abriendo)} aria-label={`Abrir versión ${v.numero}`}><Eye size={16}/> Abrir</button>}
              <button type="button" className="riccati-button-secondary rp-accion" onClick={() => onAbrir(documento, "descarga", v.numero, v.nombre_original)} disabled={Boolean(abriendo)} aria-label={`Descargar versión ${v.numero}`}><Download size={16}/> Descargar</button>
            </div>
          </li>)}
        </ol>}
    </div>
    <div className="riccati-modal-footer"><button type="button" className="riccati-button-secondary" onClick={onCerrar}>Cerrar</button></div>
  </Modal>;
}

// HU-M05-06: inactivación con motivo obligatorio (solo administrador).
function ModalInactivar({ documento, guardando, error, onCerrar, onGuardar }) {
  const [motivo, setMotivo] = useState("");
  return <Modal etiqueta="M05 · RETIRAR DOCUMENTO" titulo="Inactivar documento" subtitulo={documento.nombre} pequeno guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); onGuardar(motivo); }}>
      <div className="riccati-modal-body">
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="bitacora-alert"><ShieldAlert size={19}/><span>El documento dejará de aparecer en la consulta normal. El archivo y sus versiones no se borran: quedan como evidencia y solo el administrador podrá consultarlos.</span></div>
        <FormField className="riccati-form-group">
          <label htmlFor="doc-motivo">Motivo de la inactivación *</label>
          <textarea id="doc-motivo" className="riccati-input" value={motivo} onChange={e => setMotivo(e.target.value)} required minLength={10} maxLength={1000} rows={3} placeholder="Ej.: Se cargó por error en este proyecto; corresponde al PRJ-0004"/>
          <small className="bitacora-ayuda">Mínimo 10 caracteres. Quedará registrado junto con tu nombre y la fecha.</small>
        </FormField>
      </div>
      <div className="riccati-modal-footer">
        <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
        <button className="riccati-button-primary documentos-boton-peligro" type="submit" disabled={guardando}>{guardando ? "Inactivando..." : "Inactivar documento"}<Ban size={17}/></button>
      </div>
    </form>
  </Modal>;
}

export default function Documentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoQuery = searchParams.get("proyecto");
  const usuario = useMemo(() => { try { return JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { return null; } }, []);
  const admin = esAdministrador(usuario);
  const [proyectos, setProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState("");
  const [tipos, setTipos] = useState([]);
  const [errorTipos, setErrorTipos] = useState("");
  const [documentos, setDocumentos] = useState([]);
  const [totalActivos, setTotalActivos] = useState(0);
  const [proyectoActual, setProyectoActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recargar, setRecargar] = useState(0);
  // HU-M05-05: el texto se aplica con una breve espera para no consultar en cada tecla.
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [textoBusqueda, setTextoBusqueda] = useState("");
  const [modal, setModal] = useState(null);
  const [documentoActivo, setDocumentoActivo] = useState(null);
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [abriendo, setAbriendo] = useState(null);

  // Los proyectos y los tipos se cargan por separado: si falta la migración 08,
  // igual se muestran los proyectos con un mensaje claro.
  useEffect(() => {
    let activo = true;
    proyectosDeBitacora().then(lista => { if (activo) setProyectos(Array.isArray(lista) ? lista : []); })
      .catch(e => { if (activo) setErrorProyectos(e.message); })
      .finally(() => { if (activo) setCargandoProyectos(false); });
    tiposDocumento().then(lista => { if (activo) setTipos(Array.isArray(lista) ? lista : []); })
      .catch(e => { if (activo) setErrorTipos(e.message); });
    return () => { activo = false; };
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => setFiltros(antes => antes.q === textoBusqueda.trim() ? antes : { ...antes, q: textoBusqueda.trim() }), 350);
    return () => clearTimeout(espera);
  }, [textoBusqueda]);

  const idSeleccionado = proyectos.find(p => String(p.id_proyecto) === String(proyectoQuery))?.id_proyecto ?? proyectos[0]?.id_proyecto ?? null;

  useEffect(() => {
    if (!idSeleccionado) return;
    let activo = true;
    setCargando(true);
    setError("");
    documentosDeProyecto(idSeleccionado, filtros).then(datos => {
      if (!activo) return;
      setDocumentos(datos.documentos || []);
      setTotalActivos(datos.total_activos ?? 0);
      setProyectoActual(datos.proyecto || null);
    }).catch(e => { if (activo) { setError(e.message); setDocumentos([]); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idSeleccionado, filtros, recargar]);

  const hayFiltros = Boolean(filtros.q || filtros.tipo || filtros.desde || filtros.hasta || filtros.estado !== "ACTIVO" || textoBusqueda.trim());
  const cambiarFiltro = (e) => { const { name, value } = e.target; setFiltros(antes => ({ ...antes, [name]: value })); };
  const limpiarFiltros = () => { setTextoBusqueda(""); setFiltros(FILTROS_INICIALES); };
  const cambiarProyecto = useCallback((e) => { setSearchParams({ proyecto: e.target.value }); setMensaje(""); setTextoBusqueda(""); setFiltros(FILTROS_INICIALES); }, [setSearchParams]);
  const abrirModal = (modo, documento = null) => { setErrorModal(""); setDocumentoActivo(documento); setModal(modo); };
  const cerrarModal = () => { if (!guardando) { setModal(null); setDocumentoActivo(null); setErrorModal(""); } };

  // Ejecuta una operación del modal, muestra la confirmación y recarga el expediente.
  async function ejecutar(operacion, mensajePorDefecto) {
    setErrorModal("");
    setGuardando(true);
    try {
      const resultado = await operacion();
      setMensaje(resultado.mensaje || mensajePorDefecto);
      setModal(null); setDocumentoActivo(null);
      setRecargar(n => n + 1);
    } catch (e) { setErrorModal(e.message); }
    finally { setGuardando(false); }
  }

  const guardarDocumento = (form) => ejecutar(() => modal === "vinculo"
    ? registrarVinculo(idSeleccionado, { nombre: form.nombre, id_tipo_documento: Number(form.idTipo), descripcion: form.descripcion, url: form.url })
    : adjuntarArchivo(idSeleccionado, { archivo: form.archivo, nombre: form.nombre, idTipo: form.idTipo, descripcion: form.descripcion }),
  "Documento registrado correctamente.");
  const guardarClasificacion = (idTipo) => ejecutar(() => cambiarTipoDocumento(documentoActivo.id_documento, idTipo), "Clasificación actualizada.");
  const guardarVersion = (datos) => ejecutar(() => cargarVersion(documentoActivo.id_documento, datos), "Nueva versión cargada.");
  const guardarInactivacion = (motivo) => ejecutar(() => inactivarDocumento(documentoActivo.id_documento, motivo), "Documento inactivado.");

  // Abre o descarga mediante una petición autenticada: no existen URLs públicas de archivos.
  async function abrirArchivo(documento, modo, version = null, nombreArchivo = null) {
    setError("");
    const ver = modo === "ver";
    const ventana = ver ? window.open("", "_blank") : null; // Se abre antes del await para evitar el bloqueo de ventanas emergentes.
    setAbriendo(`${documento.id_documento}-${version ?? "v"}-${modo}`);
    try {
      const blob = await obtenerArchivo(documento.id_documento, modo, version);
      const url = URL.createObjectURL(blob);
      if (ventana) { ventana.opener = null; ventana.location.href = url; }
      else {
        const enlace = document.createElement("a");
        enlace.href = url; enlace.download = nombreArchivo || documento.nombre_original || documento.nombre;
        document.body.appendChild(enlace); enlace.click(); enlace.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      ventana?.close();
      setError(`No se pudo abrir «${documento.nombre}»: ${e.message}`);
    } finally { setAbriendo(null); }
  }

  const sinDocumentos = !cargando && !error && documentos.length === 0;

  return <RiccatiLayout paginaActiva="documentos">
    <div className="bitacora-pagina">
      <PageHeader titulo="Documentos de proyectos" descripcion="Adjunta archivos o vínculos al expediente de cada proyecto, clasifícalos, controla sus versiones y consúltalos de forma segura." />
      {mensaje && <div className="riccati-s2-success" role="status"><Check size={19}/>{mensaje}<button type="button" aria-label="Cerrar mensaje" onClick={() => setMensaje("")}><X size={17}/></button></div>}
      {errorProyectos && <div className="login-error" role="alert">{errorProyectos}</div>}
      {errorTipos && <div className="login-error" role="alert">{errorTipos}</div>}
      <section className="riccati-panel bitacora-selector">
        <div className="bitacora-selector-titulo"><span className="bitacora-selector-icono"><FolderKanban size={22}/></span><div><span className="riccati-panel-label">EXPEDIENTE</span><h3>Selecciona un proyecto</h3><p>{admin ? "Puedes gestionar los documentos de todos los proyectos." : "Puedes gestionar los documentos de los proyectos que tienes asignados."}</p></div></div>
        <div className="bitacora-selector-acciones">
          <label htmlFor="documentos-proyecto" className="bitacora-select-label">Proyecto</label>
          <select id="documentos-proyecto" className="riccati-select bitacora-project-select" onChange={cambiarProyecto} value={idSeleccionado || ""} disabled={!idSeleccionado || cargandoProyectos}>
            {idSeleccionado ? proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.codigo} · {p.nombre}</option>) : <option value="">{cargandoProyectos ? "Cargando proyectos..." : "Sin proyectos disponibles"}</option>}
          </select>
        </div>
      </section>
      {!cargandoProyectos && !idSeleccionado && !errorProyectos && <section className="riccati-panel bitacora-vacio"><FolderKanban size={32}/><h3>No tienes proyectos disponibles</h3><p>Cuando te asignen un proyecto podrás adjuntar y consultar sus documentos.</p></section>}
      {idSeleccionado && <section className="riccati-panel bitacora-panel">
        <header className="riccati-panel-header bitacora-panel-header">
          <div><span className="riccati-panel-label">EXPEDIENTE DOCUMENTAL</span><h3>{proyectoActual?.nombre || "Documentos del proyecto"}</h3><p>{proyectoActual ? `${proyectoActual.codigo} · ${proyectoActual.cliente} · ${totalActivos} documento(s) activo(s)` : ""}</p></div>
          <div className="bitacora-botones">
            <button type="button" className="riccati-button-secondary" onClick={() => abrirModal("vinculo")} disabled={!tipos.length}><Link2 size={18}/> Agregar vínculo</button>
            <button type="button" className="riccati-button-primary" onClick={() => abrirModal("archivo")} disabled={!tipos.length}><Upload size={18}/> Adjuntar archivo</button>
          </div>
        </header>
        <div className="bitacora-filtro-barra documentos-filtros" role="search" aria-label="Buscar y filtrar documentos">
          <div className="bitacora-filtros">
            <label className="bitacora-filtro documentos-filtro-busqueda"><span><Search size={15}/> Buscar</span><input type="search" className="riccati-input" value={textoBusqueda} onChange={e => setTextoBusqueda(e.target.value)} maxLength={100} placeholder="Nombre o archivo"/></label>
            <label className="bitacora-filtro"><span><ListFilter size={15}/> Tipo</span><select className="riccati-select" name="tipo" value={filtros.tipo} onChange={cambiarFiltro}><option value="">Todos</option>{tipos.map(t => <option key={t.id_tipo_documento} value={t.id_tipo_documento}>{t.nombre}</option>)}</select></label>
            <label className="bitacora-filtro"><span><CalendarRange size={15}/> Desde</span><input type="date" className="riccati-input" name="desde" value={filtros.desde} max={filtros.hasta || undefined} onChange={cambiarFiltro}/></label>
            <label className="bitacora-filtro"><span><CalendarRange size={15}/> Hasta</span><input type="date" className="riccati-input" name="hasta" value={filtros.hasta} min={filtros.desde || undefined} onChange={cambiarFiltro}/></label>
            {admin && <label className="bitacora-filtro"><span><Ban size={15}/> Estado</span><select className="riccati-select" name="estado" value={filtros.estado} onChange={cambiarFiltro}><option value="ACTIVO">Activos</option><option value="INACTIVO">Inactivos</option><option value="TODOS">Todos</option></select></label>}
          </div>
          <div className="bitacora-filtro-acciones">
            <button type="button" className="riccati-button-secondary rp-accion" onClick={limpiarFiltros} disabled={!hayFiltros}><FilterX size={17} aria-hidden="true"/> Limpiar filtros</button>
            <button type="button" className="riccati-button-secondary rp-accion" onClick={() => setRecargar(n => n + 1)}><RefreshCcw size={17}/> Actualizar</button>
          </div>
        </div>
        {error && <div className="login-error bitacora-error" role="alert">{error}</div>}
        {cargando ? <div className="bitacora-vacio"><div className="riccati-loader"/><p>Cargando documentos...</p></div>
          : sinDocumentos ? (hayFiltros
            ? <div className="bitacora-vacio"><SearchX size={37}/><h3>No hay documentos que coincidan con la búsqueda</h3><p>Prueba con otras palabras, tipo o rango de fechas.</p><button type="button" className="riccati-button-secondary" onClick={limpiarFiltros}><FilterX size={17}/> Limpiar filtros</button></div>
            : <div className="bitacora-vacio"><FolderOpen size={37}/><h3>Este proyecto aún no tiene documentos</h3><p>Adjunta un archivo o registra un vínculo para iniciar su expediente documental.</p></div>)
          : documentos.length > 0 && <div className="riccati-table-wrapper"><table className="riccati-table documentos-tabla"><thead><tr><th>DOCUMENTO</th><th>TIPO</th><th>INCORPORADO</th><th>CARGADO POR</th><th>ACCIONES</th></tr></thead><tbody>
            {documentos.map(d => {
              const esArchivo = d.origen === "ARCHIVO";
              const inactivo = d.estado === "INACTIVO";
              const clave = `${d.id_documento}-v`;
              return <tr key={d.id_documento} className={inactivo ? "documentos-fila-inactiva" : ""}>
                <td><div className="documentos-identidad"><span className="documentos-icono">{esArchivo ? <FileText size={18}/> : <Link2 size={18}/>}</span><div>
                  <strong>{d.nombre}{esArchivo && <span className="documentos-version" title="Versión vigente">v{d.version_actual}</span>}{inactivo && <span className="riccati-badge riccati-badge-orange">Inactivo</span>}</strong>
                  <small>{esArchivo ? `${d.nombre_original} · ${tamanoTexto(d.tamano_bytes)}` : `Vínculo · ${dominio(d.url_externa)}`}</small>
                  {esArchivo && Number(d.version_actual) > 1 && d.usuario_version && <small>Versión {d.version_actual} cargada por {d.usuario_version} · {fechaTexto(d.version_creada_en)}</small>}
                  {d.descripcion && <p>{d.descripcion}</p>}
                  {inactivo && <p className="documentos-motivo"><strong>Inactivado por {d.usuario_inactiva} · {fechaTexto(d.inactivado_en)}:</strong> {d.motivo_inactivacion}</p>}
                </div></div></td>
                <td><div className="documentos-tipo"><span className="riccati-badge riccati-badge-purple">{d.tipo}</span></div>
                  {d.usuario_actualiza && <small className="documentos-meta">Reclasificado por {d.usuario_actualiza}</small>}</td>
                <td><span className="documentos-fecha">{fechaTexto(d.creado_en)}</span></td>
                <td>{d.usuario_carga}</td>
                <td><div className="riccati-s2-actions">
                  {esArchivo ? <>
                    {VISTA_PREVIA.includes(d.tipo_mime) && <button type="button" className="riccati-button-secondary rp-accion" onClick={() => abrirArchivo(d, "ver")} disabled={Boolean(abriendo)}><Eye size={16}/> {abriendo === `${clave}-ver` ? "Abriendo..." : "Abrir"}</button>}
                    <button type="button" className="riccati-button-secondary rp-accion" onClick={() => abrirArchivo(d, "descarga")} disabled={Boolean(abriendo)}><Download size={16}/> {abriendo === `${clave}-descarga` ? "Descargando..." : "Descargar"}</button>
                    {d.puede_versionar && <button type="button" className="riccati-button-secondary rp-accion" title="Cargar nueva versión" aria-label={`Cargar nueva versión de ${d.nombre}`} onClick={() => abrirModal("version", d)}><FileUp size={16} aria-hidden="true"/> Nueva versión</button>}
                    <button type="button" className="riccati-button-secondary rp-accion" title="Historial de versiones" aria-label={`Historial de versiones de ${d.nombre}`} onClick={() => abrirModal("historial", d)}><History size={16} aria-hidden="true"/> Historial</button>
                  </> : urlSegura(d.url_externa) && <a className="riccati-button-secondary rp-accion documentos-enlace" href={d.url_externa} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Abrir vínculo</a>}
                  {d.puede_reclasificar && <button type="button" className="riccati-button-secondary rp-accion" title="Cambiar clasificación" aria-label={`Cambiar clasificación de ${d.nombre}`} onClick={() => abrirModal("clasificar", d)}><Pencil size={15} aria-hidden="true"/> Clasificar</button>}
                  {d.puede_inactivar && <button type="button" className="riccati-button-danger rp-accion" title="Inactivar documento" aria-label={`Inactivar ${d.nombre}`} onClick={() => abrirModal("inactivar", d)}><Ban size={16} aria-hidden="true"/> Inactivar</button>}
                </div></td>
              </tr>;
            })}
          </tbody></table></div>}
        {!cargando && documentos.length > 0 && <footer className="bitacora-paginacion"><span>{documentos.length} documento(s){hayFiltros ? " con los filtros aplicados" : ""}</span><span className="documentos-nota"><ShieldAlert size={15}/> Los archivos solo se abren desde el sistema y con una sesión autorizada.</span></footer>}
      </section>}
      {(modal === "archivo" || modal === "vinculo") && <ModalAdjuntar key={modal} modo={modal} tipos={tipos} proyecto={proyectoActual} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarDocumento}/>}
      {modal === "clasificar" && documentoActivo && <ModalClasificar documento={documentoActivo} tipos={tipos} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarClasificacion}/>}
      {modal === "version" && documentoActivo && <ModalVersion documento={documentoActivo} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarVersion}/>}
      {modal === "historial" && documentoActivo && <ModalHistorial documento={documentoActivo} onCerrar={cerrarModal} onAbrir={abrirArchivo} abriendo={abriendo}/>}
      {modal === "inactivar" && documentoActivo && <ModalInactivar documento={documentoActivo} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarInactivacion}/>}
    </div>
  </RiccatiLayout>;
}
