import {
  Building2,
  CheckCircle2,
  CirclePause,
  CirclePlay,
  ContactRound,
  FolderKanban,
  Layers3,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";

const iconosPorEtiqueta = [
  [/EN CURSO/, CirclePlay],
  [/SUSPENDIDOS/, CirclePause],
  [/FINALIZADOS/, CheckCircle2],
  [/ADMINISTRADORES/, ShieldCheck],
  [/COLABORADORES/, UsersRound],
  [/CONTACTOS/, ContactRound],
  [/USUARIOS ACTIVOS/, UserRoundCheck],
  [/USUARIOS/, UsersRound],
  [/CLIENTES/, Building2],
  [/PROYECTOS/, FolderKanban],
  [/MÓDULO|MODULO/, Layers3],
];

function StatCard({
  etiqueta,
  valor,
  icono,
  pie,
  clasePie = "",
  className = "",
}) {
  const Icono = iconosPorEtiqueta.find(([exp]) =>
    exp.test(String(etiqueta).toUpperCase())
  )?.[1];

  return (
    <div className={`riccati-stat-card ${className}`}>
      <div className="riccati-stat-header">
        <span className="riccati-stat-label">{etiqueta}</span>
        <span className="riccati-stat-icon" aria-hidden="true">
          {Icono ? <Icono size={22} strokeWidth={2} /> : icono}
        </span>
      </div>
      <strong className="riccati-stat-number">{valor}</strong>
      <div className={`riccati-stat-footer ${clasePie}`}>{pie}</div>
    </div>
  );
}

export default StatCard;