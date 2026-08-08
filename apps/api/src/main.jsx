import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

/*
 * ============================================================
 * POKÉMON JDR — INTERFACE WEB
 * ============================================================
 *
 * Deux modes :
 *   - Joueur : informations accessibles au joueur
 *   - MJ     : informations complètes + carte + rencontres
 *
 * Important :
 * Les données sensibles du MJ sont ici filtrées côté interface.
 * Pour un vrai jeu multijoueur, le filtrage devra également être
 * effectué côté serveur.
 */

// ============================================================
// CONFIGURATION
// ============================================================

const SPRITE_BASE =
  "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

const ANIMATED_BASE =
  `${SPRITE_BASE}/versions/generation-v/black-white/animated`;

const POKEMON_SPRITE = (id) => `${ANIMATED_BASE}/${id}.gif`;
const POKEMON_FALLBACK = (id) => `${SPRITE_BASE}/${id}.png`;

// ============================================================
// DONNÉES POKÉMON
// ============================================================

const playerPokemon = [
  {
    id: 25,
    name: "Pikachu",
    type: ["Électrik"],
    level: 18,
    hp: 52,
    maxHp: 52,
    attack: 38,
    defense: 31,
    speed: 52,
  },
  {
    id: 4,
    name: "Salamèche",
    type: ["Feu"],
    level: 16,
    hp: 38,
    maxHp: 44,
    attack: 35,
    defense: 28,
    speed: 39,
  },
  {
    id: 7,
    name: "Carapuce",
    type: ["Eau"],
    level: 15,
    hp: 41,
    maxHp: 45,
    attack: 32,
    defense: 41,
    speed: 29,
  },
];

const wildPokemon = [
  {
    id: 19,
    name: "Rattata",
    type: ["Normal"],
    level: 8,
    hp: 21,
    maxHp: 21,
    attack: 18,
    defense: 14,
    speed: 22,
    rarity: "commun",
  },
  {
    id: 16,
    name: "Roucool",
    type: ["Normal", "Vol"],
    level: 7,
    hp: 19,
    maxHp: 19,
    attack: 17,
    defense: 13,
    speed: 20,
    rarity: "commun",
  },
  {
    id: 10,
    name: "Chenipan",
    type: ["Insecte"],
    level: 5,
    hp: 16,
    maxHp: 16,
    attack: 9,
    defense: 12,
    speed: 11,
    rarity: "commun",
  },
  {
    id: 13,
    name: "Aspicot",
    type: ["Insecte", "Poison"],
    level: 6,
    hp: 17,
    maxHp: 17,
    attack: 11,
    defense: 10,
    speed: 14,
    rarity: "commun",
  },
  {
    id: 43,
    name: "Mystherbe",
    type: ["Plante", "Poison"],
    level: 9,
    hp: 27,
    maxHp: 27,
    attack: 19,
    defense: 23,
    speed: 16,
    rarity: "rare",
  },
  {
    id: 41,
    name: "Nosferapti",
    type: ["Poison", "Vol"],
    level: 10,
    hp: 29,
    maxHp: 29,
    attack: 22,
    defense: 17,
    speed: 31,
    rarity: "rare",
  },
];

// ============================================================
// CARTE
// ============================================================

