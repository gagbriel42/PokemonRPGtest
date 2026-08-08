import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const pokemonParty = [
  {
    name: "Bulbizarre",
    level: 8,
    hp: 31,
    maxHp: 36,
    type: "PLANTE",
    color: "green",
    sprite: "🌱",
  },
  {
    name: "Salamèche",
    level: 10,
    hp: 42,
    maxHp: 45,
    type: "FEU",
    color: "red",
    sprite: "🔥",
  },
  {
    name: "Carapuce",
    level: 7,
    hp: 28,
    maxHp: 34,
    type: "EAU",
    color: "blue",
    sprite: "💧",
  },
];

const mapTiles = [
  "wwwwwwwwwwwwwwwwwwww",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggttttttggggggggw",
  "wggggtwwwwtggggggggw",
  "wggggtwwwwtggggggggw",
  "wggggttttttggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wggggggggggggggggggw",
  "wwwwwwwwwwwwwwwwwwww",
];

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <span className="brand-ball">●</span>
        <div>
          <strong>POKÉMON RPG</strong>
          <small>GÉNÉRATION I — JDR</small>
        </div>
      </div>

      <div className="mode-switch">
        <button
          className={mode === "player" ? "active" : ""}
          onClick={() => setMode("player")}
        >
          JOUEUR
        </button>

        <button
          className={mode === "gm" ? "active gm" : ""}
          onClick={() => setMode("gm")}
        >
          MJ
        </button>
      </div>
    </header>
  );
}

