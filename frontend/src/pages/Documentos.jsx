// Sprint 3 · M05 Gestión documental: HU-M05-01 (adjuntar), HU-M05-02 (clasificar), HU-M05-03 (consultar y abrir).
import FormField from "../components/FormField";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Check, Download, ExternalLink, Eye, FileText, FolderKanban, FolderOpen, Link2,
  Pencil, RefreshCcw, ShieldAlert, Upload, X,
} from "lucide-react";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import { proyectosDeBitacora } from "../services/bitacoraService";
import {
  ACEPTAR_ARCHIVOS, EXTENSIONES_PERMITIDAS, TAMANO_MAXIMO, adjuntarArchivo, cambiarTipoDocumento,
  documentosDeProyecto, obtenerArchivo, registrarVinculo, tiposDocumento,
} from "../services/documentosService";
import "../styles/bitacora.css";
import "../styles/clientes-sprint2.css";
import "../styles/documentos.css";

const VISTA_PREVIA = ["application/pdf", "image/png", "image/jpeg"];
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

function ModalAdjuntar({ modo, tipos, proyecto, guardando, error, onCerrar, onGuardar }) {
  const esVinculo = modo === "vinculo";
  const [form, setForm] = useState({ nombre: "", idTipo: "", descripcion: "", url: "" });
  const [archivo, setArchivo] = useState(null);
  const [errorArchivo, setErrorArchivo] = useState("");
  const titulo = esVinculo ? "Registrar vínculo externo" : "Adjuntar archivo";
  const cambio = (e) => setForm(antes => ({ ...antes, [e.target.name]: e.target.value }));
  const elegirArchivo = (e) => {
    const elegido = e.target.files?.[0] || null;
    const problema = validarArchivo(elegido);
    setErrorArchivo(elegido ? problema : "");
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

  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className="riccati-modal bitacora-modal" role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="riccati-modal-header bitacora-modal-header">
          <div><span className="riccati-page-label">M05 · GESTIÓN DOCUMENTAL</span><h3>{titulo}</h3>
            <p>{proyecto ? `${proyecto.codigo} · ${proyecto.nombre}` : ""}</p>
          </div>
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
        <form className="bitacora-modal-form" onSubmit={enviar} noValidate={false}>
          <div className="riccati-modal-body">
            {error && <div className="login-error" role="alert">{error}</div>}
            {esVinculo ? <FormField className="riccati-form-group">
              <label htmlFor="doc-url">Dirección del vínculo *</label>
              <input id="doc-url" className="riccati-input" name="url" type="url" value={form.url} onChange={cambio} required maxLength={2000} placeholder="https://drive.google.com/..." pattern="https?://.+"/>
              <small className="bitacora-ayuda">Solo vínculos que empiecen con http:// o https://.</small>
            </FormField> : <div className="riccati-form-group">
              <label htmlFor="doc-archivo">Archivo *</label>
              <label htmlFor="doc-archivo" className={`documentos-dropzone${errorArchivo ? " con-error" : ""}`}>
                <Upload size={22}/>
                {archivo ? <span><strong>{archivo.name}</strong><small>{tamanoTexto(archivo.size)} · Haz clic para cambiarlo</small></span>
                  : <span><strong>Selecciona un archivo</strong><small>PDF, Word, Excel, PowerPoint, JPG, PNG o DWG · Máximo 10 MB</small></span>}
              </label>
              <input id="doc-archivo" className="documentos-input-archivo" type="file" accept={ACEPTAR_ARCHIVOS} onChange={elegirArchivo} aria-describedby="doc-archivo-ayuda"/>
              {errorArchivo ? <span className="rp-field-error" role="alert">{errorArchivo}</span> : <small id="doc-archivo-ayuda" className="bitacora-ayuda">El archivo se guarda de forma privada y solo lo pueden abrir usuarios con acceso al proyecto.</small>}
            </div>}
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
            <button className="riccati-button-primary" type="submit" disabled={guardando}>{guardando ? (esVinculo ? "Guardando..." : "Subiendo archivo...") : esVinculo ? "Registrar vínculo" : "Adjuntar archivo"}<Check size={17}/></button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
}

function ModalClasificar({ documento, tipos, guardando, error, onCerrar, onGuardar }) {
  const [idTipo, setIdTipo] = useState(String(documento.id_tipo_documento));
  const sinCambio = String(documento.id_tipo_documento) === String(idTipo);
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className="riccati-modal bitacora-modal documentos-modal-pequeno" role="dialog" aria-modal="true" aria-label="Cambiar clasificación">
        <div className="riccati-modal-header bitacora-modal-header">
          <div><span className="riccati-page-label">M05 · CLASIFICACIÓN</span><h3>Cambiar clasificación</h3><p>{documento.nombre}</p></div>
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
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
            <button className="riccati-button-primary" type="submit" disabled={guardando || sinCambio}>{guardando ? "Guardando..." : "Guardar clasificación"}<Check size={17}/></button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
}

export default function Documentos() {
  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoQuery = searchParams.get("proyecto");
  const usuario = useMemo(() => { try { return JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { return null; } }, []);
  const [proyectos, setProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState("");
  const [tipos, setTipos] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [proyectoActual, setProyectoActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [recargar, setRecargar] = useState(0);
  const [modal, setModal] = useState(null);
  const [documentoClasificar, setDocumentoClasificar] = useState(null);
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [abriendo, setAbriendo] = useState(null);

  useEffect(() => {
    let activo = true;
    Promise.all([proyectosDeBitacora(), tiposDocumento()]).then(([listaProyectos, listaTipos]) => {
      if (!activo) return;
      setProyectos(Array.isArray(listaProyectos) ? listaProyectos : []);
      setTipos(Array.isArray(listaTipos) ? listaTipos : []);
    }).catch(e => { if (activo) setErrorProyectos(e.message); })
      .finally(() => { if (activo) setCargandoProyectos(false); });
    return () => { activo = false; };
  }, []);

  const idSeleccionado = proyectos.find(p => String(p.id_proyecto) === String(proyectoQuery))?.id_proyecto ?? proyectos[0]?.id_proyecto ?? null;

  useEffect(() => {
    if (!idSeleccionado) return;
    let activo = true;
    setCargando(true);
    setError("");
    documentosDeProyecto(idSeleccionado).then(datos => {
      if (!activo) return;
      setDocumentos(datos.documentos || []);
      setProyectoActual(datos.proyecto || null);
    }).catch(e => { if (activo) { setError(e.message); setDocumentos([]); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idSeleccionado, recargar]);

  const cambiarProyecto = useCallback((e) => { setSearchParams({ proyecto: e.target.value }); setMensaje(""); }, [setSearchParams]);
  const abrirModal = (modo) => { setErrorModal(""); setModal(modo); };
  const cerrarModal = () => { if (!guardando) { setModal(null); setDocumentoClasificar(null); setErrorModal(""); } };

  async function guardarDocumento(form) {
    if (!idSeleccionado || guardando) return;
    setErrorModal("");
    setGuardando(true);
    try {
      const resultado = modal === "vinculo"
        ? await registrarVinculo(idSeleccionado, { nombre: form.nombre, id_tipo_documento: Number(form.idTipo), descripcion: form.descripcion, url: form.url })
        : await adjuntarArchivo(idSeleccionado, { archivo: form.archivo, nombre: form.nombre, idTipo: form.idTipo, descripcion: form.descripcion });
      setMensaje(resultado.mensaje || "Documento registrado correctamente.");
      setModal(null);
      setRecargar(n => n + 1);
    } catch (e) { setErrorModal(e.message); }
    finally { setGuardando(false); }
  }

  async function guardarClasificacion(idTipo) {
    setErrorModal("");
    setGuardando(true);
    try {
      const resultado = await cambiarTipoDocumento(documentoClasificar.id_documento, idTipo);
      setMensaje(resultado.mensaje || "Clasificación actualizada.");
      setModal(null); setDocumentoClasificar(null);
      setRecargar(n => n + 1);
    } catch (e) { setErrorModal(e.message); }
    finally { setGuardando(false); }
  }

  // Abre o descarga mediante una petición autenticada: no existen URLs públicas de archivos.
  async function abrirArchivo(documento, modo) {
    setError("");
    const ver = modo === "ver";
    const ventana = ver ? window.open("", "_blank") : null; // Se abre antes del await para evitar el bloqueo de ventanas emergentes.
    setAbriendo(`${documento.id_documento}-${modo}`);
    try {
      const blob = await obtenerArchivo(documento.id_documento, modo);
      const url = URL.createObjectURL(blob);
      if (ventana) { ventana.opener = null; ventana.location.href = url; }
      else {
        const enlace = document.createElement("a");
        enlace.href = url; enlace.download = documento.nombre_original || documento.nombre;
        document.body.appendChild(enlace); enlace.click(); enlace.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      ventana?.close();
      setError(`No se pudo abrir «${documento.nombre}»: ${e.message}`);
    } finally { setAbriendo(null); }
  }

  return <RiccatiLayout paginaActiva="documentos">
    <div className="bitacora-pagina">
      <PageHeader titulo="Documentos de proyectos" descripcion="Adjunta archivos o vínculos al expediente de cada proyecto, clasifícalos y consúltalos de forma segura." />
      {mensaje && <div className="riccati-s2-success" role="status"><Check size={19}/>{mensaje}<button type="button" aria-label="Cerrar mensaje" onClick={() => setMensaje("")}><X size={17}/></button></div>}
      {errorProyectos && <div className="login-error" role="alert">{errorProyectos}</div>}
      <section className="riccati-panel bitacora-selector">
        <div className="bitacora-selector-titulo"><span className="bitacora-selector-icono"><FolderKanban size={22}/></span><div><span className="riccati-panel-label">EXPEDIENTE</span><h3>Selecciona un proyecto</h3><p>{esAdministrador(usuario) ? "Puedes gestionar los documentos de todos los proyectos." : "Puedes gestionar los documentos de los proyectos que tienes asignados."}</p></div></div>
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
          <div><span className="riccati-panel-label">EXPEDIENTE DOCUMENTAL</span><h3>{proyectoActual?.nombre || "Documentos del proyecto"}</h3><p>{proyectoActual ? `${proyectoActual.codigo} · ${proyectoActual.cliente} · ${documentos.length} documento(s)` : ""}</p></div>
          <div className="bitacora-botones">
            <button type="button" className="riccati-button-secondary" onClick={() => abrirModal("vinculo")} disabled={!tipos.length}><Link2 size={18}/> Agregar vínculo</button>
            <button type="button" className="riccati-button-primary" onClick={() => abrirModal("archivo")} disabled={!tipos.length}><Upload size={18}/> Adjuntar archivo</button>
          </div>
        </header>
        <div className="bitacora-filtro-barra documentos-barra">
          <span className="documentos-nota"><ShieldAlert size={16}/> Los archivos solo se abren desde el sistema y con una sesión autorizada.</span>
          <button type="button" className="bitacora-actualizar" onClick={() => setRecargar(n => n + 1)}><RefreshCcw size={17}/> Actualizar</button>
        </div>
        {error && <div className="login-error bitacora-error" role="alert">{error}</div>}
        {cargando ? <div className="bitacora-vacio"><div className="riccati-loader"/><p>Cargando documentos...</p></div>
          : documentos.length === 0 ? (!error && <div className="bitacora-vacio"><FolderOpen size={37}/><h3>Este proyecto aún no tiene documentos</h3><p>Adjunta un archivo o registra un vínculo para iniciar su expediente documental.</p></div>)
          : <div className="riccati-table-wrapper"><table className="riccati-table documentos-tabla"><thead><tr><th>DOCUMENTO</th><th>TIPO</th><th>INCORPORADO</th><th>CARGADO POR</th><th>ACCIONES</th></tr></thead><tbody>
            {documentos.map(d => {
              const esArchivo = d.origen === "ARCHIVO";
              return <tr key={d.id_documento}>
                <td><div className="documentos-identidad"><span className="documentos-icono">{esArchivo ? <FileText size={18}/> : <Link2 size={18}/>}</span><div>
                  <strong>{d.nombre}</strong>
                  <small>{esArchivo ? `${d.nombre_original} · ${tamanoTexto(d.tamano_bytes)}` : `Vínculo · ${dominio(d.url_externa)}`}</small>
                  {d.descripcion && <p>{d.descripcion}</p>}
                </div></div></td>
                <td><div className="documentos-tipo"><span className="riccati-badge riccati-badge-purple">{d.tipo}</span>{d.puede_reclasificar && <button type="button" className="riccati-s2-icon-action" title="Cambiar clasificación" aria-label={`Cambiar clasificación de ${d.nombre}`} onClick={() => { setErrorModal(""); setDocumentoClasificar(d); setModal("clasificar"); }}><Pencil size={15}/></button>}</div>
                  {d.usuario_actualiza && <small className="documentos-meta">Reclasificado por {d.usuario_actualiza}</small>}</td>
                <td><span className="documentos-fecha">{fechaTexto(d.creado_en)}</span></td>
                <td>{d.usuario_carga}</td>
                <td><div className="riccati-s2-actions">
                  {esArchivo ? <>
                    {VISTA_PREVIA.includes(d.tipo_mime) && <button type="button" className="riccati-button-secondary" onClick={() => abrirArchivo(d, "ver")} disabled={Boolean(abriendo)}><Eye size={16}/> {abriendo === `${d.id_documento}-ver` ? "Abriendo..." : "Abrir"}</button>}
                    <button type="button" className="riccati-button-secondary" onClick={() => abrirArchivo(d, "descarga")} disabled={Boolean(abriendo)}><Download size={16}/> {abriendo === `${d.id_documento}-descarga` ? "Descargando..." : "Descargar"}</button>
                  </> : urlSegura(d.url_externa) && <a className="riccati-button-secondary documentos-enlace" href={d.url_externa} target="_blank" rel="noopener noreferrer"><ExternalLink size={16}/> Abrir vínculo</a>}
                </div></td>
              </tr>;
            })}
          </tbody></table></div>}
      </section>}
      {(modal === "archivo" || modal === "vinculo") && <ModalAdjuntar key={modal} modo={modal} tipos={tipos} proyecto={proyectoActual} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarDocumento}/>}
      {modal === "clasificar" && documentoClasificar && <ModalClasificar documento={documentoClasificar} tipos={tipos} guardando={guardando} error={errorModal} onCerrar={cerrarModal} onGuardar={guardarClasificacion}/>}
    </div>
  </RiccatiLayout>;
}
