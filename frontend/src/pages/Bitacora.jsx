import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Activity, CalendarClock, Check, ChevronLeft, ChevronRight, Clock3, FileClock,
  FolderKanban, History, ListFilter, MessageSquareText, Pencil, Plus,
  RefreshCcw, ShieldAlert, X,
} from "lucide-react";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import {
  proyectosDeBitacora, cronologiaProyecto, registrarActividad,
  registrarComentario, corregirActividad,
} from "../services/bitacoraService";
import "../styles/bitacora.css";

const FORM_INICIAL = { titulo: "", contenido: "", horas: "", descripcion_esfuerzo: "", justificacion: "" };
const fechaTexto = (valor) => valor ? new Date(valor).toLocaleString("es-CR", {
  dateStyle: "medium", timeStyle: "short",
}) : "Sin fecha";
const esAdministrador = (usuario) => usuario?.rol === "Administrador";
const numeroHoras = (valor) => Number(valor || 0).toLocaleString("es-CR", { maximumFractionDigits: 2 });

function ModalRegistro({ modo, entrada, usuario, ahora, error, guardando, onCerrar, onGuardar }) {
  const editando = modo === "corregir";
  const comentario = modo === "comentario";
  const [form, setForm] = useState(() => editando
    ? { ...FORM_INICIAL, ...entrada.actual, horas: entrada.actual?.horas == null ? "" : String(entrada.actual.horas), justificacion: "" }
    : { ...FORM_INICIAL });
  const autor = Number(usuario?.idUsuario) === Number(entrada?.id_autor);
  const plazo = entrada?.fecha_creacion && ahora - new Date(entrada.fecha_creacion).getTime() < 24 * 60 * 60 * 1000;
  const exigeMotivo = editando && esAdministrador(usuario) && (!autor || !plazo);
  const tituloModal = comentario ? "Nuevo comentario" : editando ? "Corregir actividad" : "Registrar actividad";
  const cambio = (e) => setForm(antes => ({ ...antes, [e.target.name]: e.target.value }));

  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className="riccati-modal bitacora-modal" role="dialog" aria-modal="true" aria-label={tituloModal}>
        <div className="riccati-modal-header bitacora-modal-header">
          <div><span className="riccati-page-label">M04 · SEGUIMIENTO DE PROYECTOS</span><h3>{tituloModal}</h3>
            <p>{comentario ? "Comparte una observación con el equipo." : editando ? "El sistema conservará los valores originales y la corrección." : "Documenta el avance del proyecto y el esfuerzo invertido."}</p>
          </div>
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
        <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); onGuardar(form); }}>
          <div className="riccati-modal-body">
            {error && <div className="login-error" role="alert">{error}</div>}
            {editando && <div className="bitacora-alert"><ShieldAlert size={19}/><span>{exigeMotivo ? "Esta corrección requiere una justificación obligatoria de 10 caracteres como mínimo." : "Puedes corregir tu propia actividad dentro de las primeras 24 horas. La modificación quedará auditada."}</span></div>}
            {!comentario && <div className="riccati-form-group">
              <label htmlFor="bitacora-titulo">Título de la actividad *</label>
              <input id="bitacora-titulo" className="riccati-input" name="titulo" value={form.titulo || ""} onChange={cambio} maxLength={180} required minLength={3} placeholder="Ej.: Visita técnica y revisión de planos" />
            </div>}
            <div className="riccati-form-group">
              <label htmlFor="bitacora-contenido">{comentario ? "Comentario *" : "Descripción de la actividad *"}</label>
              <textarea id="bitacora-contenido" className="riccati-input bitacora-area" name="contenido" value={form.contenido || ""} onChange={cambio} minLength={comentario ? 2 : 5} maxLength={comentario ? 3000 : 5000} required rows={4} placeholder={comentario ? "Escribe tu comentario para el equipo..." : "Describe los avances realizados, entregables o hallazgos..."}/>
            </div>
            {!comentario && <div className="bitacora-campos-horas">
              <div className="riccati-form-group">
                <label htmlFor="bitacora-horas">Horas dedicadas (opcional)</label>
                <div className="bitacora-campo-icono"><Clock3 size={19}/><input id="bitacora-horas" className="riccati-input" name="horas" value={form.horas ?? ""} onChange={cambio} type="number" min="0.01" max="24" step="0.01" placeholder="Ej.: 2.50"/></div>
                <small className="bitacora-ayuda">Mayor que 0 y máximo 24 horas.</small>
              </div>
              <div className="riccati-form-group">
                <label htmlFor="bitacora-esfuerzo">Descripción del esfuerzo {form.horas === "" || form.horas == null ? "*" : "(opcional)"}</label>
                <textarea id="bitacora-esfuerzo" className="riccati-input" name="descripcion_esfuerzo" value={form.descripcion_esfuerzo || ""} onChange={cambio} maxLength={2000} minLength={form.horas === "" || form.horas == null ? 5 : undefined} required={form.horas === "" || form.horas == null} rows={2} placeholder="Ej.: Revisión de detalles técnicos..."/>
                <small className="bitacora-ayuda">Obligatoria cuando no se informan horas.</small>
              </div>
            </div>}
            {editando && <div className="riccati-form-group">
              <label htmlFor="bitacora-justificacion">Justificación de la corrección {exigeMotivo ? "*" : "(opcional)"}</label>
              <textarea id="bitacora-justificacion" className="riccati-input" name="justificacion" value={form.justificacion || ""} onChange={cambio} minLength={exigeMotivo ? 10 : undefined} maxLength={2000} required={exigeMotivo} rows={3} placeholder="Explica por qué necesitas corregir este registro..."/>
            </div>}
          </div>
          <div className="riccati-modal-footer">
            <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
            <button className="riccati-button-primary" type="submit" disabled={guardando}>{guardando ? "Guardando..." : editando ? "Guardar corrección" : comentario ? "Publicar comentario" : "Registrar actividad"}<Check size={17}/></button>
          </div>
        </form>
      </div>
    </div>, document.body
  );
}

