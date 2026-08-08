import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const TILE = 48;

const TILE_TYPES = {
  grass: {
    label: "Herbe",
    color: "#78c850",
  },
  path: {
    label: "Chemin",
    color: "#e8c878",
  },
  water: {
    label: "Eau",
    color: "#58a8e8",
  },
  tree: {
    label: "Arbre",
    color: "#287840",
    blocked: true,
  },
  wall: {
    label: "Mur",
    color: "#806858",
    blocked: true,
  },
  roof: {
    label: "Toit",
    color: "#d84840",
    blocked: true,
  },
  flower: {
    label: "Fleurs",
    color: "#90d858",
  },
};

const MAP = [
  "TTTTTTTTTTTTTTTTTTTTTTTT",
  "TTTTGGGGGGGGGGGGGGGGTTTT",
  "TTGGGGGGGGPPPPGGGGGGGGTT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGHHHHHPPPPHHHHHGGGGT",
  "TGGGHHHHHPPPPHHHHHGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TGGGGGGGGPPPPGGGGGGGGGT",
  "TTTTTTTTTTTTTTTTTTTTTTTT",
];

const BUILDINGS = [
  {
    id: "pokemon-center",
    name: "Centre Pokémon",
    x: 7,
    y: 5,
    width: 5,
    height: 3,
    type: "pokemon-center",
  },
  {
    id: "mart",
    name: "Boutique Pokémon",
    x: 16,
    y: 5,
    width: 5,
    height: 3,
    type: "mart",
  },
];

const NPCS = [
  {
    id: "professor",
    name: "Prof. Chen",
    role: "Chercheur Pokémon",
    x: 10,
    y: 11,
    team: [
      { name: "Bulbizarre", level: 12, hp: 35, type: "Plante / Poison" },
      { name: "Rattata", level: 10, hp: 28, type: "Normal" },
    ],
    dialogue:
      "Les Pokémon et leurs relations avec les humains sont encore mystérieux.",
  },
  {
    id: "youngster",
    name: "Léo",
    role: "Dresseur",
    x: 5,
    y: 15,
    team: [
      { name: "Rattata", level: 8, hp: 22, type: "Normal" },
      { name: "Roucool", level: 9, hp: 24, type: "Normal / Vol" },
    ],
    dialogue: "Mon équipe est prête ! Tu veux faire un combat ?",
  },
  {
    id: "lass",
    name: "Julie",
    role: "Dresseuse",
    x: 18,
    y: 14,
    team: [
      { name: "Rondoudou", level: 10, hp: 32, type: "Normal" },
    ],
    dialogue: "J'adore observer les Pokémon sauvages dans les hautes herbes.",
  },
];

const WILD_POKEMON = [
  {
    id: 19,
    name: "Rattata",
    level: 5,
    x: 4,
    y: 4,
    type: "Normal",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png",
  },
  {
    id: 16,
    name: "Roucool",
    level: 7,
    x: 6,
    y: 5,
    type: "Normal / Vol",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png",
  },
  {
    id: 10,
    name: "Chenipan",
    level: 4,
    x: 17,
    y: 4,
    type: "Insecte",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png",
  },
  {
    id: 13,
    name: "Aspicot",
    level: 6,
    x: 18,
    y: 5,
    type: "Insecte / Poison",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/13.png",
  },
  {
    id: 21,
    name: "Piafabec",
    level: 8,
    x: 5,
    y: 17,
    type: "Normal / Vol",
    sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/21.png",
  },
];

const PLAYER_START = {
  x: 12,
  y: 18,
};

function tileFromChar(char) {
  switch (char) {
    case "G":
      return "grass";
    case "P":
      return "path";
    case "W":
      return "water";
    case "T":
      return "tree";
    case "H":
      return "grass";
    default:
      return "grass";
  }
}

function isTallGrass(x, y) {
  return MAP[y]?.[x] === "H";
}

