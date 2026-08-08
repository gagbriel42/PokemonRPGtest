import React, { useMemo, useState } from "react";
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
const percentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));

return ( <div className="hp-wrapper"> <div className="hp-label"> <span>PV</span> <strong>
{hp} / {maxHp} </strong> </div>

```
  <div className="hp-bar">
    <div className="hp-fill" style={{ width: `${percentage}%` }} />
  </div>
</div>
```

);
}

function Header({ mode, setMode }) {
return ( <header className="topbar"> <div className="logo"> <span className="pokeball-mini">●</span> <div> <strong>POKÉMON JDR</strong> <small>Génération I · RPG</small> </div> </div>

```
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
```

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

```
setDiceResult({
  sides,
  result,
});

setLog((previous) => [
  `🎲 Jet de D${sides} : ${result}`,
  ...previous,
]);
```

}

function playCry() {
const audio = new Audio(
`${POKEAPI}/pokemon/${activePokemon.id}`
);

```
fetch(`${POKEAPI}/pokemon/${activePokemon.id}`)
  .then((response) => response.json())
  .then((data) => {
    if (data.cries?.latest) {
      new Audio(data.cries.latest).play();
    }
  })
  .catch(() => {});
```

}

return ( <main className="game-layout player-layout"> <section className="player-hero panel"> <div className="location"> <span>LOCALISATION</span> <strong>ROUTE 1</strong> <small>Kanto · 16:42</small> </div>

```
    <div className="trainer">
      <div className="trainer-avatar">🧢</div>
      <div>
        <span>DRESSEUR</span>
        <strong>GABRIEL</strong>
        <small>Niveau 12 · 1 240 XP</small>
      </div>
    </div>
  </section>

  <section className="battle-panel panel">
    <div className="battle-header">
      <div>
        <span>POKÉMON ACTIF</span>
        <h2>{activePokemon.name}</h2>
      </div>

      <div className="battle-actions">
        <button onClick={playCry}>🔊 CRI</button>
        <button onClick={() => rollDice(20)}>🎲 D20</button>
      </div>
    </div>

    <div className="pokemon-stage">
      <div className="grass-shadow" />

      <Sprite
        src={activePokemon.sprite}
        fallback={activePokemon.fallback}
        alt={activePokemon.name}
      />

      <div className="pokemon-info">
        <div className="name-level">
          <strong>{activePokemon.name}</strong>
          <span>Lv. {activePokemon.level}</span>
        </div>

        <HpBar
          hp={activePokemon.hp}
          maxHp={activePokemon.maxHp}
        />

        <div className="types">
          {activePokemon.type.map((type) => (
            <span key={type} className={`type type-${type.toLowerCase()}`}>
              {type}
            </span>
          ))}
        </div>
      </div>
    </div>
  </section>

  <section className="team-panel panel">
    <div className="panel-title">
      <h2>ÉQUIPE</h2>
      <span>{pokemon.length} / 6</span>
    </div>

    <div className="team-grid">
      {pokemon.map((poke) => (
        <button
          key={poke.id}
          className={`team-card ${
            activePokemon.id === poke.id ? "selected" : ""
          }`}
          onClick={() => setActivePokemon(poke)}
        >
          <Sprite
            src={poke.sprite}
            fallback={poke.fallback}
            alt={poke.name}
          />

          <div>
            <strong>{poke.name}</strong>
            <span>Lv. {poke.level}</span>
          </div>

          <HpBar hp={poke.hp} maxHp={poke.maxHp} />
        </button>
      ))}
    </div>
  </section>

  <section className="dice-panel panel">
    <div className="panel-title">
      <h2>JET DE DÉS</h2>
      {diceResult && (
        <strong className="dice-result">
          D{diceResult.sides} → {diceResult.result}
        </strong>
      )}
    </div>

    <div className="dice-buttons">
      {[4, 6, 8, 10, 12, 20, 100].map((sides) => (
        <button key={sides} onClick={() => rollDice(sides)}>
          D{sides}
        </button>
      ))}
    </div>
  </section>

  <section className="inventory panel">
    <div className="panel-title">
      <h2>INVENTAIRE</h2>
    </div>

    <div className="items">
      <div className="item">
        <span>🔴</span>
        <strong>Poké Ball</strong>
        <b>x12</b>
      </div>

      <div className="item">
        <span>🧪</span>
        <strong>Potion</strong>
        <b>x5</b>
      </div>

      <div className="item">
        <span>🍖</span>
        <strong>Rappel</strong>
        <b>x2</b>
      </div>

      <div className="item">
        <span>💰</span>
        <strong>Pokédollars</strong>
        <b>1 240</b>
      </div>
    </div>
  </section>

  <section className="journal panel">
    <div className="panel-title">
      <h2>JOURNAL</h2>
    </div>

    <div className="log">
      {log.map((entry, index) => (
        <p key={index}>{entry}</p>
      ))}
    </div>
  </section>
</main>
```

);
}