function Entrada({ evento, usuario, ahora, corregir }) {
  const correccion = evento.tipo_evento === "CORRECCION";
  const comentario = evento.tipo_evento === "COMENTARIO";
  const Icono = correccion ? History : comentario ? MessageSquareText : Activity;
  const dentroPlazo = new Date(evento.fecha_creacion).getTime() + 86400000 > ahora;
  const esAutor = Number(evento.id_autor) === Number(usuario?.idUsuario);
  const editable = !comentario && !correccion && (esAdministrador(usuario) || (esAutor && dentroPlazo));
  const datos = evento.nuevo || {};
  return (
    <article className={`bitacora-evento ${correccion ? "es-correccion" : comentario ? "es-comentario" : "es-actividad"}`}>
      <div className="bitacora-evento-simbolo"><Icono size={20}/></div>
      <div className="bitacora-evento-info">
        <div className="bitacora-evento-superior">
          <div className="bitacora-evento-etiquetas">
            <span className={`bitacora-chip ${correccion ? "chip-naranja" : comentario ? "chip-cyan" : "chip-violeta"}`}>{correccion ? "Corrección auditada" : comentario ? "Comentario" : "Actividad"}</span>
            <span className="bitacora-fecha"><CalendarClock size={14}/>{fechaTexto(evento.fecha_evento)}</span>
          </div>
          {editable && <button type="button" className="bitacora-corregir" onClick={() => corregir(evento)} title="Corregir actividad"><Pencil size={15}/> Corregir</button>}
        </div>
        <div className="bitacora-evento-autor">Registrado por <strong>{evento.autor}</strong></div>
        {correccion ? <>
          <h3>Se corrigió la actividad #{evento.id_entrada}</h3>
          {evento.justificacion && <p className="bitacora-motivo"><strong>Motivo:</strong> {evento.justificacion}</p>}
          <div className="bitacora-diferencias">
            <div><span>ANTES</span><strong>{evento.anterior?.titulo || "Actividad"}</strong><p>{evento.anterior?.contenido}</p><small>Horas: {evento.anterior?.horas ?? "No indicadas"}</small>{evento.anterior?.descripcion_esfuerzo && <small>Esfuerzo: {evento.anterior.descripcion_esfuerzo}</small>}</div>
            <div><span>DESPUÉS</span><strong>{datos.titulo || "Actividad"}</strong><p>{datos.contenido}</p><small>Horas: {datos.horas ?? "No indicadas"}</small>{datos.descripcion_esfuerzo && <small>Esfuerzo: {datos.descripcion_esfuerzo}</small>}</div>
          </div>
        </> : <>
          {!comentario && <h3>{evento.titulo}</h3>}
          <p className="bitacora-evento-contenido">{evento.contenido}</p>
          {!comentario && <div className="bitacora-evento-pie">
            <span><Clock3 size={15}/>{evento.horas == null ? "Horas no registradas" : `${numeroHoras(evento.horas)} h registradas`}</span>
            {evento.descripcion_esfuerzo && <span>Esfuerzo: {evento.descripcion_esfuerzo}</span>}
            {evento.actual && (evento.titulo !== evento.actual.titulo || evento.contenido !== evento.actual.contenido || String(evento.horas ?? "") !== String(evento.actual.horas ?? "")) && <span className="bitacora-etiqueta-cambio">Registro corregido posteriormente</span>}
          </div>}
        </>}
      </div>
    </article>
  );
}

