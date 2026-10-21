/** A page heading describes the task; operational status belongs to real data. */
export default function PageHeader({ titulo, descripcion, acciones = null }) {
 return <header className="riccati-topbar">
  <div><h1>{titulo}</h1>{descripcion && <p>{descripcion}</p>}</div>
  {acciones && <div className="riccati-topbar-actions">{acciones}</div>}
 </header>;
}
