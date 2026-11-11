// Sprint 3 · M06 Control financiero básico (captura). Solo administrador.
// HU-M06-01 Registrar monto acordado · HU-M06-02 Registrar pagos recibidos · HU-M06-03 Corregir pagos.
import FormField from "../components/FormField";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  Ban, Banknote, Check, CircleDollarSign, FolderKanban, HandCoins, History, Pencil, Plus,
  ReceiptText, RefreshCcw, ShieldAlert, TriangleAlert, Wallet, X,
} from "lucide-react";
import RiccatiLayout from "../components/RiccatiLayout";
import PageHeader from "../components/PageHeader";
import { proyectosDeBitacora } from "../services/bitacoraService";
import {
  NOMBRE_MONEDA, anularPago, correccionesDePago, corregirPago, finanzasDeProyecto, formatoMoneda,
  guardarMontoAcordado, registrarPago,
} from "../services/finanzasService";
import "../styles/bitacora.css";
import "../styles/clientes-sprint2.css";
import "../styles/finanzas.css";

const fechaHora = (valor) => valor ? new Date(valor).toLocaleString("es-CR", { dateStyle: "medium", timeStyle: "short" }) : "";
const fechaCorta = (aaaammdd) => aaaammdd ? new Date(`${aaaammdd}T12:00:00`).toLocaleDateString("es-CR", { dateStyle: "medium" }) : "";
const hoy = () => new Date().toLocaleDateString("en-CA");

function Modal({ etiqueta, titulo, subtitulo, guardando, onCerrar, children, pequeno }) {
  return createPortal(
    <div className="riccati-modal-backdrop" onMouseDown={e => e.target === e.currentTarget && !guardando && onCerrar()}>
      <div className={`riccati-modal bitacora-modal${pequeno ? " finanzas-modal-pequeno" : ""}`} role="dialog" aria-modal="true" aria-label={titulo}>
        <div className="riccati-modal-header bitacora-modal-header">
          <div><span className="riccati-page-label">{etiqueta}</span><h3>{titulo}</h3>{subtitulo && <p>{subtitulo}</p>}</div>
          <button type="button" className="riccati-button-secondary" onClick={onCerrar} disabled={guardando} aria-label="Cerrar"><X size={18}/></button>
        </div>
        {children}
      </div>
    </div>, document.body
  );
}

// Aviso de sobrepago: decisión del negocio "permitir con aviso". El servidor exige la confirmación.
function AvisoExcedente({ aviso, confirmado, onConfirmar }) {
  if (!aviso) return null;
  return <div className="finanzas-aviso" role="alert">
    <TriangleAlert size={19}/>
    <div><p>{aviso}</p>
      <label className="riccati-s2-checkbox"><input type="checkbox" checked={confirmado} onChange={e => onConfirmar(e.target.checked)}/> Confirmo que deseo registrarlo con saldo a favor del cliente</label>
    </div>
  </div>;
}

function Pie({ guardando, onCerrar, texto, deshabilitado }) {
  return <div className="riccati-modal-footer">
    <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
    <button className="riccati-button-primary" type="submit" disabled={guardando || deshabilitado}>{guardando ? "Guardando..." : texto}<Check size={17}/></button>
  </div>;
}