export default function Bitacora() {
  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoQuery = searchParams.get("proyecto");
  const usuario = useMemo(() => { try { return JSON.parse(localStorage.getItem("usuarioRiccati")); } catch { return null; } }, []);
  const [proyectos, setProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState("");
  const [eventos, setEventos] = useState([]);
  const [resumen, setResumen] = useState({ actividades: 0, comentarios: 0, horas: 0, correcciones: 0 });
  const [proyectoActual, setProyectoActual] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [tipo, setTipo] = useState("TODOS");
  const [pagina, setPagina] = useState(1);
  const [paginas, setPaginas] = useState(1);
  const [total, setTotal] = useState(0);
  const [recargar, setRecargar] = useState(0);
  const [modal, setModal] = useState(null);
  const [entradaEditar, setEntradaEditar] = useState(null);
  const [errorModal, setErrorModal] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ahora, setAhora] = useState(() => Date.now());

  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 60000);
    return () => clearInterval(reloj);
  }, []);

  useEffect(() => {
    let activo = true;
    proyectosDeBitacora().then(datos => {
      if (!activo) return;
      setProyectos(Array.isArray(datos) ? datos : []);
      setCargandoProyectos(false);
    }).catch(e => { if (activo) { setErrorProyectos(e.message); setCargandoProyectos(false); } });
    return () => { activo = false; };
  }, []);

  const idSeleccionado = proyectos.find(p => String(p.id_proyecto) === String(proyectoQuery))?.id_proyecto ?? proyectos[0]?.id_proyecto ?? null;

  useEffect(() => {
    if (!idSeleccionado) return;
    let activo = true;
    setCargando(true);
    setError("");
    cronologiaProyecto(idSeleccionado, pagina, tipo).then(datos => {
      if (!activo) return;
      setEventos(datos.eventos || []);
      setResumen(datos.resumen || { actividades: 0, comentarios: 0, horas: 0, correcciones: 0 });
      setProyectoActual(datos.proyecto);
      setTotal(datos.total || 0);
      setPaginas(datos.paginas || 1);
    }).catch(e => { if (activo) setError(e.message); }).finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idSeleccionado, pagina, tipo, recargar]);

  const cambiarProyecto = useCallback((e) => {
    setSearchParams({ proyecto: e.target.value });
    setPagina(1);
    setMensaje("");
  }, [setSearchParams]);

  const abrir = (modo, entrada = null) => {
    setErrorModal(""); setEntradaEditar(entrada); setModal(modo);
  };
  const cerrar = () => { if (!guardando) { setModal(null); setEntradaEditar(null); setErrorModal(""); } };

  async function guardar(form) {
    if (!idSeleccionado || guardando) return;
    setErrorModal("");
    setGuardando(true);
    try {
      let resultado;
      if (modal === "comentario") {
        resultado = await registrarComentario(idSeleccionado, { contenido: form.contenido });
      } else {
        const horas = form.horas === "" || form.horas == null ? null : Number(form.horas);
        const payload = { titulo: form.titulo, contenido: form.contenido, horas,
          descripcion_esfuerzo: form.descripcion_esfuerzo, justificacion: form.justificacion };
        if (modal === "corregir") resultado = await corregirActividad(entradaEditar.id_entrada, payload);
        else resultado = await registrarActividad(idSeleccionado, payload);
      }
      setMensaje(resultado.mensaje || "Registro guardado correctamente.");
      setModal(null); setEntradaEditar(null);
      setPagina(1); setRecargar(n => n + 1);
    } catch (e) { setErrorModal(e.message); }
    finally { setGuardando(false); }
  }

  return <RiccatiLayout paginaActiva="bitacora">
    <div className="bitacora-pagina">
      <PageHeader modulo="M04 · SEGUIMIENTO Y BITÁCORA" titulo="Bitácora de proyectos" descripcion="Registra avances, comparte comentarios y consulta cada modificación en orden cronológico." estado="Historial auditable" />
      {mensaje && <div className="riccati-s2-success" role="status"><Check size={19}/>{mensaje}<button type="button" aria-label="Cerrar mensaje" onClick={() => setMensaje("")}><X size={17}/></button></div>}
      {errorProyectos && <div className="login-error" role="alert">{errorProyectos}</div>}
      <section className="riccati-panel bitacora-selector">
        <div className="bitacora-selector-titulo"><span className="bitacora-selector-icono"><FolderKanban size={22}/></span><div><span className="riccati-panel-label">PROYECTO ACTIVO</span><h3>Selecciona un proyecto</h3><p>{esAdministrador(usuario) ? "Puedes dar seguimiento a todos los proyectos." : "Puedes trabajar con los proyectos que tienes asignados."}</p></div></div>
        <div className="bitacora-selector-acciones">
          <label htmlFor="bitacora-proyecto" className="bitacora-select-label">Proyecto</label>
          <select id="bitacora-proyecto" className="riccati-select bitacora-project-select" onChange={cambiarProyecto} value={idSeleccionado || ""} disabled={!idSeleccionado || cargandoProyectos}>
            {idSeleccionado ? proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.codigo} · {p.nombre}</option>) : <option value="">Sin proyectos disponibles</option>}
          </select>
        </div>
      </section>
      {!cargandoProyectos && !idSeleccionado && !errorProyectos && <section className="riccati-panel bitacora-vacio"><FolderKanban size={32}/><h3>No tienes proyectos disponibles</h3><p>Cuando te asignen un proyecto podrás registrar y consultar su bitácora.</p></section>}
      {idSeleccionado && <>
        <section className="bitacora-estadisticas">
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono morado"><Activity size={22}/></div><div><span>ACTIVIDADES</span><strong>{resumen.actividades || 0}</strong><small>Avances registrados</small></div></div>
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono celeste"><MessageSquareText size={22}/></div><div><span>COMENTARIOS</span><strong>{resumen.comentarios || 0}</strong><small>Comunicación interna</small></div></div>
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono verde"><Clock3 size={22}/></div><div><span>HORAS</span><strong>{numeroHoras(resumen.horas)}</strong><small>Esfuerzo cuantificado</small></div></div>
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono naranja"><History size={22}/></div><div><span>CORRECCIONES</span><strong>{resumen.correcciones || 0}</strong><small>Con auditoría completa</small></div></div>
        </section>
        <section className="riccati-panel bitacora-panel">
          <header className="riccati-panel-header bitacora-panel-header">
            <div><span className="riccati-panel-label">LÍNEA DE TIEMPO</span><h3>{proyectoActual?.nombre || "Historial del proyecto"}</h3><p>{proyectoActual?.codigo} · {proyectoActual?.cliente}</p></div>
            <div className="bitacora-botones"><button type="button" className="riccati-button-secondary" onClick={() => abrir("comentario")}><MessageSquareText size={18}/> Comentar</button><button type="button" className="riccati-button-primary" onClick={() => abrir("actividad")}><Plus size={19}/> Nueva actividad</button></div>
          </header>
          <div className="bitacora-filtro-barra"><label><ListFilter size={18}/><span>Mostrar</span><select className="riccati-select" value={tipo} onChange={e => {setTipo(e.target.value);setPagina(1);}}><option value="TODOS">Todos los eventos</option><option value="ACTIVIDAD">Actividades</option><option value="COMENTARIO">Comentarios</option><option value="CORRECCION">Correcciones</option></select></label><button type="button" className="bitacora-actualizar" onClick={() => setRecargar(n=>n+1)}><RefreshCcw size={17}/> Actualizar</button></div>
          {error && <div className="login-error bitacora-error" role="alert">{error}</div>}
          {cargando ? <div className="bitacora-vacio"><div className="riccati-loader"/><p>Cargando cronología...</p></div> : eventos.length === 0 && !error ? <div className="bitacora-vacio"><FileClock size={37}/><h3>Sin eventos {tipo !== "TODOS" ? "de este tipo" : "todavía"}</h3><p>Registra una actividad o agrega un comentario para comenzar el seguimiento.</p></div> : <div className="bitacora-linea-tiempo">{eventos.map(e => <Entrada key={e.clave} evento={e} usuario={usuario} ahora={ahora} corregir={registro => abrir("corregir", registro)} />)}</div>}
          <footer className="bitacora-paginacion"><span>{total} evento(s) · Página {pagina} de {paginas}</span><div><button type="button" className="riccati-button-secondary" onClick={() => setPagina(p => Math.max(1,p-1))} disabled={pagina<=1} aria-label="Página anterior"><ChevronLeft size={18}/></button><button type="button" className="riccati-button-secondary" onClick={() => setPagina(p => Math.min(paginas,p+1))} disabled={pagina>=paginas} aria-label="Página siguiente"><ChevronRight size={18}/></button></div></footer>
        </section>
      </>}
      {modal && <ModalRegistro key={`${modal}-${entradaEditar?.id_entrada ?? "nuevo"}`} modo={modal} entrada={entradaEditar} usuario={usuario} ahora={ahora} error={errorModal} guardando={guardando} onCerrar={cerrar} onGuardar={guardar}/>}
    </div>
  </RiccatiLayout>;
}
