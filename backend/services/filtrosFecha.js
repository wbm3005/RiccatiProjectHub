"use strict";

// Validación compartida de rangos de fechas AAAA-MM-DD para los filtros
// de Bitácora (HU-M04-06) y Documentos (HU-M05-05).
const texto = (v) => (typeof v === "string" ? v.trim() : "");

function fechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
  const [a, m, d] = valor.split("-").map(Number);
  const fecha = new Date(Date.UTC(a, m - 1, d));
  return fecha.getUTCFullYear() === a && fecha.getUTCMonth() === m - 1 && fecha.getUTCDate() === d && a >= 2000 && a <= 2100;
}

function analizarFiltrosFecha(desdeEntrada, hastaEntrada) {
  const desde = texto(desdeEntrada) || null;
  const hasta = texto(hastaEntrada) || null;
  if ((desdeEntrada !== undefined && typeof desdeEntrada !== "string") || (hastaEntrada !== undefined && typeof hastaEntrada !== "string")) {
    return { error: "El rango de fechas no es válido." };
  }
  if (desde && !fechaValida(desde)) return { error: "La fecha inicial no es válida (formato AAAA-MM-DD)." };
  if (hasta && !fechaValida(hasta)) return { error: "La fecha final no es válida (formato AAAA-MM-DD)." };
  if (desde && hasta && desde > hasta) return { error: "La fecha inicial no puede ser posterior a la fecha final." };
  return { desde, hasta };
}

module.exports = { analizarFiltrosFecha, fechaValida };