// HU-M06-01
function ModalMonto({ finanzas, tienePagos, proyecto, guardando, error, aviso, onEditar, onCerrar, onGuardar }) {
  const actualizando = Boolean(finanzas);
  const [form, setForm] = useState({ monto: finanzas ? String(Number(finanzas.monto_acordado)) : "", moneda: finanzas?.moneda || "CRC", justificacion: "" });
  const [confirmado, setConfirmado] = useState(false);
  const cambio = (e) => { setForm(a => ({ ...a, [e.target.name]: e.target.value })); setConfirmado(false); if (["monto", "moneda"].includes(e.target.name)) onEditar(); };
  return <Modal etiqueta="M06 · CONTROL FINANCIERO" titulo={actualizando ? "Actualizar monto acordado" : "Registrar monto acordado"} subtitulo={proyecto ? `${proyecto.codigo} · ${proyecto.nombre}` : ""} guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); onGuardar({ ...form, confirmar_excedente: confirmado }); }}>
      <div className="riccati-modal-body">
        {error && !aviso && <div className="login-error" role="alert">{error}</div>}
        <AvisoExcedente aviso={aviso} confirmado={confirmado} onConfirmar={setConfirmado}/>
        <div className="finanzas-campos">
          <FormField className="riccati-form-group">
            <label htmlFor="fin-moneda">Moneda *</label>
            <select id="fin-moneda" className="riccati-select" name="moneda" value={form.moneda} onChange={cambio} required disabled={tienePagos}>
              <option value="CRC">{NOMBRE_MONEDA.CRC}</option><option value="USD">{NOMBRE_MONEDA.USD}</option>
            </select>
            <small className="bitacora-ayuda">{tienePagos ? "No se puede cambiar: el proyecto ya tiene pagos en esta moneda." : "Los pagos del proyecto se registrarán en esta moneda."}</small>
          </FormField>
          <FormField className="riccati-form-group">
            <label htmlFor="fin-monto">Monto acordado *</label>
            <input id="fin-monto" className="riccati-input" name="monto" type="number" min="0.01" step="0.01" max="999999999999.99" value={form.monto} onChange={cambio} required placeholder="Ej.: 1500000"/>
            <small className="bitacora-ayuda">{form.monto && Number(form.monto) > 0 ? formatoMoneda(form.monto, form.moneda) : "Mayor que 0, hasta 2 decimales."}</small>
          </FormField>
        </div>
        {actualizando && <FormField className="riccati-form-group">
          <label htmlFor="fin-justificacion">Justificación del cambio *</label>
          <textarea id="fin-justificacion" className="riccati-input" name="justificacion" value={form.justificacion} onChange={cambio} required minLength={10} maxLength={1000} rows={3} placeholder="Ej.: Adenda firmada por ampliación del alcance"/>
          <small className="bitacora-ayuda">Quedará registrado el monto anterior, el nuevo, tu nombre y la fecha.</small>
        </FormField>}
      </div>
      <Pie guardando={guardando} onCerrar={onCerrar} texto={actualizando ? "Guardar cambio" : "Registrar monto"} deshabilitado={Boolean(aviso) && !confirmado}/>
    </form>
  </Modal>;
}

