import React, { useState } from "react";
import { createRoot } from "react-dom/client";

import "./style.css";

/* =========================================================
   DONNÉES DE DÉMONSTRATION
   ========================================================= */

const pokemon = [
  {
    name: "Pikachu",
    level: 12,
    hp: 42,
    maxHp: 50,
    type: "ÉLECTRIK",
    sprite: "⚡",
  },
  {
    name: "Salamèche",
    level: 10,
    hp: 31,
    maxHp: 40,
    type: "FEU",
    sprite: "🔥",
  },
];

const players = [
  {
    name: "Gabriel",
    character: "Dresseur",
    level: 12,
    hp: 72,
    maxHp: 80,
    pokemon: "Pikachu",
    status: "En exploration",
  },
  {
    name: "Léo",
    character: "Rival",
    level: 11,
    hp: 61,
    maxHp: 75,
    pokemon: "Salamèche",
    status: "Combat",
  },
];

/* =========================================================
   HEADER
   ========================================================= */

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="logo">
        <div className="logo-ball">
          <span />
        </div>

        <div className="logo-text">
          <strong>POKÉMON JDR</strong>
          <small>GÉNÉRATION I</small>
        </div>
      </div>

      <nav className="main-nav">
        <button
          className={
            mode === "player"
              ? "nav-button active"
              : "nav-button"
          }
          onClick={() => setMode("player")}
        >
          JOUEUR
        </button>

        <button
          className={
            mode === "mj"
              ? "nav-button active mj-button"
              : "nav-button mj-button"
          }
          onClick={() => setMode("mj")}
        >
          MJ
        </button>
      </nav>
    </header>
  );
}

/* =========================================================
   BARRE DE PV
   ========================================================= */

function HpBar({ hp, maxHp }) {
  const percentage = Math.max(
    0,
    Math.min(100, (hp / maxHp) * 100)
  );

  return (
    <div className="hp-container">
      <div className="hp-label">
        <span>PV</span>

        <span>
          {hp} / {maxHp}
        </span>
      </div>

      <div className="hp-bar">
        <div
          className="hp-fill"
          style={{
            width: `${percentage}%`,
          }}
        />
      </div>
    </div>
  );
}

/* =========================================================
   INTERFACE JOUEUR
   ========================================================= */