function MapGrid() {
const cells = Array.from({ length: 96 });

return ( <div className="map-grid">
{cells.map((_, index) => {
const water = [4, 5, 6, 7, 8, 9, 20, 21, 22, 23, 24, 25].includes(
index
);

```
    const forest = [34, 35, 36, 44, 45, 46, 54, 55, 56, 57].includes(
      index
    );

    return (
      <div
        key={index}
        className={`map-cell ${water ? "water" : ""} ${
          forest ? "forest" : ""
        }`}
      >
        {forest ? "♣" : water ? "~" : ""}
      </div>
    );
  })}

  <div className="map-player">🧢</div>
  <div className="map-pokemon">!</div>
</div>
```

);
}

function GMInterface() {
const [encounter, setEncounter] = useState(wildPokemon[0]);
const [showTokens, setShowTokens] = useState(true);
const [gmLog, setGmLog] = useState([
"Session ouverte.",
"Gabriel est actuellement sur la Route 1.",
"Aucune rencontre déclenchée.",
]);

function randomEncounter() {
const selected =
wildPokemon[Math.floor(Math.random() * wildPokemon.length)];

```
setEncounter(selected);

setGmLog((previous) => [
  `⚡ Rencontre : ${selected.name} niveau ${selected.level}`,
  ...previous,
]);
```

}

return ( <main className="gm-layout"> <section className="gm-toolbar panel"> <div> <span>MODE MAÎTRE DU JEU</span> <h1>TABLE DE JEU</h1> </div>

```
    <div className="gm-buttons">
      <button onClick={randomEncounter}>⚡ RENCONTRE</button>

      <button onClick={() => setShowTokens(!showTokens)}>
        {showTokens ? "👁 MASQUER TOKENS" : "👁 AFFICHER TOKENS"}
      </button>
    </div>
  </section>

  <section className="gm-map panel">
    <div className="panel-title">
      <h2>CARTE — ROUTE 1</h2>
      <span>VISIBLE MJ UNIQUEMENT</span>
    </div>

    <div className="map-wrapper">
      <MapGrid />

      {showTokens && (
        <>
          <div className="map-token player-token">🧢</div>
          <div className="map-token npc-token">🧑</div>
          <div className="map-token pokemon-token">⚡</div>
        </>
      )}
    </div>
  </section>

  <section className="gm-columns">
    <div className="encounter panel">
      <div className="panel-title">
        <h2>RENCONTRE ACTIVE</h2>
      </div>

      <div className="encounter-content">
        <Sprite src={encounter.sprite} alt={encounter.name} />

        <div>
          <span>POKÉMON SAUVAGE</span>
          <h2>{encounter.name}</h2>
          <strong>Niveau {encounter.level}</strong>
          <p>{encounter.type}</p>

          <HpBar
            hp={encounter.hp}
            maxHp={encounter.maxHp}
          />

          <div className="encounter-actions">
            <button>⚔️ COMBAT</button>
            <button>🏃 FUITE</button>
            <button>🎯 CAPTURE</button>
          </div>
        </div>
      </div>
    </div>

    <div className="players panel">
      <div className="panel-title">
        <h2>JOUEURS</h2>
        <span>1 CONNECTÉ</span>
      </div>

      <div className="player-row">
        <div className="player-icon">🧢</div>

        <div>
          <strong>Gabriel</strong>
          <span>Route 1 · Actif</span>
        </div>

        <span className="online">●</span>
      </div>
    </div>
  </section>

  <section className="gm-log panel">
    <div className="panel-title">
      <h2>JOURNAL MJ</h2>
    </div>

    {gmLog.map((entry, index) => (
      <p key={index}>{entry}</p>
    ))}
  </section>
</main>
```

);
}

function App() {
const [mode, setMode] = useState("player");

return (
<> <Header mode={mode} setMode={setMode} />

```
  {mode === "player" ? (
    <PlayerInterface />
  ) : (
    <GMInterface />
  )}

  <footer>
    <span>POKÉMON JDR</span>
    <span>Prototype · Génération I</span>
  </footer>
</>
```

);
}

createRoot(document.getElementById("root")).render(
<React.StrictMode> <App />
</React.StrictMode>
);
