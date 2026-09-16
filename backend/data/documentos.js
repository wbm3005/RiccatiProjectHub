const documentos = [
  {
    id: 1,
    projectId: "PRY-001",
    nombre: "Contrato Proyecto Los Robles",
    tipo: "Contrato",
    formato: "PDF",
    version: 1,
    almacenamiento: "Local",
    archivo: "contrato-los-robles.pdf",
    usuario: "Administrador Riccati",
    fecha: "2026-08-01",
    estado: "Activo"
  },
  {
    id: 2,
    projectId: "PRY-001",
    nombre: "Fotografía del sitio",
    tipo: "Fotografía del sitio",
    formato: "JPG",
    version: 1,
    almacenamiento: "Local",
    archivo: "sitio-los-robles.jpg",
    usuario: "Colaborador Riccati",
    fecha: "2026-08-03",
    estado: "Activo"
  },
  {
    id: 3,
    projectId: "PRY-002",
    nombre: "Plano arquitectónico general",
    tipo: "Plano de catastro",
    formato: "CAD",
    version: 1,
    almacenamiento: "Externo",
    url: "https://drive.google.com/ejemplo-plano",
    usuario: "Administrador Riccati",
    fecha: "2026-08-05",
    estado: "Activo"
  },
  {
    id: 4,
    projectId: "PRY-003",
    nombre: "Informe técnico preliminar",
    tipo: "Informe",
    formato: "DOCX",
    version: 2,
    almacenamiento: "Local",
    archivo: "informe-tecnico-v2.docx",
    usuario: "Colaborador Riccati",
    fecha: "2026-08-09",
    estado: "Activo"
  }
];

module.exports = documentos;