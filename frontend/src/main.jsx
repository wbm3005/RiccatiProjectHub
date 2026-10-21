import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./vendor/sneat/core.css";
import "./vendor/sneat/page-auth.css";

import "./styles/riccati.css";
import "./styles/animations.css";


import App from "./App.jsx";
import "./styles/sneat-riccati.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);