// HU-M06-02 (registrar) y HU-M06-03 (corregir) comparten el formulario del pago.
function ModalPago({ pago, finanzas, resumen, guardando, error, aviso, onEditar, onCerrar, onGuardar }) {
  const corrigiendo = Boolean(pago);
  const [form, setForm] = useState({
    fecha_pago: pago?.fecha_pago || hoy(), monto: pago ? String(Number(pago.monto)) : "",
    referencia: pago?.referencia || "", observacion: pago?.observacion || "", justificacion: "",
  });
  const [confirmado, setConfirmado] = useState(false);
  const cambio = (e) => { setForm(a => ({ ...a, [e.target.name]: e.target.value })); setConfirmado(false); if (["monto", "moneda"].includes(e.target.name)) onEditar(); };
  const moneda = finanzas.moneda;
  return <Modal etiqueta="M06 · CONTROL FINANCIERO" titulo={corrigiendo ? "Corregir pago" : "Registrar pago recibido"}
    subtitulo={corrigiendo ? `Pago del ${fechaCorta(pago.fecha_pago)} por ${formatoMoneda(pago.monto, moneda)}` : `Saldo pendiente: ${formatoMoneda(resumen.saldo, moneda)}`}
    guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); onGuardar({ ...form, confirmar_excedente: confirmado }); }}>
      <div className="riccati-modal-body">
        {error && !aviso && <div className="login-error" role="alert">{error}</div>}
        {corrigiendo && <div className="bitacora-alert"><ShieldAlert size={19}/><span>El pago no se elimina: se guardan los valores anteriores y los nuevos con tu nombre, la fecha y la justificación.</span></div>}
        <AvisoExcedente aviso={aviso} confirmado={confirmado} onConfirmar={setConfirmado}/>
        <div className="finanzas-campos">
          <FormField className="riccati-form-group">
            <label htmlFor="pago-fecha">Fecha del pago *</label>
            <input id="pago-fecha" className="riccati-input" type="date" name="fecha_pago" value={form.fecha_pago} max={hoy()} onChange={cambio} required/>
          </FormField>
          <FormField className="riccati-form-group">
            <label htmlFor="pago-monto">Monto recibido ({moneda === "USD" ? "$" : "₡"}) *</label>
            <input id="pago-monto" className="riccati-input" type="number" name="monto" min="0.01" step="0.01" max="999999999999.99" value={form.monto} onChange={cambio} required placeholder="Ej.: 500000"/>
            <small className="bitacora-ayuda">{form.monto && Number(form.monto) > 0 ? formatoMoneda(form.monto, moneda) : "Mayor que 0, hasta 2 decimales."}</small>
          </FormField>
        </div>
        <FormField className="riccati-form-group">
          <label htmlFor="pago-referencia">Referencia o comprobante (opcional)</label>
          <input id="pago-referencia" className="riccati-input" name="referencia" value={form.referencia} onChange={cambio} maxLength={80} placeholder="Ej.: Transferencia 123456"/>
        </FormField>
        <FormField className="riccati-form-group">
          <label htmlFor="pago-observacion">Observación (opcional)</label>
          <textarea id="pago-observacion" className="riccati-input" name="observacion" value={form.observacion} onChange={cambio} maxLength={1000} rows={2} placeholder="Ej.: Adelanto del 30 %"/>
        </FormField>
        {corrigiendo && <FormField className="riccati-form-group">
          <label htmlFor="pago-justificacion">Justificación de la corrección *</label>
          <textarea id="pago-justificacion" className="riccati-input" name="justificacion" value={form.justificacion} onChange={cambio} required minLength={10} maxLength={1000} rows={3} placeholder="Ej.: El monto del comprobante es distinto al digitado"/>
        </FormField>}
      </div>
      <Pie guardando={guardando} onCerrar={onCerrar} texto={corrigiendo ? "Guardar corrección" : "Registrar pago"} deshabilitado={Boolean(aviso) && !confirmado}/>
    </form>
  </Modal>;
}

// HU-M06-03: anulación con justificación obligatoria.
function ModalAnular({ pago, moneda, guardando, error, onCerrar, onGuardar }) {
  const [justificacion, setJustificacion] = useState("");
  return <Modal etiqueta="M06 · CORRECCIÓN DE PAGOS" titulo="Anular pago" subtitulo={`Pago del ${fechaCorta(pago.fecha_pago)} por ${formatoMoneda(pago.monto, moneda)}`} pequeno guardando={guardando} onCerrar={onCerrar}>
    <form className="bitacora-modal-form" onSubmit={e => { e.preventDefault(); onGuardar(justificacion); }}>
      <div className="riccati-modal-body">
        {error && <div className="login-error" role="alert">{error}</div>}
        <div className="bitacora-alert"><ShieldAlert size={19}/><span>El pago se conservará en la lista marcado como «Anulado» y dejará de contar para el saldo. Esta acción no se puede revertir; si fue un error, registra el pago nuevamente.</span></div>
        <FormField className="riccati-form-group">
          <label htmlFor="anular-justificacion">Justificación *</label>
          <textarea id="anular-justificacion" className="riccati-input" value={justificacion} onChange={e => setJustificacion(e.target.value)} required minLength={10} maxLength={1000} rows={3} placeholder="Ej.: Pago duplicado; el comprobante ya estaba registrado"/>
        </FormField>
      </div>
      <div className="riccati-modal-footer">
        <button type="button" className="riccati-button-secondary" disabled={guardando} onClick={onCerrar}>Cancelar</button>
        <button className="riccati-button-primary finanzas-boton-peligro" type="submit" disabled={guardando}>{guardando ? "Anulando..." : "Anular pago"}<Ban size={17}/></button>
      </div>
    </form>
  </Modal>;
}

