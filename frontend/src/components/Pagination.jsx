export default function Pagination({ total, page, onChange, noun, pageSize = 10 }) {
 const pages = Math.max(1, Math.ceil(total / pageSize));
 const current = Math.min(page, pages);
 return <nav className="rp-pagination" aria-label={"Paginación de " + noun}>
  <span role="status">{total ? "Mostrando " + ((current-1)*pageSize+1) + "–" + Math.min(current*pageSize,total) + " de " + total + " " + noun : "0 resultados"}</span>
  <div><button type="button" className="riccati-button-secondary" disabled={current<=1} onClick={()=>onChange(current-1)} aria-label="Página anterior">Anterior</button><span>Página {current} de {pages}</span><button type="button" className="riccati-button-secondary" disabled={current>=pages} onClick={()=>onChange(current+1)} aria-label="Página siguiente">Siguiente</button></div>
 </nav>;
}
