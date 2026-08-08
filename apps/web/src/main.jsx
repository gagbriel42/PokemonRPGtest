import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const POKEAPI = "https://pokeapi.co/api/v2";

const pokemon = [
  {
    id: 25,
    name: "Pikachu",
    type: ["Électrik"],
    level: 18,
    hp: 52,
    maxHp: 52,
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/25.gif",
    fallback:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
  },
  {
    id: 4,
    name: "Salamèche",
    type: ["Feu"],
    level: 16,
    hp: 38,
    maxHp: 44,
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/4.gif",
    fallback:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png",
  },
  {
    id: 7,
    name: "Carapuce",
    type: ["Eau"],
    level: 15,
    hp: 41,
    maxHp: 45,
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/7.gif",
    fallback:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/7.png",
  },
];

const wildPokemon = [
  {
    id: 19,
    name: "Rattata",
    level: 8,
    hp: 21,
    maxHp: 21,
    type: "Normal",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/19.gif",
  },
  {
    id: 16,
    name: "Roucool",
    level: 7,
    hp: 19,
    maxHp: 19,
    type: "Normal / Vol",
    sprite:
      "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/16.gif",
  },
];

function Sprite({ src, fallback, alt }) {
  const [image, setImage] = useState(src);

  return (
    <img
      className="pokemon-sprite"
      src={image}
      alt={alt}
      onError={() => {
        if (fallback && image !== fallback) {
          setImage(fallback);
        }
      }}
    />
  );
}

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
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="logo">
        <span className="pokeball">●</span>
        <div>
          <strong>POKÉMON JDR</strong>
          <small>Génération I · RPG</small>
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
          🧙 MJ
        </button>
      </div>
    </header>
  );
}