const CAMPOS = [["fecha_pago", "Fecha"], ["monto", "Monto"], ["referencia", "Referencia"], ["observacion", "Observación"]];
function valorCampo(campo, valor, moneda) {
  if (valor === null || valor === undefined || valor === "") return "—";
  if (campo === "monto") return formatoMoneda(valor, moneda);
  if (campo === "fecha_pago") return fechaCorta(valor);
  return valor;
}

// HU-M06-03: trazabilidad de un pago (antes y después de cada corrección o anulación).
function ModalHistorialPago({ pago, moneda, onCerrar }) {
  const [estado, setEstado] = useState({ cargando: true, error: "", registros: [] });
  useEffect(() => {
    let activo = true;
    correccionesDePago(pago.id_pago).then(r => { if (activo) setEstado({ cargando: false, error: "", registros: r }); })
      .catch(e => { if (activo) setEstado({ cargando: false, error: e.message, registros: [] }); });
    return () => { activo = false; };
  }, [pago.id_pago]);
  return <Modal etiqueta="M06 · TRAZABILIDAD" titulo="Historial del pago" subtitulo={`Registrado por ${pago.usuario_registra} · ${fechaHora(pago.registrado_en)}`} onCerrar={onCerrar}>
    <div className="riccati-modal-body">
      {estado.error && <div className="login-error" role="alert">{estado.error}</div>}
      {estado.cargando ? <div className="bitacora-vacio"><div className="riccati-loader"/><p>Cargando historial...</p></div>
        : estado.registros.length === 0 ? <div className="bitacora-vacio"><History size={30}/><p>Este pago no tiene correcciones.</p></div>
        : <div className="finanzas-historial">{estado.registros.map(c => {
          const cambiados = CAMPOS.filter(([campo]) => JSON.stringify(c.anterior[campo] ?? null) !== JSON.stringify(c.nuevo[campo] ?? null));
          return <article key={c.id_correccion}>
            <header><span className={`riccati-badge ${c.tipo === "ANULACION" ? "riccati-badge-red" : "riccati-badge-orange"}`}>{c.tipo === "ANULACION" ? "Anulación" : "Corrección"}</span><small>{c.usuario} · {fechaHora(c.corregido_en)}</small></header>
            <p className="bitacora-motivo"><strong>Justificación:</strong> {c.justificacion}</p>
            {c.tipo === "CORRECCION" && <div className="bitacora-diferencias">
              <div><span>ANTES</span>{cambiados.map(([campo, etiqueta]) => <small key={campo}>{etiqueta}: {valorCampo(campo, c.anterior[campo], moneda)}</small>)}</div>
              <div><span>DESPUÉS</span>{cambiados.map(([campo, etiqueta]) => <small key={campo}>{etiqueta}: {valorCampo(campo, c.nuevo[campo], moneda)}</small>)}</div>
            </div>}
          </article>;
        })}</div>}
    </div>
    <div className="riccati-modal-footer"><button type="button" className="riccati-button-secondary" onClick={onCerrar}>Cerrar</button></div>
  </Modal>;
}

function ModalHistorialMonto({ cambios, onCerrar }) {
  return <Modal etiqueta="M06 · TRAZABILIDAD" titulo="Cambios del monto acordado" onCerrar={onCerrar}>
    <div className="riccati-modal-body"><div className="finanzas-historial">{cambios.map((c, i) => <article key={i}>
      <header><span className="riccati-badge riccati-badge-orange">Actualización</span><small>{c.usuario} · {fechaHora(c.cambiado_en)}</small></header>
      <p className="bitacora-motivo"><strong>Justificación:</strong> {c.justificacion}</p>
      <div className="bitacora-diferencias">
        <div><span>ANTES</span><strong>{formatoMoneda(c.monto_anterior, c.moneda_anterior)}</strong></div>
        <div><span>DESPUÉS</span><strong>{formatoMoneda(c.monto_nuevo, c.moneda_nueva)}</strong></div>
      </div>
    </article>)}</div></div>
    <div className="riccati-modal-footer"><button type="button" className="riccati-button-secondary" onClick={onCerrar}>Cerrar</button></div>
  </Modal>;
}