function isBlocked(x, y) {
  if (x < 0 || y < 0 || y >= MAP.length || x >= MAP[0].length) {
    return true;
  }

  const char = MAP[y][x];

  if (char === "T" || char === "W") {
    return true;
  }

  const building = BUILDINGS.find(
    (item) =>
      x >= item.x &&
      x < item.x + item.width &&
      y >= item.y &&
      y < item.y + item.height
  );

  if (building) {
    return true;
  }

  return false;
}

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="pokeball-logo">
          <span />
        </div>

        <div>
          <strong>POKÉMON JDR</strong>
          <small>GÉNÉRATION I · KANTO</small>
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

function PlayerHUD({ player }) {
  return (
    <div className="player-hud">
      <div className="trainer-icon">🧢</div>

      <div className="trainer-data">
        <span>DRESSEUR</span>
        <strong>GABRIEL</strong>
        <small>Niveau 12 · 1 240 XP</small>
      </div>

      <div className="location">
        <span>LOCALISATION</span>
        <strong>ROUTE 1</strong>
        <small>KANTO</small>
      </div>

      <div className="coordinates">
        X {player.x} · Y {player.y}
      </div>
    </div>
  );
}

function GMPanel({ selected, player }) {
  if (!selected) {
    return (
      <aside className="gm-panel">
        <div className="panel-title">OUTILS DU MJ</div>

        <div className="gm-message">
          <strong>Mode Maître du Jeu</strong>

          <p>
            Cliquez sur un PNJ ou un Pokémon sauvage pour afficher ses
            informations.
          </p>

          <div className="gm-stat">
            <span>Position joueur</span>
            <b>
              {player.x}, {player.y}
            </b>
          </div>

          <div className="gm-stat">
            <span>Pokémon sauvages</span>
            <b>{WILD_POKEMON.length}</b>
          </div>

          <div className="gm-stat">
            <span>PNJ présents</span>
            <b>{NPCS.length}</b>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="gm-panel">
      <div className="panel-title">
        {selected.kind === "wild" ? "POKÉMON SAUVAGE" : "PNJ"}
      </div>

      {selected.kind === "wild" ? (
        <>
          <div className="selected-pokemon">
            <img src={selected.data.sprite} alt={selected.data.name} />

            <div>
              <strong>{selected.data.name}</strong>
              <span>Niveau {selected.data.level}</span>
            </div>
          </div>

          <div className="info-row">
            <span>Type</span>
            <b>{selected.data.type}</b>
          </div>

          <div className="info-row">
            <span>Position</span>
            <b>
              {selected.data.x}, {selected.data.y}
            </b>
          </div>

          <div className="encounter-warning">
            ⚠ Pokémon caché au joueur
          </div>
        </>
      ) : (
        <>
          <div className="npc-header">
            <div className="npc-avatar">🧑</div>

            <div>
              <strong>{selected.data.name}</strong>
              <span>{selected.data.role}</span>
            </div>
          </div>

          <div className="info-row">
            <span>Position</span>
            <b>
              {selected.data.x}, {selected.data.y}
            </b>
          </div>

          <h4>ÉQUIPE</h4>

          <div className="npc-team">
            {selected.data.team.map((pokemon) => (
              <div className="npc-pokemon" key={pokemon.name}>
                <div>
                  <strong>{pokemon.name}</strong>
                  <span>{pokemon.type}</span>
                </div>

                <div className="npc-level">Niv. {pokemon.level}</div>
              </div>
            ))}
          </div>

          <div className="dialogue-box">
            <span>DIALOGUE</span>
            <p>« {selected.data.dialogue} »</p>
          </div>
        </>
      )}
    </aside>
  );
}

function MapTile({ type, x, y }) {
  const tile = TILE_TYPES[type];

  return (
    <div
      className={`map-tile tile-${type}`}
      style={{
        left: x * TILE,
        top: y * TILE,
      }}
    >
      {type === "tree" && <span className="tree-icon">🌳</span>}

      {type === "water" && (
        <span className="water-animation">≈</span>
      )}

      {type === "grass" && (
        <span className="grass-texture">
          {((x * 7 + y * 3) % 4 === 0) && "·"}
        </span>
      )}
    </div>
  );
}

function Building({ building, onSelect, mode }) {
  return (
    <button
      className={`building building-${building.type}`}
      style={{
        left: building.x * TILE,
        top: building.y * TILE,
        width: building.width * TILE,
        height: building.height * TILE,
      }}
      onClick={() =>
        mode === "gm" &&
        onSelect({
          kind: "building",
          data: building,
        })
      }
    >
      <span className="building-roof">
        {building.type === "pokemon-center" ? "P" : "M"}
      </span>

      <strong>{building.name}</strong>

      <span className="building-door">▣</span>
    </button>
  );
}

function NPC({ npc, onSelect, mode }) {
  return (
    <button
      className="map-character npc"
      style={{
        left: npc.x * TILE + 7,
        top: npc.y * TILE + 2,
      }}
      onClick={() =>
        mode === "gm" &&
        onSelect({
          kind: "npc",
          data: npc,
        })
      }
      title={mode === "gm" ? npc.name : undefined}
    >
      <span className="character-shadow" />
      <span className="npc-body">🧑</span>

      {mode === "gm" && <span className="npc-label">{npc.name}</span>}
    </button>
  );
}

function WildPokemon({ pokemon, mode, onSelect }) {
  if (mode !== "gm") {
    return null;
  }

  return (
    <button
      className="wild-pokemon"
      style={{
        left: pokemon.x * TILE + 4,
        top: pokemon.y * TILE - 4,
      }}
      onClick={() =>
        onSelect({
          kind: "wild",
          data: pokemon,
        })
      }
      title={pokemon.name}
    >
      <span className="wild-marker">!</span>

      <img src={pokemon.sprite} alt={pokemon.name} />

      <span>{pokemon.name}</span>
    </button>
  );
}

function PlayerCharacter({ player, moving }) {
  const inGrass = isTallGrass(player.x, player.y);

  return (
    <div
      className={`player-character ${moving ? "moving" : ""}`}
      style={{
        left: player.x * TILE + 4,
        top: player.y * TILE - 5,
      }}
    >
      <span className="character-shadow" />

      <div className="player-sprite">
        <div className="cap">⌢</div>
        <div className="face">●</div>
        <div className="shirt">▮</div>
      </div>

      {inGrass && <div className="grass-overlay">🌿</div>}
    </div>
  );
}

function GameMap({ mode, player, setPlayer, onSelect }) {
  const [moving, setMoving] = useState(false);
  const mapRef = useRef(null);

  const mapWidth = MAP[0].length * TILE;
  const mapHeight = MAP.length * TILE;

  useEffect(() => {
    function handleKeyDown(event) {
      const keys = [
        "ArrowUp",
        "ArrowDown",
        "ArrowLeft",
        "ArrowRight",
        "z",
        "q",
        "s",
        "d",
        "w",
        "a",
      ];

      if (!keys.includes(event.key)) {
        return;
      }

      event.preventDefault();

      const key = event.key.toLowerCase();

      let dx = 0;
      let dy = 0;

      if (event.key === "ArrowUp" || key === "z" || key === "w") {
        dy = -1;
      }

      if (event.key === "ArrowDown" || key === "s") {
        dy = 1;
      }

      if (event.key === "ArrowLeft" || key === "q" || key === "a") {
        dx = -1;
      }

      if (event.key === "ArrowRight" || key === "d") {
        dx = 1;
      }

      const newX = player.x + dx;
      const newY = player.y + dy;

      if (!isBlocked(newX, newY)) {
        setPlayer({
          x: newX,
          y: newY,
        });

        setMoving(true);

        window.setTimeout(() => {
          setMoving(false);
        }, 140);
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [player, setPlayer]);

  const cameraStyle = useMemo(() => {
    return {
      width: mapWidth,
      height: mapHeight,
    };
  }, [mapWidth, mapHeight]);

  return (
    <div className="map-viewport" ref={mapRef}>
      <div className="map-camera" style={cameraStyle}>
        {MAP.map((row, y) =>
          [...row].map((char, x) => (
            <MapTile
              key={`${x}-${y}`}
              type={char === "H" ? "grass" : tileFromChar(char)}
              x={x}
              y={y}
            />
          ))
        )}

        {MAP.map((row, y) =>
          [...row].map((char, x) =>
            char === "H" ? (
              <div
                key={`grass-${x}-${y}`}
                className="tall-grass"
                style={{
                  left: x * TILE,
                  top: y * TILE,
                }}
              >
                🌿
              </div>
            ) : null
          )
        )}

        {BUILDINGS.map((building) => (
          <Building
            key={building.id}
            building={building}
            mode={mode}
            onSelect={onSelect}
          />
        ))}

        {NPCS.map((npc) => (
          <NPC
            key={npc.id}
            npc={npc}
            mode={mode}
            onSelect={onSelect}
          />
        ))}

        {WILD_POKEMON.map((pokemon) => (
          <WildPokemon
            key={pokemon.id}
            pokemon={pokemon}
            mode={mode}
            onSelect={onSelect}
          />
        ))}

        <PlayerCharacter player={player} moving={moving} />
      </div>
    </div>
  );
}

function Controls() {
  return (
    <div className="controls">
      <div className="dpad">
        <button>▲</button>

        <div>
          <button>◀</button>
          <button>●</button>
          <button>▶</button>
        </div>

        <button>▼</button>
      </div>

      <div className="controls-text">
        <strong>DÉPLACEMENT</strong>
        <span>ZQSD · WASD · FLÈCHES</span>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState("player");

  const [player, setPlayer] = useState(PLAYER_START);

  const [selected, setSelected] = useState(null);

  useEffect(() => {
    setSelected(null);
  }, [mode]);

  return (
    <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}>
      <Header mode={mode} setMode={setMode} />

      <main className="game-layout">
        <section className="game-area">
          <PlayerHUD player={player} />

          <GameMap
            mode={mode}
            player={player}
            setPlayer={setPlayer}
            onSelect={setSelected}
          />

          <Controls />

          <div className="mode-indicator">
            {mode === "player" ? (
              <>
                <span className="indicator-dot player-dot" />
                MODE JOUEUR
              </>
            ) : (
              <>
                <span className="indicator-dot gm-dot" />
                MODE MAÎTRE DU JEU
              </>
            )}
          </div>
        </section>

        {mode === "gm" ? (
          <GMPanel selected={selected} player={player} />
        ) : (
          <aside className="player-panel">
            <div className="panel-title">ÉQUIPE</div>

            <div className="team-card">
              <div className="team-sprite">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png"
                  alt="Pikachu"
                />
              </div>

              <div className="team-info">
                <strong>Pikachu</strong>
                <span>Niveau 18</span>

                <div className="hp-label">
                  PV <b>52 / 52</b>
                </div>

                <div className="hp-bar">
                  <div className="hp-fill" style={{ width: "100%" }} />
                </div>
              </div>
            </div>

            <div className="team-card">
              <div className="team-sprite">
                <img
                  src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/4.png"
                  alt="Salamèche"
                />
              </div>

              <div className="team-info">
                <strong>Salamèche</strong>
                <span>Niveau 16</span>

                <div className="hp-label">
                  PV <b>38 / 44</b>
                </div>

                <div className="hp-bar">
                  <div
                    className="hp-fill"
                    style={{ width: "86%" }}
                  />
                </div>
              </div>
            </div>

            <div className="panel-section">
              <span>ZONE</span>
              <strong>Route 1</strong>
            </div>

            <div className="panel-section">
              <span>RENCONTRES</span>
              <strong>Herbes hautes</strong>
              <small>Pokémon sauvages possibles</small>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);