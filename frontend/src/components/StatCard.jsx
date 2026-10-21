import { Building2, CheckCircle2, CirclePause, CirclePlay, ContactRound, FolderKanban, Layers3, ShieldCheck, UserRoundCheck, UserRoundX, UsersRound } from "lucide-react";

const icons = [
 [/EN CURSO/, CirclePlay], [/SUSPENDIDOS/, CirclePause], [/FINALIZADOS/, CheckCircle2],
 [/ADMINISTRADORES/, ShieldCheck], [/COLABORADORES/, UsersRound], [/CONTACTOS/, ContactRound],
 [/INACTIVOS/, UserRoundX], [/ACTIVOS/, UserRoundCheck], [/USUARIOS/, UsersRound], [/CLIENTES/, Building2], [/PROYECTOS/, FolderKanban],
];
export default function StatCard({ etiqueta, valor, icono, pie, clasePie = "", className = "" }) {
 const label = String(etiqueta).toLocaleLowerCase("es");
 const Icon = icons.find(([pattern]) => pattern.test(String(etiqueta).toUpperCase()))?.[1] || Layers3;
 const tone = clasePie.includes("green") ? "success" : /INACTIVOS|SUSPENDIDOS/.test(etiqueta) ? "warning" : "primary";
 return <div className={"riccati-stat-card rp-stat-" + tone + " " + className}>
  <div className="riccati-stat-header">
   <span className="riccati-stat-label">{label.charAt(0).toUpperCase() + label.slice(1)}</span>
   <span className="riccati-stat-icon" aria-hidden="true">{icono && typeof icono !== "string" ? icono : <Icon size={23} strokeWidth={1.7}/>}</span>
  </div>
  <strong className="riccati-stat-number">{valor}</strong>
  {pie && <div className="riccati-stat-footer">{pie}</div>}
 </div>;
}