function PlayerInterface() {
  const [selectedPokemon, setSelectedPokemon] = useState(0);

  const [message, setMessage] = useState(
    "Une nouvelle aventure commence..."
  );

  const currentPokemon =
    pokemon[selectedPokemon];

  return (
    <main className="screen">
      <div className="player-layout">
        {/* -----------------------------------------------
            DRESSEUR
        ------------------------------------------------ */}

        <section className="panel player-card">
          <div className="panel-title">
            <span>DRESSEUR</span>

            <span className="badge blue">
              LV. 12
            </span>
          </div>

          <div className="character">
            <div className="character-sprite">
              🧢
            </div>

            <div>
              <h1>Gabriel</h1>

              <p className="muted">
                Dresseur Pokémon
              </p>
            </div>
          </div>

          <div className="stat-row">
            <span>PV</span>

            <strong>80 / 80</strong>
          </div>

          <div className="xp-bar">
            <div
              style={{
                width: "68%",
              }}
            />
          </div>

          <div className="stat-grid">
            <div>
              <small>ARGENT</small>

              <strong>₽ 2 450</strong>
            </div>

            <div>
              <small>BADGES</small>

              <strong>2 / 8</strong>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------
            ÉQUIPE
        ------------------------------------------------ */}

        <section className="panel pokemon-panel">
          <div className="panel-title">
            <span>ÉQUIPE</span>

            <span className="badge red">
              2 / 6
            </span>
          </div>

          <div className="pokemon-list">
            {pokemon.map((p, index) => (
              <button
                key={p.name}
                className={
                  selectedPokemon === index
                    ? "pokemon-row selected"
                    : "pokemon-row"
                }
                onClick={() =>
                  setSelectedPokemon(index)
                }
              >
                <span className="pokemon-icon">
                  {p.sprite}
                </span>

                <span className="pokemon-info">
                  <strong>{p.name}</strong>

                  <small>
                    NIVEAU {p.level}
                  </small>
                </span>

                <span className="pokemon-type">
                  {p.type}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* -----------------------------------------------
            POKEMON ACTIF
        ------------------------------------------------ */}

        <section className="panel active-pokemon">
          <div className="panel-title">
            <span>POKÉMON ACTIF</span>
          </div>

          <div className="pokemon-display">
            <div className="big-sprite">
              {currentPokemon.sprite}
            </div>

            <div className="pokemon-details">
              <h2>{currentPokemon.name}</h2>

              <p>
                Niveau {currentPokemon.level}
              </p>

              <HpBar
                hp={currentPokemon.hp}
                maxHp={currentPokemon.maxHp}
              />

              <div className="type-pill">
                {currentPokemon.type}
              </div>
            </div>
          </div>
        </section>

        {/* -----------------------------------------------
            JOURNAL
        ------------------------------------------------ */}

        <section className="panel adventure-panel">
          <div className="panel-title">
            <span>JOURNAL D'AVENTURE</span>
          </div>

          <div className="story-box">
            <div className="story-icon">
              !
            </div>

            <div>
              <h3>Route 1</h3>

              <p>
                Le chemin s'étend devant toi.
                De hautes herbes bougent
                légèrement au loin...
              </p>
            </div>
          </div>

          <div className="action-grid">
            <button
              onClick={() =>
                setMessage(
                  "Tu avances prudemment dans les hautes herbes."
                )
              }
            >
              EXPLORER
            </button>

            <button
              onClick={() =>
                setMessage(
                  "Tu regardes attentivement autour de toi."
                )
              }
            >
              OBSERVER
            </button>

            <button
              onClick={() =>
                setMessage(
                  "Tu installes ton campement."
                )
              }
            >
              CAMPER
            </button>

            <button
              onClick={() =>
                setMessage(
                  "Tu consultes ton inventaire."
                )
              }
            >
              SAC
            </button>
          </div>

          <div className="message-box">
            {message}
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   CARTE MJ
   ========================================================= */

function Map() {
  return (
    <div className="map">
      <div className="map-grid" />

      <div className="map-title">
        CARTE — KANTO
      </div>

      <div className="map-route route-1">
        ROUTE 1
      </div>

      <div className="map-route route-2">
        ROUTE 2
      </div>

      <div className="map-city pallet">
        <span>PALLET</span>
        <small>VILLE</small>
      </div>

      <div className="map-city viridian">
        <span>VIRIDIAN</span>
        <small>VILLE</small>
      </div>

      <div className="map-city pewter">
        <span>PEWTER</span>
        <small>VILLE</small>
      </div>

      <div className="map-player">
        ★
      </div>

      <div className="map-npc npc-1">
        ●
      </div>

      <div className="map-npc npc-2">
        ●
      </div>

      <div className="map-npc npc-3">
        ●
      </div>
    </div>
  );
}

/* =========================================================
   INTERFACE MJ
   ========================================================= */

function MasterInterface() {
  const [selectedPlayer, setSelectedPlayer] =
    useState(0);

  const [event, setEvent] = useState("");

  const player =
    players[selectedPlayer];

  return (
    <main className="screen">
      <div className="mj-layout">
        {/* -----------------------------------------------
            SIDEBAR MJ
        ------------------------------------------------ */}

        <aside className="panel mj-sidebar">
          <div className="panel-title">
            <span>JOUEURS</span>

            <span className="badge purple">
              {players.length}
            </span>
          </div>

          {players.map((p, index) => (
            <button
              key={p.name}
              className={
                selectedPlayer === index
                  ? "mj-player selected"
                  : "mj-player"
              }
              onClick={() =>
                setSelectedPlayer(index)
              }
            >
              <span className="avatar">
                👤
              </span>

              <span>
                <strong>{p.name}</strong>

                <small>
                  {p.status}
                </small>
              </span>
            </button>
          ))}

          <div className="separator" />

          <div className="panel-title">
            <span>OUTILS MJ</span>
          </div>

          <button
            className="tool-button"
            onClick={() =>
              setEvent(
                "Un combat sauvage a été créé."
              )
            }
          >
            ⚔ COMBAT
          </button>

          <button
            className="tool-button"
            onClick={() =>
              setEvent(
                "Un PNJ apparaît sur la route."
              )
            }
          >
            👤 PNJ
          </button>

          <button
            className="tool-button"
            onClick={() =>
              setEvent(
                "Un objet apparaît sur la carte."
              )
            }
          >
            🎁 OBJET
          </button>

          <button
            className="tool-button"
            onClick={() =>
              setEvent(
                "Le temps avance d'une heure."
              )
            }
          >
            ⏱ TEMPS
          </button>

          {event && (
            <div className="event-message">
              {event}
            </div>
          )}
        </aside>

        {/* -----------------------------------------------
            ZONE PRINCIPALE MJ
        ------------------------------------------------ */}

        <section className="mj-main">
          <div className="mj-header panel">
            <div>
              <span className="eyebrow">
                SESSION ACTIVE
              </span>

              <h1>
                Aventure à Kanto
              </h1>
            </div>

            <div className="session-info">
              <span>JOUR 3</span>

              <span>14:32</span>

              <span className="live">
                ● LIVE
              </span>
            </div>
          </div>

          {/* LA CARTE EST UNIQUEMENT ICI,
              DONC UNIQUEMENT CÔTÉ MJ */}

          <Map />

          <div className="mj-bottom">
            {/* -----------------------------------------
                JOUEUR SÉLECTIONNÉ
            ------------------------------------------ */}

            <section className="panel">
              <div className="panel-title">
                <span>
                  JOUEUR SÉLECTIONNÉ
                </span>
              </div>

              <div className="selected-player">
                <div className="avatar big">
                  👤
                </div>

                <div className="selected-player-info">
                  <h2>
                    {player.name}
                  </h2>

                  <p>
                    {player.character}
                  </p>

                  <HpBar
                    hp={player.hp}
                    maxHp={player.maxHp}
                  />
                </div>
              </div>
            </section>

            {/* -----------------------------------------
                JOURNAL MJ
            ------------------------------------------ */}

            <section className="panel">
              <div className="panel-title">
                <span>
                  ÉVÉNEMENTS
                </span>
              </div>

              <div className="event-log">
                <p>
                  <span>14:31</span>

                  Gabriel entre sur la
                  Route 1.
                </p>

                <p>
                  <span>14:28</span>

                  Un Pokémon sauvage
                  est apparu.
                </p>

                <p>
                  <span>14:20</span>

                  Le groupe quitte
                  Bourg Palette.
                </p>
              </div>
            </section>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   APPLICATION
   ========================================================= */

function App() {
  const [mode, setMode] =
    useState("player");

  return (
    <>
      <Header
        mode={mode}
        setMode={setMode}
      />

      {mode === "mj" ? (
        <MasterInterface />
      ) : (
        <PlayerInterface />
      )}

      <footer>
        <span>
          POKÉMON JDR
        </span>

        <span>
          Prototype — Génération I
        </span>
      </footer>
    </>
  );
}

/* =========================================================
   RENDU REACT
   ========================================================= */

createRoot(
  document.getElementById("root")
).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);