function PlayerInterface() {
  const [activePokemon, setActivePokemon] = useState(pokemon[0]);

  const [log, setLog] = useState([
    "Bienvenue dans votre aventure.",
    "Vous êtes entré dans la Route 1.",
    "Un Pokémon sauvage pourrait apparaître...",
  ]);

  const [diceResult, setDiceResult] = useState(null);

  function rollDice(sides) {
    const result = Math.floor(Math.random() * sides) + 1;

    setDiceResult({
      sides,
      result,
    });

    setLog((previous) => [
      `Jet de D${sides} : ${result}`,
      ...previous,
    ]);
  }

  async function playCry() {
    try {
      const response = await fetch(
        `${POKEAPI}/pokemon/${activePokemon.id}`
      );

      const data = await response.json();

      if (data.cries?.latest) {
        new Audio(data.cries.latest).play();
      }
    } catch {
      console.log("Cri Pokémon indisponible.");
    }
  }

  return (
    <main className="game-layout">
      <section className="player-main">
        <div className="location-bar">
          <span>📍 LOCALISATION</span>
          <strong>ROUTE 1</strong>
          <small>Kanto · 16:42</small>
        </div>

        <div className="trainer-card">
          <div className="trainer-avatar">🧢</div>

          <div>
            <span>DRESSEUR</span>
            <strong>GABRIEL</strong>
            <small>Niveau 12 · 1 240 XP</small>
          </div>
        </div>

        <div className="battle-area">
          <div className="wild-side">
            <span className="battle-label">POKÉMON SAUVAGE</span>

            <Sprite
              src={wildPokemon[0].sprite}
              alt={wildPokemon[0].name}
            />

            <h2>{wildPokemon[0].name}</h2>

            <span>Niveau {wildPokemon[0].level}</span>

            <HpBar
              hp={wildPokemon[0].hp}
              maxHp={wildPokemon[0].maxHp}
            />
          </div>

          <div className="battle-vs">VS</div>

          <div className="player-side">
            <span className="battle-label">VOTRE POKÉMON</span>

            <Sprite
              src={activePokemon.sprite}
              fallback={activePokemon.fallback}
              alt={activePokemon.name}
            />

            <h2>{activePokemon.name}</h2>

            <span>Niveau {activePokemon.level}</span>

            <HpBar
              hp={activePokemon.hp}
              maxHp={activePokemon.maxHp}
            />
          </div>
        </div>

        <div className="actions">
          <button onClick={playCry}>🔊 CRI</button>
          <button onClick={() => rollDice(20)}>🎲 D20</button>
          <button onClick={() => rollDice(6)}>🎲 D6</button>
          <button>⚔️ ATTAQUER</button>
          <button>🎒 SAC</button>
          <button>🏃 FUIR</button>
        </div>

        {diceResult && (
          <div className="dice-result">
            🎲 D{diceResult.sides} → <strong>{diceResult.result}</strong>
          </div>
        )}

        <div className="pokemon-team">
          <h2>ÉQUIPE</h2>

          <div className="team-grid">
            {pokemon.map((poke) => (
              <button
                key={poke.id}
                className={
                  activePokemon.id === poke.id
                    ? "pokemon-card selected"
                    : "pokemon-card"
                }
                onClick={() => setActivePokemon(poke)}
              >
                <Sprite
                  src={poke.sprite}
                  fallback={poke.fallback}
                  alt={poke.name}
                />

                <strong>{poke.name}</strong>
                <span>Niv. {poke.level}</span>

                <HpBar
                  hp={poke.hp}
                  maxHp={poke.maxHp}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

      <aside className="sidebar">
        <div className="panel">
          <h2>📜 JOURNAL</h2>

          <div className="log">
            {log.map((entry, index) => (
              <p key={index}>{entry}</p>
            ))}
          </div>
        </div>

        <div className="panel">
          <h2>🎲 DÉS</h2>

          <div className="dice-buttons">
            <button onClick={() => rollDice(4)}>D4</button>
            <button onClick={() => rollDice(6)}>D6</button>
            <button onClick={() => rollDice(8)}>D8</button>
            <button onClick={() => rollDice(10)}>D10</button>
            <button onClick={() => rollDice(12)}>D12</button>
            <button onClick={() => rollDice(20)}>D20</button>
          </div>
        </div>
      </aside>
    </main>
  );
}

function GMInterface() {
  const [selectedPokemon, setSelectedPokemon] = useState(
    wildPokemon[0]
  );

  return (
    <main className="gm-layout">
      <section className="gm-map">
        <div className="map-header">
          <div>
            <span>CARTE MJ</span>
            <h1>ROUTE 1 — KANTO</h1>
          </div>

          <div className="map-tools">
            <button>＋</button>
            <button>−</button>
            <button>⌖</button>
          </div>
        </div>

        <div className="map">
          <div className="map-grid" />

          <div className="map-road road-one" />
          <div className="map-road road-two" />

          <div className="map-tree tree-one">🌲</div>
          <div className="map-tree tree-two">🌲</div>
          <div className="map-tree tree-three">🌲</div>
          <div className="map-tree tree-four">🌲</div>

          <div className="map-town">
            🏠
            <span>BOURG PALETTE</span>
          </div>

          <div className="map-player">🧢</div>

          <div className="map-wild">❗</div>

          <div className="map-npc">🧑</div>
        </div>
      </section>

      <aside className="gm-sidebar">
        <div className="panel">
          <h2>🧙 CONTRÔLE MJ</h2>

          <button className="gm-action">
            ⚔️ DÉCLENCHER COMBAT
          </button>

          <button className="gm-action">
            🌧️ CHANGER MÉTÉO
          </button>

          <button className="gm-action">
            🕐 AVANCER LE TEMPS
          </button>

          <button className="gm-action">
            👤 AJOUTER PNJ
          </button>
        </div>

        <div className="panel">
          <h2>🐾 POKÉMON SAUVAGES</h2>

          {wildPokemon.map((poke) => (
            <button
              key={poke.id}
              className={
                selectedPokemon.id === poke.id
                  ? "wild-card selected"
                  : "wild-card"
              }
              onClick={() => setSelectedPokemon(poke)}
            >
              <Sprite
                src={poke.sprite}
                alt={poke.name}
              />

              <div>
                <strong>{poke.name}</strong>
                <span>Niveau {poke.level}</span>
              </div>
            </button>
          ))}
        </div>

        <div className="panel encounter-panel">
          <h2>⚡ RENCONTRE</h2>

          <div className="encounter-preview">
            <Sprite
              src={selectedPokemon.sprite}
              alt={selectedPokemon.name}
            />

            <strong>{selectedPokemon.name}</strong>
            <span>Niveau {selectedPokemon.level}</span>
          </div>

          <button className="danger-button">
            FAIRE APPARAÎTRE
          </button>
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
