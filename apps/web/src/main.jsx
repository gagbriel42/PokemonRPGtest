import React from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

function App() {
  return (
    <main>
      <h1>Pokémon JDR</h1>

      <p>
        Prototype de jeu de rôle Pokémon — Génération 1
      </p>

      <section>
        <h2>Projet</h2>
        <p>Le site est en cours de construction.</p>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
