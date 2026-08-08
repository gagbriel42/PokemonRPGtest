import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const party = [
  {
    name: "Bulbizarre",
    level: 12,
    hp: 31,
    maxHp: 35,
    type: "PLANTE",
    icon: "🌱",
  },
  {
    name: "Salamèche",
    level: 10,
    hp: 24,
    maxHp: 30,
    type: "FEU",
    icon: "🔥",
  },
  {
    name: "Carapuce",
    level: 11,
    hp: 29,
    maxHp: 32,
    type: "EAU",
    icon: "💧",
  },
  {
    name: "Pikachu",
    level: 9,
    hp: 18,
    maxHp: 25,
    type: "ÉLECTRIK",
    icon: "⚡",
  },
];

const inventory = [
  { name: "Poké Ball", quantity: 12, icon: "🔴" },
  { name: "Potion", quantity: 5, icon: "🧪" },
  { name: "Antidote", quantity: 3, icon: "💊" },
  { name: "Rappel", quantity: 2, icon: "✨" },
];

const mapCells = [
  "grass",
  "grass",
  "grass",
  "tree",
  "tree",
  "grass",
  "grass",
  "water",
  "water",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "tree",
  "path",
  "player",
  "path",
  "grass",
  "tree",
  "path",
  "path",
  "path",
  "npc",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "grass",
  "grass",
  "water",
  "water",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "tree",
  "tree",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "grass",
  "grass",
  "water",
  "water",
  "water",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "grass",
  "tree",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "grass",
  "grass",
  "npc",
  "grass",
  "grass",
  "tree",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "water",
  "water",
  "grass",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "water",
  "water",
  "water",
  "grass",
  "grass",
  "grass",
  "tree",
  "tree",
  "grass",
  "path",
  "path",
  "grass",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "grass",
  "path",
  "path",
  "path",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
  "grass",
  "grass",
  "tree",
  "grass",
  "grass",
];

function App() {
  const [mode, setMode] = useState("player");
  const [activeTab, setActiveTab] = useState("home");
  const [battle, setBattle] = useState(false);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-ball">
            <span />
          </div>

          <div>
            <strong>POKÉMON JDR</strong>
            <small>CHRONIQUES DE KANTO</small>
          </div>
        </div>

        <div className="mode-switch">
          <button
            className={mode === "player" ? "active" : ""}
            onClick={() => setMode("player")}
          >
            🎮 JOUEUR
          </button>

          <button
            className={mode === "gm" ? "active gm" : ""}
            onClick={() => setMode("gm")}
          >
            🎲 MJ
          </button>
        </div>

        <div className="top-status">
          <span className="online-dot" />
          SESSION ACTIVE
        </div>
      </header>

      {mode === "player" ? (
        <PlayerInterface
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          battle={battle}
          setBattle={setBattle}
        />
      ) : (
        <GMInterface />
      )}
    </div>
  );
}