function PokemonCard({ pokemon }) {
  const hpPercent = Math.round((pokemon.hp / pokemon.maxHp) * 100);

  return (
    <div className="pokemon-card">
      <div className={`pokemon-sprite ${pokemon.color}`}>
        {pokemon.sprite}
      </div>

      <div className="pokemon-info">
        <div className="pokemon-name">
          <strong>{pokemon.name}</strong>
          <span>Lv.{pokemon.level}</span>
        </div>

        <div className="type-badge">{pokemon.type}</div>

        <div className="hp-row">
          <span>PV</span>
          <div className="hp-bar">
            <div
              className={`hp-fill ${pokemon.color}`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        <small>
          {pokemon.hp} / {pokemon.maxHp}
        </small>
      </div>
    </div>
  );
}

function PlayerInterface() {
  return (
    <main className="game-screen player-screen">
      <section className="player-hero">
        <div className="location-label">
          <span>LOCALISATION</span>
          <strong>BOURG PALETTE</strong>
        </div>

        <div className="world-preview">
          <div className="tree tree-1">🌳</div>
          <div className="tree tree-2">🌳</div>
          <div className="tree tree-3">🌲</div>

          <div className="player-character">
            <div className="character-head">🙂</div>
            <div className="character-body">🧍</div>
          </div>

          <div className="grass grass-1">🌿</div>
          <div className="grass grass-2">🌿</div>
          <div className="grass grass-3">🌿</div>

          <div className="npc npc-1">🧑</div>
          <div className="npc npc-2">👩</div>
        </div>

        <div className="dialog-box">
          <div className="dialog-name">PROF. CHEN</div>
          <p>
            Bienvenue dans le monde des Pokémon !
            <br />
            Ton aventure commence ici...
          </p>
          <span className="dialog-arrow">▼</span>
        </div>
      </section>

      <aside className="player-sidebar">
        <div className="trainer-card panel">
          <div className="panel-title">DRESSEUR</div>

          <div className="trainer-content">
            <div className="trainer-avatar">🧢</div>

            <div>
              <h2>GABRIEL</h2>
              <span>BADGES : 2</span>
              <span>ARGENT : ₽ 3 240</span>
            </div>
          </div>

          <div className="xp-label">
            <span>EXP</span>
            <span>72%</span>
          </div>

          <div className="xp-bar">
            <div style={{ width: "72%" }} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">ÉQUIPE</div>

          <div className="party-list">
            {pokemonParty.map((pokemon) => (
              <PokemonCard key={pokemon.name} pokemon={pokemon} />
            ))}
          </div>
        </div>

        <div className="player-actions panel">
          <div className="panel-title">ACTIONS</div>

          <button>🎒 SAC</button>
          <button>👥 ÉQUIPE</button>
          <button>📜 QUÊTES</button>
          <button>💾 SAUVEGARDER</button>
        </div>
      </aside>
    </main>
  );
}

function MapTile({ tile }) {
  const classes = {
    w: "water",
    g: "grass",
    t: "town",
  };

  return <div className={`map-tile ${classes[tile]}`} />;
}

function GameMap() {
  return (
    <div className="map-wrapper">
      <div className="map-header">
        <strong>CARTE DU MONDE</strong>
        <span>ZONE ACTIVE : BOURG PALETTE</span>
      </div>

      <div className="game-map">
        {mapTiles.flatMap((row, rowIndex) =>
          [...row].map((tile, columnIndex) => (
            <MapTile
              key={`${rowIndex}-${columnIndex}`}
              tile={tile}
            />
          ))
        )}

        <div className="map-marker player-marker">
          🧍
        </div>

        <div className="map-marker npc-marker">
          !
        </div>

        <div className="map-marker event-marker">
          ★
        </div>
      </div>

      <div className="map-legend">
        <span><i className="legend player" /> Joueur</span>
        <span><i className="legend npc" /> PNJ</span>
        <span><i className="legend event" /> Événement</span>
        <span><i className="legend zone" /> Zone</span>
      </div>
    </div>
  );
}

function GMInterface() {
  return (
    <main className="gm-screen">
      <section className="gm-main">
        <div className="gm-heading">
          <div>
            <span className="eyebrow">TABLEAU DE MAÎTRE DU JEU</span>
            <h1>ROUTE 01</h1>
          </div>

          <div className="session-status">
            <span className="status-dot" />
            SESSION ACTIVE
          </div>
        </div>

        <GameMap />

        <div className="gm-map-actions">
          <button>＋ AJOUTER PNJ</button>
          <button>＋ AJOUTER ÉVÉNEMENT</button>
          <button>⚔ LANCER COMBAT</button>
          <button>⌖ TÉLÉPORTER</button>
        </div>
      </section>

      <aside className="gm-sidebar">
        <div className="panel">
          <div className="panel-title">JOUEURS CONNECTÉS</div>

          <div className="player-row">
            <div className="online-avatar">🧢</div>
            <div>
              <strong>Gabriel</strong>
              <small>Route 01</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>

        <div className="panel">
          <div className="panel-title">ÉVÉNEMENTS</div>

          <div className="event-row active-event">
            <span className="event-icon">★</span>
            <div>
              <strong>Combat sauvage</strong>
              <small>Herbes hautes</small>
            </div>
          </div>

          <div className="event-row">
            <span className="event-icon">!</span>
            <div>
              <strong>Rencontre PNJ</strong>
              <small>Près de la sortie</small>
            </div>
          </div>

          <div className="event-row">
            <span className="event-icon">?</span>
            <div>
              <strong>Objet caché</strong>
              <small>Forêt nord</small>
            </div>
          </div>
        </div>

        <div className="panel gm-controls">
          <div className="panel-title">CONTRÔLE DE SESSION</div>

          <button>⏸ PAUSE LA PARTIE</button>
          <button>🎲 LANCER UN DÉ</button>
          <button>⚔ COMBAT</button>
          <button>📢 MESSAGE GLOBAL</button>
        </div>

        <div className="panel gm-log">
          <div className="panel-title">JOURNAL</div>

          <p><b>18:04</b> Gabriel entre sur Route 01.</p>
          <p><b>18:06</b> Événement déclenché.</p>
          <p><b>18:08</b> Pokémon sauvage détecté.</p>
        </div>
      </aside>
    </main>
  );
}

function App() {
  const [mode, setMode] = useState("player");

  return (
    <>
      <Header mode={mode} setMode={setMode} />

      {mode === "player" ? (
        <PlayerInterface />
      ) : (
        <GMInterface />
      )}
    </>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);