const mapLocations = [
  {
    id: "palette",
    name: "Bourg Palette",
    type: "ville",
    x: 10,
    y: 82,
    description: "Le paisible village natal des dresseurs.",
    npcs: [
      {
        name: "Prof. Chen",
        role: "Chercheur",
        team: [
          {
            name: "Rattata",
            level: 12,
            hp: 34,
            attack: 25,
            defense: 18,
          },
        ],
      },
      {
        name: "Maman",
        role: "Habitante",
        team: [],
      },
    ],
  },

  {
    id: "route1",
    name: "Route 1",
    type: "route",
    x: 19,
    y: 68,
    description: "Une route bordée de hautes herbes.",
    grass: true,
    wild: [
      { pokemon: "Rattata", level: "3-5", chance: 40 },
      { pokemon: "Roucool", level: "3-5", chance: 30 },
      { pokemon: "Chenipan", level: "3-4", chance: 20 },
      { pokemon: "Aspicot", level: "3-4", chance: 10 },
    ],
    npcs: [],
  },

  {
    id: "jadielle",
    name: "Jadielle",
    type: "ville",
    x: 28,
    y: 53,
    description: "Une ville située à l'entrée de la forêt.",
    npcs: [
      {
        name: "Infirmière Joëlle",
        role: "Centre Pokémon",
        team: [],
      },
      {
        name: "Employé",
        role: "Boutique",
        team: [],
      },
      {
        name: "Gamin Jules",
        role: "Dresseur",
        team: [
          {
            name: "Rattata",
            level: 8,
            hp: 23,
            attack: 17,
            defense: 14,
          },
          {
            name: "Roucool",
            level: 7,
            hp: 20,
            attack: 16,
            defense: 13,
          },
        ],
      },
    ],
  },

  {
    id: "route2",
    name: "Route 2",
    type: "route",
    x: 37,
    y: 39,
    description: "Une longue route menant à la forêt.",
    grass: true,
    wild: [
      { pokemon: "Rattata", level: "4-7", chance: 35 },
      { pokemon: "Roucool", level: "4-6", chance: 25 },
      { pokemon: "Chenipan", level: "4-6", chance: 20 },
      { pokemon: "Aspicot", level: "4-6", chance: 20 },
    ],
    npcs: [],
  },

  {
    id: "foret",
    name: "Forêt de Jade",
    type: "donjon",
    x: 47,
    y: 28,
    description: "Une forêt dense où les Pokémon sauvages abondent.",
    grass: true,
    wild: [
      { pokemon: "Chenipan", level: "5-8", chance: 30 },
      { pokemon: "Aspicot", level: "5-8", chance: 30 },
      { pokemon: "Pikachu", level: "3-5", chance: 5 },
      { pokemon: "Rattata", level: "5-7", chance: 20 },
      { pokemon: "Roucool", level: "5-7", chance: 15 },
    ],
    npcs: [
      {
        name: "Fillette Léa",
        role: "Dresseuse",
        team: [
          {
            name: "Chenipan",
            level: 7,
            hp: 22,
            attack: 12,
            defense: 15,
          },
          {
            name: "Chenipan",
            level: 8,
            hp: 24,
            attack: 14,
            defense: 16,
          },
        ],
      },
      {
        name: "Scout Hugo",
        role: "Dresseur",
        team: [
          {
            name: "Aspicot",
            level: 9,
            hp: 26,
            attack: 17,
            defense: 15,
          },
        ],
      },
    ],
  },

  {
    id: "argenta",
    name: "Argenta",
    type: "ville",
    x: 57,
    y: 17,
    description: "Ville connue pour son arène spécialisée Roche.",
    npcs: [
      {
        name: "Pierre",
        role: "Champion d'Arène",
        team: [
          {
            name: "Racaillou",
            level: 12,
            hp: 39,
            attack: 31,
            defense: 41,
          },
          {
            name: "Onix",
            level: 14,
            hp: 45,
            attack: 34,
            defense: 52,
          },
        ],
      },
      {
        name: "Pierre's Assistant",
        role: "Arène",
        team: [],
      },
    ],
  },

  {
    id: "route3",
    name: "Route 3",
    type: "route",
    x: 67,
    y: 25,
    description: "Une route montagneuse.",
    grass: true,
    wild: [
      { pokemon: "Rattata", level: "8-11", chance: 25 },
      { pokemon: "Roucool", level: "8-10", chance: 20 },
      { pokemon: "Nosferapti", level: "9-12", chance: 25 },
      { pokemon: "Mystherbe", level: "8-11", chance: 15 },
      { pokemon: "Pikachu", level: "8-10", chance: 5 },
    ],
    npcs: [],
  },

  {
    id: "azuria",
    name: "Azuria",
    type: "ville",
    x: 80,
    y: 22,
    description: "Une ville entourée par l'eau.",
    npcs: [
      {
        name: "Ondine",
        role: "Championne d'Arène",
        team: [
          {
            name: "Stari",
            level: 18,
            hp: 47,
            attack: 31,
            defense: 29,
          },
          {
            name: "Staross",
            level: 21,
            hp: 58,
            attack: 39,
            defense: 37,
          },
        ],
      },
    ],
  },
];