function PlayerInterface({ activeTab, setActiveTab, battle, setBattle }) {
  const tabs = [
    ["home", "⌂", "Accueil"],
    ["team", "◈", "Équipe"],
    ["bag", "▣", "Sac"],
    ["quests", "★", "Quêtes"],
  ];

  return (
    <div className="interface-layout">
      <aside className="sidebar">
        <div className="trainer-card">
          <div className="trainer-avatar">🧢</div>

          <div>
            <span className="label">DRESSEUR</span>
            <h3>GABRIEL</h3>
            <span className="trainer-class">AVENTURIER</span>
          </div>
        </div>

        <nav>
          {tabs.map(([id, icon, label]) => (
            <button
              key={id}
              className={activeTab === id ? "nav-item selected" : "nav-item"}
              onClick={() => setActiveTab(id)}
            >
              <span>{icon}</span>
              {label}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="money">
            <span>₽</span>
            <div>
              <small>POKÉDOLLARS</small>
              <strong>12 450</strong>
            </div>
          </div>

          <button className="save-button">💾 SAUVEGARDER</button>
        </div>
      </aside>

      <main className="main-content">
        <div className="pixel-breadcrumb">
          KANTO <span>›</span> BOURG PALETTE <span>›</span> ROUTE 1
        </div>

        {activeTab === "home" && (
          <PlayerHome setBattle={setBattle} />
        )}

        {activeTab === "team" && <TeamPanel />}

        {activeTab === "bag" && <InventoryPanel />}

        {activeTab === "quests" && <QuestPanel />}
      </main>

      <aside className="right-panel">
        <div className="panel-title">
          <span>ACTIVITÉ</span>
          <span className="live-badge">LIVE</span>
        </div>

        <div className="activity-list">
          <Activity
            color="red"
            title="Combat terminé"
            text="Tu as vaincu Rattata sauvage."
            time="Il y a 2 min"
          />

          <Activity
            color="yellow"
            title="Objet obtenu"
            text="Tu as trouvé une Potion."
            time="Il y a 8 min"
          />

          <Activity
            color="blue"
            title="Nouvelle quête"
            text="Le professeur Chen t'attend."
            time="Il y a 12 min"
          />
        </div>

        <div className="next-objective">
          <span className="label">PROCHAIN OBJECTIF</span>
          <h3>REJOINDRE LE PROFESSEUR CHEN</h3>
          <p>Retourne au laboratoire du Bourg Palette.</p>

          <div className="progress-row">
            <span>PROGRESSION</span>
            <strong>2 / 3</strong>
          </div>

          <div className="progress-bar">
            <div style={{ width: "66%" }} />
          </div>
        </div>
      </aside>

      {battle && (
        <BattleOverlay onClose={() => setBattle(false)} />
      )}
    </div>
  );
}

function PlayerHome({ setBattle }) {
  return (
    <>
      <section className="hero-panel">
        <div>
          <span className="eyebrow">AVENTURE EN COURS</span>
          <h1>ROUTE 1</h1>
          <p>
            Une nouvelle journée commence dans la région de Kanto.
          </p>

          <div className="hero-actions">
            <button className="pixel-button primary" onClick={() => setBattle(true)}>
              ⚔ ENTRER EN COMBAT
            </button>

            <button className="pixel-button">
              🗺 CONSULTER LA ZONE
            </button>
          </div>
        </div>

        <div className="hero-pokeball">◉</div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <span className="eyebrow">TON ÉQUIPE</span>
            <h2>POKÉMON</h2>
          </div>

          <button className="text-button">VOIR TOUT →</button>
        </div>

        <div className="pokemon-grid">
          {party.map((pokemon) => (
            <PokemonCard pokemon={pokemon} key={pokemon.name} />
          ))}
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="quest-card">
          <span className="eyebrow">QUÊTE PRINCIPALE</span>
          <h2>LE PROFESSEUR CHEN</h2>
          <p>
            Le professeur souhaite te confier ton premier véritable Pokémon.
          </p>

          <div className="quest-status">
            <span>OBJECTIF</span>
            <strong>2 / 3</strong>
          </div>

          <div className="progress-bar">
            <div style={{ width: "66%" }} />
          </div>
        </div>

        <div className="dice-card">
          <span className="eyebrow">JET DE DÉS</span>
          <div className="dice">20</div>
          <strong>Dernier jet : 17</strong>
          <small>Perception réussie</small>
        </div>
      </section>
    </>
  );
}

function PokemonCard({ pokemon }) {
  const percentage = (pokemon.hp / pokemon.maxHp) * 100;

  return (
    <article className="pokemon-card">
      <div className={`pokemon-type type-${pokemon.type.toLowerCase()}`}>
        {pokemon.type}
      </div>

      <div className="pokemon-icon">{pokemon.icon}</div>

      <div className="pokemon-info">
        <div className="pokemon-name-row">
          <strong>{pokemon.name}</strong>
          <span>Lv.{pokemon.level}</span>
        </div>

        <div className="hp-label">
          <span>PV</span>
          <span>
            {pokemon.hp}/{pokemon.maxHp}
          </span>
        </div>

        <div className="hp-bar">
          <div style={{ width: `${percentage}%` }} />
        </div>
      </div>
    </article>
  );
}

function TeamPanel() {
  return (
    <section>
      <PageTitle eyebrow="DOSSIER DU DRESSEUR" title="MON ÉQUIPE" />

      <div className="large-team-grid">
        {party.map((pokemon) => (
          <PokemonCard pokemon={pokemon} key={pokemon.name} />
        ))}
      </div>
    </section>
  );
}

function InventoryPanel() {
  return (
    <section>
      <PageTitle eyebrow="OBJETS DISPONIBLES" title="SAC" />

      <div className="inventory-grid">
        {inventory.map((item) => (
          <div className="inventory-item" key={item.name}>
            <span className="inventory-icon">{item.icon}</span>
            <div>
              <strong>{item.name}</strong>
              <small>Objet utilisable</small>
            </div>
            <b>x{item.quantity}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuestPanel() {
  return (
    <section>
      <PageTitle eyebrow="AVENTURE" title="QUÊTES" />

      <div className="quest-list">
        <div className="quest-row active">
          <span className="quest-icon">★</span>
          <div>
            <strong>Le professeur Chen</strong>
            <p>Rejoins le laboratoire du Bourg Palette.</p>
          </div>
          <span>2/3</span>
        </div>

        <div className="quest-row">
          <span className="quest-icon">○</span>
          <div>
            <strong>Route 1</strong>
            <p>Découvre les Pokémon sauvages de la zone.</p>
          </div>
          <span>1/5</span>
        </div>

        <div className="quest-row completed">
          <span className="quest-icon">✓</span>
          <div>
            <strong>Premier pas</strong>
            <p>Quitter le Bourg Palette.</p>
          </div>
          <span>TERMINÉ</span>
        </div>
      </div>
    </section>
  );
}

function GMInterface() {
  return (
    <div className="gm-layout">
      <aside className="gm-sidebar">
        <div className="gm-header">
          <span className="eyebrow">MAÎTRE DU JEU</span>
          <h2>PANNEAU MJ</h2>
        </div>

        <div className="session-box">
          <span>SESSION</span>
          <strong>CHRONIQUES DE KANTO</strong>
          <small>3 joueurs connectés</small>
        </div>

        <div className="gm-actions">
          <button className="gm-action active">🗺 CARTE</button>
          <button className="gm-action">👥 JOUEURS</button>
          <button className="gm-action">👹 RENCONTRES</button>
          <button className="gm-action">🎒 OBJETS</button>
          <button className="gm-action">📜 SCÉNARIOS</button>
        </div>

        <div className="gm-event">
          <span className="eyebrow">ÉVÉNEMENT</span>
          <h3>APPARITION SAUVAGE</h3>
          <p>Déclencher une rencontre sur la case sélectionnée.</p>
          <button>⚡ DÉCLENCHER</button>
        </div>
      </aside>

      <main className="gm-main">
        <div className="gm-toolbar">
          <div>
            <span className="eyebrow">CARTE MJ</span>
            <h1>ROUTE 1 — BOURG PALETTE</h1>
          </div>

          <div className="toolbar-buttons">
            <button>−</button>
            <span>100%</span>
            <button>+</button>
            <button>☰</button>
          </div>
        </div>

        <div className="map-wrapper">
          <div className="map">
            {mapCells.map((cell, index) => (
              <div className={`map-cell ${cell}`} key={index}>
                {cell === "tree" && <span>🌲</span>}
                {cell === "water" && <span>≈</span>}
                {cell === "player" && <span className="map-character">🧢</span>}
                {cell === "npc" && <span className="map-character npc-icon">🧑</span>}
              </div>
            ))}
          </div>

          <div className="map-coordinates">
            X: 14 &nbsp; Y: 08
          </div>
        </div>

        <div className="map-legend">
          <span><i className="legend-player" /> Joueur</span>
          <span><i className="legend-npc" /> PNJ</span>
          <span><i className="legend-wild" /> Zone sauvage</span>
          <span><i className="legend-event" /> Événement</span>
        </div>
      </main>

      <aside className="gm-right">
        <div className="panel-title">
          <span>SCÈNE ACTUELLE</span>
          <span className="live-badge">ACTIVE</span>
        </div>

        <div className="scene-card">
          <span className="eyebrow">ZONE</span>
          <h2>ROUTE 1</h2>
          <p>
            Une longue route herbeuse relie le Bourg Palette à Jadielle.
          </p>
        </div>

        <div className="players-online">
          <div className="panel-title">
            <span>JOUEURS</span>
            <span>3</span>
          </div>

          <GMPlayer name="Gabriel" icon="🧢" hp="35/35" />
          <GMPlayer name="Léo" icon="🧑" hp="27/30" />
          <GMPlayer name="Mia" icon="👩" hp="22/25" />
        </div>

        <div className="gm-log">
          <div className="panel-title">
            <span>JOURNAL MJ</span>
          </div>

          <p><b>15:02</b> Gabriel avance vers le nord.</p>
          <p><b>15:04</b> Léo ramasse une Poké Ball.</p>
          <p><b>15:06</b> Mia entre dans les hautes herbes.</p>
        </div>
      </aside>
    </div>
  );
}

function GMPlayer({ name, icon, hp }) {
  return (
    <div className="gm-player">
      <span className="gm-player-icon">{icon}</span>
      <div>
        <strong>{name}</strong>
        <small>En ligne</small>
      </div>
      <span className="gm-hp">{hp}</span>
    </div>
  );
}

function Activity({ color, title, text, time }) {
  return (
    <div className="activity">
      <span className={`activity-dot ${color}`} />
      <div>
        <strong>{title}</strong>
        <p>{text}</p>
        <small>{time}</small>
      </div>
    </div>
  );
}

function PageTitle({ eyebrow, title }) {
  return (
    <div className="page-title">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}</h1>
    </div>
  );
}

function BattleOverlay({ onClose }) {
  return (
    <div className="battle-overlay">
      <div className="battle-window">
        <button className="battle-close" onClick={onClose}>
          ×
        </button>

        <div className="battle-scene">
          <div className="battle-enemy">
            <span>RATTATA</span>
            <strong>Lv.7</strong>
            <div className="battle-hp">
              <div style={{ width: "62%" }} />
            </div>
          </div>

          <div className="battle-pokemon enemy">🐭</div>

          <div className="battle-pokemon player">🌱</div>

          <div className="battle-player">
            <span>BULBIZARRE</span>
            <strong>Lv.12</strong>
            <div className="battle-hp">
              <div style={{ width: "88%" }} />
            </div>
          </div>
        </div>

        <div className="battle-message">
          <strong>Un Rattata sauvage apparaît !</strong>
          <span>Que veux-tu faire ?</span>
        </div>

        <div className="battle-actions">
          <button>⚔ ATTAQUER</button>
          <button>🎒 SAC</button>
          <button>◈ POKÉMON</button>
          <button>🏃 FUITE</button>
        </div>
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);