export default function Finanzas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const proyectoQuery = searchParams.get("proyecto");
  const [proyectos, setProyectos] = useState([]);
  const [cargandoProyectos, setCargandoProyectos] = useState(true);
  const [errorProyectos, setErrorProyectos] = useState("");
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState({ texto: "", alerta: false });
  const [recargar, setRecargar] = useState(0);
  const [modal, setModal] = useState(null);
  const [pagoActivo, setPagoActivo] = useState(null);
  const [errorModal, setErrorModal] = useState("");
  const [aviso, setAviso] = useState("");
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    let activo = true;
    proyectosDeBitacora().then(lista => { if (activo) setProyectos(Array.isArray(lista) ? lista : []); })
      .catch(e => { if (activo) setErrorProyectos(e.message); })
      .finally(() => { if (activo) setCargandoProyectos(false); });
    return () => { activo = false; };
  }, []);

  const idSeleccionado = proyectos.find(p => String(p.id_proyecto) === String(proyectoQuery))?.id_proyecto ?? proyectos[0]?.id_proyecto ?? null;

  useEffect(() => {
    if (!idSeleccionado) return;
    let activo = true;
    setCargando(true);
    setError("");
    finanzasDeProyecto(idSeleccionado).then(r => { if (activo) setDatos(r); })
      .catch(e => { if (activo) { setError(e.message); setDatos(null); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [idSeleccionado, recargar]);

  const cambiarProyecto = useCallback((e) => { setDatos(null); setSearchParams({ proyecto: e.target.value }); setMensaje({ texto: "", alerta: false }); }, [setSearchParams]);
  const abrir = (tipo, pago = null) => { setErrorModal(""); setAviso(""); setPagoActivo(pago); setModal(tipo); };
  const cerrar = () => { if (!guardando) { setModal(null); setPagoActivo(null); setErrorModal(""); setAviso(""); } };

  async function ejecutar(operacion) {
    setErrorModal("");
    setGuardando(true);
    try {
      const r = await operacion();
      setMensaje({ texto: r.mensaje, alerta: Boolean(r.resumen?.saldo_a_favor) });
      setModal(null); setPagoActivo(null); setAviso("");
      setRecargar(n => n + 1);
    } catch (e) {
      // El servidor pide confirmar cuando lo pagado supera el monto acordado.
      if (e.codigo === "REQUIERE_CONFIRMACION") setAviso(e.message);
      else { setAviso(""); setErrorModal(e.message); }
    } finally { setGuardando(false); }
  }

  const finanzas = datos?.finanzas;
  const resumen = datos?.resumen;
  const pagos = datos?.pagos || [];
  const moneda = finanzas?.moneda;
  const saldoAFavor = Boolean(resumen?.saldo_a_favor);

  return <RiccatiLayout paginaActiva="finanzas">
    <div className="bitacora-pagina">
      <PageHeader titulo="Finanzas de proyectos" descripcion="Registra el monto acordado y los pagos recibidos de cada proyecto, y corrige pagos sin perder su historial." />
      {mensaje.texto && <div className={mensaje.alerta ? "finanzas-aviso finanzas-aviso-banner" : "riccati-s2-success"} role="status">{mensaje.alerta ? <TriangleAlert size={19}/> : <Check size={19}/>}<span>{mensaje.texto}</span><button type="button" aria-label="Cerrar mensaje" onClick={() => setMensaje({ texto: "", alerta: false })}><X size={17}/></button></div>}
      {errorProyectos && <div className="login-error" role="alert">{errorProyectos}</div>}
      <section className="riccati-panel bitacora-selector">
        <div className="bitacora-selector-titulo"><span className="bitacora-selector-icono"><FolderKanban size={22}/></span><div><span className="riccati-panel-label">CONTROL FINANCIERO</span><h3>Selecciona un proyecto</h3><p>Solo el administrador registra montos y pagos.</p></div></div>
        <div className="bitacora-selector-acciones">
          <label htmlFor="finanzas-proyecto" className="bitacora-select-label">Proyecto</label>
          <select id="finanzas-proyecto" className="riccati-select bitacora-project-select" onChange={cambiarProyecto} value={idSeleccionado || ""} disabled={!idSeleccionado || cargandoProyectos}>
            {idSeleccionado ? proyectos.map(p => <option key={p.id_proyecto} value={p.id_proyecto}>{p.codigo} · {p.nombre}</option>) : <option value="">{cargandoProyectos ? "Cargando proyectos..." : "Sin proyectos registrados"}</option>}
          </select>
        </div>
      </section>
      {!cargandoProyectos && !idSeleccionado && !errorProyectos && <section className="riccati-panel bitacora-vacio"><FolderKanban size={32}/><h3>No hay proyectos registrados</h3><p>Crea un proyecto en el módulo Proyectos para registrar su información financiera.</p></section>}
      {idSeleccionado && error && <div className="login-error" role="alert">{error}</div>}
      {idSeleccionado && cargando && !datos && <section className="riccati-panel bitacora-vacio"><div className="riccati-loader"/><p>Cargando información financiera...</p></section>}

      {idSeleccionado && datos && !finanzas && <section className="riccati-panel bitacora-vacio finanzas-vacio">
        <CircleDollarSign size={37}/>
        <h3>Este proyecto aún no tiene monto acordado</h3>
        <p>Registra el monto acordado con el cliente para establecer su referencia financiera. Sin él no se pueden registrar pagos.</p>
        <button type="button" className="riccati-button-primary" onClick={() => abrir("monto")}><Plus size={18}/> Registrar monto acordado</button>
      </section>}

      {idSeleccionado && datos && finanzas && <>
        <section className="bitacora-estadisticas finanzas-estadisticas">
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono morado"><Wallet size={22}/></div><div><span>MONTO ACORDADO</span><strong>{formatoMoneda(finanzas.monto_acordado, moneda)}</strong><small>{NOMBRE_MONEDA[moneda]}</small></div></div>
          <div className="bitacora-kpi"><div className="bitacora-kpi-icono verde"><HandCoins size={22}/></div><div><span>TOTAL PAGADO</span><strong>{formatoMoneda(resumen.total_pagado, moneda)}</strong><small>{resumen.pagos_vigentes} pago(s) vigente(s)</small></div></div>
          <div className={`bitacora-kpi${saldoAFavor ? " finanzas-kpi-alerta" : ""}`}><div className="bitacora-kpi-icono naranja"><Banknote size={22}/></div><div><span>{saldoAFavor ? "SALDO A FAVOR DEL CLIENTE" : "SALDO PENDIENTE"}</span><strong>{formatoMoneda(Math.abs(Number(resumen.saldo)), moneda)}</strong><small>{saldoAFavor ? "Lo pagado supera el monto acordado" : "Monto acordado menos pagos vigentes"}</small></div></div>
        </section>

        <section className="riccati-panel bitacora-panel">
          <header className="riccati-panel-header bitacora-panel-header">
            <div><span className="riccati-panel-label">REFERENCIA FINANCIERA</span><h3>{datos.proyecto?.nombre}</h3>
              <p>{datos.proyecto?.codigo} · {datos.proyecto?.cliente} · Monto registrado por {finanzas.usuario_registra} el {fechaHora(finanzas.registrado_en)}{finanzas.usuario_actualiza ? ` · Última actualización: ${finanzas.usuario_actualiza}, ${fechaHora(finanzas.actualizado_en)}` : ""}</p></div>
            <div className="bitacora-botones">
              {datos.cambios_monto.length > 0 && <button type="button" className="riccati-button-secondary" onClick={() => abrir("historial-monto")}><History size={18}/> Cambios ({datos.cambios_monto.length})</button>}
              <button type="button" className="riccati-button-secondary" onClick={() => abrir("monto")}><Pencil size={17}/> Actualizar monto</button>
              <button type="button" className="riccati-button-primary" onClick={() => abrir("pago")}><Plus size={19}/> Registrar pago</button>
            </div>
          </header>
          <div className="bitacora-filtro-barra">
            <span className="finanzas-subtitulo"><ReceiptText size={17}/> Pagos recibidos</span>
            <button type="button" className="bitacora-actualizar" onClick={() => setRecargar(n => n + 1)}><RefreshCcw size={17}/> Actualizar</button>
          </div>
          {pagos.length === 0 ? <div className="bitacora-vacio"><ReceiptText size={37}/><h3>Aún no hay pagos registrados</h3><p>Usa «Registrar pago» cada vez que el cliente realice un abono.</p></div>
            : <div className="riccati-table-wrapper"><table className="riccati-table finanzas-tabla"><thead><tr><th>FECHA</th><th>MONTO</th><th>REFERENCIA</th><th>ESTADO</th><th>REGISTRADO POR</th><th>ACCIONES</th></tr></thead><tbody>
              {pagos.map(p => {
                const anulado = p.estado === "ANULADO";
                return <tr key={p.id_pago} className={anulado ? "finanzas-fila-anulada" : ""}>
                  <td><span className="finanzas-fecha">{fechaCorta(p.fecha_pago)}</span></td>
                  <td><strong className="finanzas-monto">{formatoMoneda(p.monto, moneda)}</strong></td>
                  <td><div className="riccati-s2-doble"><span>{p.referencia || "Sin referencia"}</span>{p.observacion && <small>{p.observacion}</small>}</div></td>
                  <td><span className={`riccati-badge ${anulado ? "riccati-badge-red" : "riccati-badge-green"}`}>{anulado ? "Anulado" : "Vigente"}</span>{p.correcciones > 0 && !anulado && <small className="finanzas-meta">Corregido {p.correcciones} vez/veces</small>}</td>
                  <td><div className="riccati-s2-doble"><span>{p.usuario_registra}</span><small>{fechaHora(p.registrado_en)}</small></div></td>
                  <td><div className="riccati-s2-actions">
                    {!anulado && <button type="button" className="riccati-s2-icon-action" title="Corregir pago" aria-label={`Corregir pago del ${fechaCorta(p.fecha_pago)}`} onClick={() => abrir("corregir", p)}><Pencil size={16}/></button>}
                    {!anulado && <button type="button" className="riccati-s2-icon-action finanzas-accion-peligro" title="Anular pago" aria-label={`Anular pago del ${fechaCorta(p.fecha_pago)}`} onClick={() => abrir("anular", p)}><Ban size={16}/></button>}
                    {p.correcciones > 0 && <button type="button" className="riccati-s2-icon-action" title="Historial del pago" aria-label={`Historial del pago del ${fechaCorta(p.fecha_pago)}`} onClick={() => abrir("historial-pago", p)}><History size={16}/></button>}
                  </div></td>
                </tr>;
              })}
            </tbody></table></div>}
          {pagos.length > 0 && <footer className="bitacora-paginacion"><span>{pagos.length} pago(s) registrado(s) · los anulados se conservan y no cuentan para el saldo</span></footer>}
        </section>
      </>}

      {modal === "monto" && <ModalMonto finanzas={finanzas} tienePagos={pagos.length > 0} proyecto={datos?.proyecto} guardando={guardando} error={errorModal} aviso={aviso} onEditar={() => setAviso("")} onCerrar={cerrar}
        onGuardar={form => ejecutar(() => guardarMontoAcordado(idSeleccionado, form))}/>}
      {(modal === "pago" || modal === "corregir") && finanzas && <ModalPago pago={modal === "corregir" ? pagoActivo : null} finanzas={finanzas} resumen={resumen} guardando={guardando} error={errorModal} aviso={aviso} onEditar={() => setAviso("")} onCerrar={cerrar}
        onGuardar={form => ejecutar(() => modal === "corregir" ? corregirPago(pagoActivo.id_pago, form) : registrarPago(idSeleccionado, form))}/>}
      {modal === "anular" && pagoActivo && <ModalAnular pago={pagoActivo} moneda={moneda} guardando={guardando} error={errorModal} onCerrar={cerrar}
        onGuardar={justificacion => ejecutar(() => anularPago(pagoActivo.id_pago, justificacion))}/>}
      {modal === "historial-pago" && pagoActivo && <ModalHistorialPago pago={pagoActivo} moneda={moneda} onCerrar={cerrar}/>}
      {modal === "historial-monto" && <ModalHistorialMonto cambios={datos.cambios_monto} onCerrar={cerrar}/>}
    </div>
  </RiccatiLayout>;
}