// ============================================================
// SPRITES
// ============================================================

function Sprite({ id, name, className = "" }) {
  const [src, setSrc] = useState(POKEMON_SPRITE(id));

  return (
    <img
      className={`pokemon-sprite ${className}`}
      src={src}
      alt={name}
      onError={() => {
        const fallback = POKEMON_FALLBACK(id);

        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}

// ============================================================
// BARRE PV
// ============================================================

function HpBar({ hp, maxHp }) {
  const percentage =
    maxHp > 0 ? Math.max(0, Math.min(100, (hp / maxHp) * 100)) : 0;

  let status = "healthy";

  if (percentage <= 25) {
    status = "danger";
  } else if (percentage <= 50) {
    status = "warning";
  }

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
          className={`hp-fill ${status}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// ============================================================
// HEADER
// ============================================================

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="pokeball-small">
          <span />
        </div>

        <div>
          <strong>POKÉMON JDR</strong>
          <small>GÉNÉRATION I · RPG</small>
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

// ============================================================
// CARTE
// ============================================================

function RetroMap({
  mode,
  selectedLocation,
  setSelectedLocation,
  encounterVisible,
}) {
  return (
    <section className="map-panel">
      <div className="panel-title">
        <div>
          <span className="eyebrow">CARTE DE KANTO</span>
          <h2>Région de Kanto</h2>
        </div>

        {mode === "gm" && (
          <span className="gm-only-badge">👁 VUE MJ</span>
        )}
      </div>

      <div className="map">
        <div className="map-grid" />

        <div className="water water-a" />
        <div className="water water-b" />

        <div className="forest forest-a" />
        <div className="forest forest-b" />

        <div className="mountain mountain-a" />
        <div className="mountain mountain-b" />

        <div className="road road-a" />
        <div className="road road-b" />
        <div className="road road-c" />

        {mapLocations.map((location) => {
          const isSelected = selectedLocation?.id === location.id;

          return (
            <button
              key={location.id}
              className={`map-location ${location.type} ${
                isSelected ? "selected" : ""
              }`}
              style={{
                left: `${location.x}%`,
                top: `${location.y}%`,
              }}
              onClick={() => setSelectedLocation(location)}
            >
              <span className="location-marker">
                {location.type === "ville"
                  ? "🏠"
                  : location.type === "donjon"
                    ? "🌲"
                    : "●"}
              </span>

              <span className="location-name">{location.name}</span>

              {mode === "gm" && location.grass && (
                <span className="gm-grass-marker">🌿</span>
              )}
            </button>
          );
        })}

        <div
          className={`player-marker ${
            encounterVisible ? "encounter" : ""
          }`}
          style={{
            left: "19%",
            top: "68%",
          }}
        >
          🧢
        </div>
      </div>

      <div className="map-legend">
        <span>
          <i className="legend-dot town" />
          Ville
        </span>

        <span>
          <i className="legend-dot route" />
          Route
        </span>

        <span>
          <i className="legend-dot forest" />
          Forêt
        </span>

        {mode === "gm" && (
          <span>
            <i className="legend-dot encounter" />
            Pokémon sauvage
          </span>
        )}
      </div>
    </section>
  );
}

// ============================================================
// FICHE POKÉMON
// ============================================================

function PokemonCard({ pokemon, active, onClick }) {
  return (
    <button
      className={`pokemon-card ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <div className="pokemon-card-sprite">
        <Sprite id={pokemon.id} name={pokemon.name} />
      </div>

      <div className="pokemon-card-info">
        <div className="pokemon-name-row">
          <strong>{pokemon.name}</strong>
          <span>Nv. {pokemon.level}</span>
        </div>

        <div className="types">
          {pokemon.type.map((type) => (
            <span key={type} className={`type type-${type.toLowerCase()}`}>
              {type}
            </span>
          ))}
        </div>

        <HpBar hp={pokemon.hp} maxHp={pokemon.maxHp} />
      </div>
    </button>
  );
}

// ============================================================
// FICHE PNJ
// ============================================================

function NpcCard({ npc }) {
  return (
    <div className="npc-card">
      <div className="npc-avatar">
        {npc.role.includes("Champion")
          ? "🏆"
          : npc.role.includes("Infirmière")
            ? "👩‍⚕️"
            : npc.role.includes("Dresseur")
              ? "🧢"
              : "👤"}
      </div>

      <div className="npc-main">
        <div className="npc-heading">
          <strong>{npc.name}</strong>
          <span>{npc.role}</span>
        </div>

        {npc.team.length > 0 ? (
          <div className="npc-team">
            {npc.team.map((member, index) => (
              <div className="npc-pokemon" key={`${member.name}-${index}`}>
                <span>{member.name}</span>
                <small>Nv. {member.level}</small>

                <div className="mini-stats">
                  <span>PV {member.hp}</span>
                  <span>ATQ {member.attack}</span>
                  <span>DEF {member.defense}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <span className="no-team">Aucun Pokémon</span>
        )}
      </div>
    </div>
  );
}

// ============================================================
// JOUEUR
// ============================================================

function PlayerInterface() {
  const [activePokemon, setActivePokemon] = useState(playerPokemon[0]);

  const [log, setLog] = useState([
    "Bienvenue dans votre aventure.",
    "Vous êtes arrivé sur la Route 1.",
    "Les hautes herbes semblent bouger...",
  ]);

  const [diceResult, setDiceResult] = useState(null);

  const [selectedLocation, setSelectedLocation] = useState(
    mapLocations.find((location) => location.id === "route1")
  );

  function addLog(message) {
    setLog((previous) => [message, ...previous].slice(0, 12));
  }

  function rollDice(sides) {
    const result = Math.floor(Math.random() * sides) + 1;

    setDiceResult({
      sides,
      result,
    });

    addLog(`🎲 Jet de D${sides} : ${result}`);
  }

  function inspectPokemon() {
    addLog(
      `🔎 ${activePokemon.name} est prêt au combat. Niveau ${activePokemon.level}.`
    );
  }

  function move(direction) {
    const labels = {
      north: "nord",
      south: "sud",
      east: "est",
      west: "ouest",
    };

    addLog(`🚶 Vous vous déplacez vers le ${labels[direction]}.`);

    if (Math.random() < 0.35) {
      addLog("🌿 Les hautes herbes bougent légèrement...");
    }
  }

  function interact() {
    addLog(`💬 Vous examinez les environs de ${selectedLocation.name}.`);
  }

  return (
    <main className="app">
      <div className="player-layout">
        <section className="game-column">
          <div className="location-header">
            <div>
              <span className="eyebrow">LOCALISATION</span>
              <h1>{selectedLocation.name}</h1>
              <p>{selectedLocation.description}</p>
            </div>

            <div className="coordinates">
              <span>RÉGION</span>
              <strong>KANTO</strong>
            </div>
          </div>

          <RetroMap
            mode="player"
            selectedLocation={selectedLocation}
            setSelectedLocation={setSelectedLocation}
            encounterVisible={false}
          />

          <section className="movement-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">EXPLORATION</span>
                <h2>Déplacement</h2>
              </div>
            </div>

            <div className="movement-grid">
              <div />

              <button onClick={() => move("north")}>▲</button>

              <div />

              <button onClick={() => move("west")}>◀</button>

              <button
                className="action-center"
                onClick={interact}
              >
                ✦
              </button>

              <button onClick={() => move("east")}>▶</button>

              <div />

              <button onClick={() => move("south")}>▼</button>

              <div />
            </div>

            <div className="movement-actions">
              <button onClick={interact}>🔎 Examiner</button>
              <button onClick={() => addLog("🎒 Inventaire ouvert.")}>
                🎒 Inventaire
              </button>
            </div>
          </section>

          <section className="log-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">AVENTURE</span>
                <h2>Journal</h2>
              </div>
            </div>

            <div className="log">
              {log.map((entry, index) => (
                <div className="log-entry" key={`${entry}-${index}`}>
                  <span>›</span>
                  <p>{entry}</p>
                </div>
              ))}
            </div>
          </section>
        </section>

        <aside className="sidebar">
          <section className="trainer-card">
            <div className="trainer-avatar">🧢</div>

            <div className="trainer-info">
              <span>DRESSEUR</span>
              <strong>GABRIEL</strong>
              <small>Niveau 12 · 1 240 XP</small>
            </div>

            <div className="trainer-money">₽ 3 420</div>
          </section>

          <section className="party-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">ÉQUIPE</span>
                <h2>Pokémon</h2>
              </div>

              <span>{playerPokemon.length}/6</span>
            </div>

            <div className="pokemon-list">
              {playerPokemon.map((p) => (
                <PokemonCard
                  key={p.id}
                  pokemon={p}
                  active={activePokemon.id === p.id}
                  onClick={() => {
                    setActivePokemon(p);
                    addLog(`🔴 ${p.name} est maintenant actif.`);
                  }}
                />
              ))}
            </div>
          </section>

          <section className="active-panel">
            <div className="active-header">
              <div>
                <span className="eyebrow">POKÉMON ACTIF</span>
                <h2>{activePokemon.name}</h2>
              </div>

              <Sprite
                id={activePokemon.id}
                name={activePokemon.name}
                className="large-sprite"
              />
            </div>

            <div className="stats-grid">
              <div>
                <span>ATQ</span>
                <strong>{activePokemon.attack}</strong>
              </div>

              <div>
                <span>DEF</span>
                <strong>{activePokemon.defense}</strong>
              </div>

              <div>
                <span>VIT</span>
                <strong>{activePokemon.speed}</strong>
              </div>
            </div>

            <HpBar
              hp={activePokemon.hp}
              maxHp={activePokemon.maxHp}
            />

            <button className="primary-button" onClick={inspectPokemon}>
              🔍 Examiner
            </button>
          </section>

          <section className="dice-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">SYSTÈME JDR</span>
                <h2>Jets de dés</h2>
              </div>
            </div>

            <div className="dice-buttons">
              {[4, 6, 8, 10, 12, 20].map((sides) => (
                <button key={sides} onClick={() => rollDice(sides)}>
                  D{sides}
                </button>
              ))}
            </div>

            {diceResult && (
              <div className="dice-result">
                <span>D{diceResult.sides}</span>
                <strong>{diceResult.result}</strong>
              </div>
            )}
          </section>
        </aside>
      </div>
    </main>
  );
}

// ============================================================
// MJ
// ============================================================

function GMInterface() {
  const [selectedLocation, setSelectedLocation] = useState(
    mapLocations.find((location) => location.id === "route1")
  );

  const [encounter, setEncounter] = useState(null);

  const [log, setLog] = useState([
    "Mode MJ activé.",
    "La carte complète de Kanto est visible.",
    "Les Pokémon sauvages sont visibles dans les zones d'herbes.",
  ]);

  const [selectedNpc, setSelectedNpc] = useState(null);

  function addLog(message) {
    setLog((previous) => [message, ...previous].slice(0, 15));
  }

  const availableWildPokemon = useMemo(() => {
    if (!selectedLocation?.wild) {
      return [];
    }

    return selectedLocation.wild.map((entry) => {
      const data = wildPokemon.find(
        (pokemon) => pokemon.name === entry.pokemon
      );

      return {
        ...entry,
        data,
      };
    });
  }, [selectedLocation]);

  function spawnEncounter() {
    if (!availableWildPokemon.length) {
      addLog("⚠️ Aucun Pokémon sauvage dans cette zone.");
      return;
    }

    const selected =
      availableWildPokemon[
        Math.floor(Math.random() * availableWildPokemon.length)
      ];

    const pokemon = selected.data;

    const [minLevel, maxLevel] = selected.level
      .split("-")
      .map(Number);

    const level =
      minLevel === maxLevel
        ? minLevel
        : Math.floor(
            Math.random() * (maxLevel - minLevel + 1)
          ) + minLevel;

    const generated = {
      ...pokemon,
      level,
      hp: Math.max(1, pokemon.maxHp + (level - 8) * 2),
      maxHp: Math.max(1, pokemon.maxHp + (level - 8) * 2),
    };

    setEncounter(generated);

    addLog(
      `⚔️ Rencontre générée : ${generated.name} niveau ${generated.level}.`
    );
  }

  function hideEncounter() {
    setEncounter(null);
    addLog("👁 Rencontre sauvage masquée.");
  }

  function selectNpc(npc) {
    setSelectedNpc(npc);

    addLog(`🧙 PNJ sélectionné : ${npc.name}.`);
  }

  return (
    <main className="app gm-app">
      <div className="gm-layout">
        <section className="gm-main">
          <div className="gm-header">
            <div>
              <span className="eyebrow">MAÎTRE DU JEU</span>
              <h1>Tableau de contrôle</h1>
              <p>
                Informations complètes de la partie et carte secrète.
              </p>
            </div>

            <div className="gm-status">
              <span className="status-dot" />
              PARTIE EN DIRECT
            </div>
          </div>

          <RetroMap
            mode="gm"
            selectedLocation={selectedLocation}
            setSelectedLocation={(location) => {
              setSelectedLocation(location);
              setEncounter(null);
              setSelectedNpc(null);
            }}
            encounterVisible={Boolean(encounter)}
          />

          <div className="gm-grid">
            <section className="encounter-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">RENCONTRE</span>
                  <h2>Pokémon sauvages</h2>
                </div>

                <span className="gm-only-badge">SECRET JOUEUR</span>
              </div>

              {encounter ? (
                <div className="encounter-card">
                  <div className="encounter-sprite">
                    <Sprite
                      id={encounter.id}
                      name={encounter.name}
                      className="large-sprite"
                    />
                  </div>

                  <div className="encounter-info">
                    <span className="eyebrow">POKÉMON SAUVAGE</span>

                    <h3>
                      {encounter.name}{" "}
                      <small>Nv. {encounter.level}</small>
                    </h3>

                    <div className="types">
                      {encounter.type.map((type) => (
                        <span key={type} className="type">
                          {type}
                        </span>
                      ))}
                    </div>

                    <HpBar
                      hp={encounter.hp}
                      maxHp={encounter.maxHp}
                    />

                    <div className="stats-grid">
                      <div>
                        <span>ATQ</span>
                        <strong>{encounter.attack}</strong>
                      </div>

                      <div>
                        <span>DEF</span>
                        <strong>{encounter.defense}</strong>
                      </div>

                      <div>
                        <span>VIT</span>
                        <strong>{encounter.speed}</strong>
                      </div>
                    </div>

                    <div className="encounter-actions">
                      <button
                        className="primary-button"
                        onClick={() =>
                          addLog(
                            `⚔️ ${encounter.name} entre en combat.`
                          )
                        }
                      >
                        ⚔️ Combat
                      </button>

                      <button onClick={hideEncounter}>
                        👁 Masquer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <div className="empty-icon">🌿</div>

                  <strong>
                    Aucune rencontre active
                  </strong>

                  <p>
                    Le joueur ne voit pas les Pokémon présents
                    dans les hautes herbes.
                  </p>

                  <button
                    className="primary-button"
                    onClick={spawnEncounter}
                    disabled={!availableWildPokemon.length}
                  >
                    🎲 Générer une rencontre
                  </button>
                </div>
              )}

              <div className="wild-table">
                <div className="wild-table-title">
                  Rencontres possibles à {selectedLocation.name}
                </div>

                {availableWildPokemon.length === 0 ? (
                  <p className="muted">
                    Aucune table de rencontres.
                  </p>
                ) : (
                  availableWildPokemon.map((entry) => (
                    <div className="wild-row" key={entry.pokemon}>
                      <Sprite
                        id={entry.data.id}
                        name={entry.data.name}
                      />

                      <strong>{entry.pokemon}</strong>

                      <span>
                        Nv. {entry.level}
                      </span>

                      <span>{entry.chance}%</span>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="npc-panel">
              <div className="panel-title">
                <div>
                  <span className="eyebrow">PNJ</span>
                  <h2>Personnages</h2>
                </div>

                <span>
                  {selectedLocation.npcs?.length || 0}
                </span>
              </div>

              <div className="npc-list">
                {(selectedLocation.npcs || []).map((npc) => (
                  <button
                    className={`npc-select ${
                      selectedNpc?.name === npc.name
                        ? "selected"
                        : ""
                    }`}
                    key={npc.name}
                    onClick={() => selectNpc(npc)}
                  >
                    <NpcCard npc={npc} />
                  </button>
                ))}

                {!selectedLocation.npcs?.length && (
                  <div className="empty-state compact">
                    Aucun PNJ enregistré ici.
                  </div>
                )}
              </div>
            </section>
          </div>
        </section>

        <aside className="gm-sidebar">
          <section className="gm-location-card">
            <span className="eyebrow">ZONE ACTIVE</span>

            <h2>{selectedLocation.name}</h2>

            <p>{selectedLocation.description}</p>

            <div className="location-properties">
              <span>
                TYPE
                <strong>{selectedLocation.type}</strong>
              </span>

              <span>
                HERBES
                <strong>
                  {selectedLocation.grass ? "OUI" : "NON"}
                </strong>
              </span>
            </div>
          </section>

          <section className="player-monitor">
            <div className="panel-title">
              <div>
                <span className="eyebrow">JOUEUR</span>
                <h2>Gabriel</h2>
              </div>

              <span className="online">
                ● EN LIGNE
              </span>
            </div>

            <div className="player-position">
              <span>POSITION</span>
              <strong>{selectedLocation.name}</strong>
            </div>

            <div className="player-party-mini">
              {playerPokemon.map((pokemon) => (
                <div key={pokemon.id}>
                  <Sprite
                    id={pokemon.id}
                    name={pokemon.name}
                  />

                  <span>{pokemon.name}</span>

                  <small>
                    Nv. {pokemon.level}
                  </small>
                </div>
              ))}
            </div>
          </section>

          <section className="gm-log-panel">
            <div className="panel-title">
              <div>
                <span className="eyebrow">MJ</span>
                <h2>Journal secret</h2>
              </div>
            </div>

            <div className="log">
              {log.map((entry, index) => (
                <div className="log-entry" key={`${entry}-${index}`}>
                  <span>›</span>
                  <p>{entry}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="gm-actions">
            <button
              className="primary-button"
              onClick={spawnEncounter}
              disabled={!availableWildPokemon.length}
            >
              🌿 Nouvelle rencontre
            </button>

            <button
              onClick={() =>
                addLog("🎲 Jet MJ : " + (Math.floor(Math.random() * 20) + 1))
              }
            >
              🎲 Jet D20
            </button>

            <button
              onClick={() =>
                addLog("⏸ Partie mise en pause.")
              }
            >
              ⏸ Pause
            </button>
          </section>
        </aside>
      </div>
    </main>
  );
}

// ============================================================
// APP
// ============================================================

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

      <footer className="footer">
        <span>POKÉMON JDR</span>
        <span>Prototype Génération I</span>
        <span>© Projet personnel</span>
      </footer>
    </>
  );
}

// ============================================================
// MONTAGE REACT
// ============================================================

const root = createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);