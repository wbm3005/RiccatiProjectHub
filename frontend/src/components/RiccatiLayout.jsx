import Sidebar from "./Sidebar";

function RiccatiLayout({
  children,
  paginaActiva,
}) {
  return (
    <div className="riccati-app">

      <Sidebar
        paginaActiva={paginaActiva}
      />

      <main className="riccati-main">
        {children}
      </main>

    </div>
  );
}

export default RiccatiLayout;