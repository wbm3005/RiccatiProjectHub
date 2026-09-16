const pagos = [
  {
    id: 1,
    projectId: "PRY-001",
    montoAcordado: 3500000,
    monto: 1500000,
    metodo: "Transferencia bancaria",
    referencia: "TRX-00125",
    fecha: "2026-07-15",
    estado: "Válido",
    observaciones: "Primer pago del proyecto."
  },
  {
    id: 2,
    projectId: "PRY-001",
    montoAcordado: 3500000,
    monto: 1000000,
    metodo: "SINPE Móvil",
    referencia: "SINPE-45821",
    fecha: "2026-08-05",
    estado: "Válido",
    observaciones: "Segundo abono."
  },
  {
    id: 3,
    projectId: "PRY-002",
    montoAcordado: 2800000,
    monto: 800000,
    metodo: "Depósito bancario",
    referencia: "DEP-00215",
    fecha: "2026-08-08",
    estado: "Válido",
    observaciones: "Pago inicial."
  },
  {
    id: 4,
    projectId: "PRY-003",
    montoAcordado: 1800000,
    monto: 500000,
    metodo: "Efectivo",
    referencia: "REC-00045",
    fecha: "2026-07-20",
    estado: "Anulado",
    observaciones: "Pago anulado para demostración."
  }
];

module.exports = pagos;