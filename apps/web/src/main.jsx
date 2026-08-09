import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

// Pokémon Rouge/Bleu Route 1: 21 x 36 tiles, 16 px per tile.
const TILE = 16;
const MAP_WIDTH = 21;
const MAP_HEIGHT = 36;
const MAP_IMAGE =
  "https://archives.bulbagarden.net/wiki/Special:Redirect/file/Kanto_Route_1_RBY.png";

const TILE_TYPES = {
  grass: { label: "Herbe", blocked: false },
  path: { label: "Chemin", blocked: false },
  tree: { label: "Arbre", blocked: true },
  wall: { label: "Obstacle", blocked: true },
};

// Logical collision layer. The visible terrain itself is the authentic Gen I map image.
// T = obstacle, G = walkable. This keeps movement deterministic while the visual map
// can be replaced later by a full tile-by-tile collision map.
const MAP = Array.from({ length: MAP_HEIGHT }, (_, y) => {
  if (y === 0 || y === MAP_HEIGHT - 1) return "T".repeat(MAP_WIDTH);
  return `T${"G".repeat(MAP_WIDTH - 2)}T`;
});

const BUILDINGS = [];

const NPCS = [
  {
    id: "old-man",
    name: "Habitant",
    role: "PNJ de Route 1",
    x: 9,
    y: 20,
    team: [],
    dialogue: "La route relie Bourg Palette à Jadielle.",
  },
  {
    id: "youngster",
    name: "Léo",
    role: "Dresseur",
    x: 12,
    y: 13,
    team: [
      { name: "Rattata", level: 8, hp: 22, type: "Normal", id: 19 },
      { name: "Roucool", level: 9, hp: 24, type: "Normal / Vol", id: 16 },
    ],
    dialogue: "Mon équipe est prête ! Tu veux faire un combat ?",
  },
];

const WILD_POKEMON = [
  { id: 19, name: "Rattata", level: 5, x: 6, y: 11, type: "Normal", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/19.png" },
  { id: 16, name: "Roucool", level: 7, x: 14, y: 16, type: "Normal / Vol", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/16.png" },
  { id: 10, name: "Chenipan", level: 4, x: 8, y: 24, type: "Insecte", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/10.png" },
  { id: 13, name: "Aspicot", level: 6, x: 13, y: 27, type: "Insecte / Poison", sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/13.png" },
];

const PLAYER_START = { x: 10, y: 32 };

function isBlocked(x, y) {
  if (x < 0 || y < 0 || x >= MAP_WIDTH || y >= MAP_HEIGHT) return true;
  return MAP[y][x] === "T";
}

function Header({ mode, setMode }) {
  return (
    <header className="topbar">
      <div className="brand">
        <div className="pokeball-logo"><span /></div>
        <div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div>
      </div>
      <div className="mode-switch">
        <button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button>
        <button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button>
      </div>
    </header>
  );
}

function PlayerHUD({ player }) {
  return (
    <div className="player-hud">
      <div className="trainer-icon" />
      <div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>Niveau 12 · 1 240 XP</small></div>
      <div className="location"><span>LOCALISATION</span><strong>ROUTE 1</strong><small>KANTO</small></div>
      <div className="coordinates">X {player.x} · Y {player.y}</div>
    </div>
  );
}

function GMPanel({ selected, player }) {
  if (!selected) {
    return <aside className="gm-panel"><div className="panel-title">OUTILS DU MJ</div><div className="gm-message"><strong>Mode Maître du Jeu</strong><p>La carte utilise maintenant le décor authentique de Route 1 Gen I. Cliquez sur un PNJ ou un Pokémon sauvage pour ses informations.</p><div className="gm-stat"><span>Position joueur</span><b>{player.x}, {player.y}</b></div><div className="gm-stat"><span>Pokémon sauvages</span><b>{WILD_POKEMON.length}</b></div><div className="gm-stat"><span>PNJ présents</span><b>{NPCS.length}</b></div></div></aside>;
  }

  return <aside className="gm-panel">
    <div className="panel-title">{selected.kind === "wild" ? "POKÉMON SAUVAGE" : "PNJ"}</div>
    {selected.kind === "wild" ? <>
      <div className="selected-pokemon"><img src={selected.data.sprite} alt={selected.data.name}/><div><strong>{selected.data.name}</strong><span>Niveau {selected.data.level}</span></div></div>
      <div className="info-row"><span>Type</span><b>{selected.data.type}</b></div>
      <div className="info-row"><span>Position</span><b>{selected.data.x}, {selected.data.y}</b></div>
      <div className="encounter-warning">Pokémon caché au joueur</div>
    </> : <>
      <div className="npc-header"><div className="npc-avatar"/><div><strong>{selected.data.name}</strong><span>{selected.data.role}</span></div></div>
      <div className="info-row"><span>Position</span><b>{selected.data.x}, {selected.data.y}</b></div>
      <h4>ÉQUIPE</h4>
      {selected.data.team.length === 0 ? <div className="gm-message"><p>Aucun Pokémon enregistré.</p></div> : selected.data.team.map((pokemon) => <div className="npc-pokemon" key={pokemon.name}><img className="npc-sprite" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemon.id}.png`} alt=""/><div><strong>{pokemon.name}</strong><span>{pokemon.type}</span><small>Niv. {pokemon.level} · PV {pokemon.hp}</small></div></div>)}
      <div className="dialogue-box"><span>DIALOGUE</span><p>« {selected.data.dialogue} »</p></div>
    </>}
  </aside>;
}

function Building() { return null; }

function NPC({ npc, onSelect, mode }) {
  return <button className="map-character npc" style={{ left: npc.x * TILE - 8, top: npc.y * TILE - 12 }} onClick={() => mode === "gm" && onSelect({ kind: "npc", data: npc })} title={mode === "gm" ? npc.name : undefined}>
    <span className="character-shadow"/><span className="npc-body"/>{mode === "gm" && <span className="npc-label">{npc.name}</span>}
  </button>;
}

function WildPokemon({ pokemon, mode, onSelect }) {
  if (mode !== "gm") return null;
  return <button className="wild-pokemon" style={{ left: pokemon.x * TILE - 7, top: pokemon.y * TILE - 15 }} onClick={() => onSelect({ kind: "wild", data: pokemon })} title={pokemon.name}>
    <span className="wild-marker">!</span><img src={pokemon.sprite} alt={pokemon.name}/><span>{pokemon.name}</span>
  </button>;
}

function PlayerCharacter({ player, moving }) {
  return <div className={`player-character ${moving ? "moving" : ""}`} style={{ left: player.x * TILE - 8, top: player.y * TILE - 12 }}>
    <span className="character-shadow"/><span className="player-sprite"/>
  </div>;
}

function ZoomControls({ zoom, setZoom }) {
  return <div className="map-zoom-controls">
    <button onClick={() => setZoom((z) => Math.min(3, +(z + 0.25).toFixed(2)))}>+</button>
    <span>{Math.round(zoom * 100)}%</span>
    <button onClick={() => setZoom((z) => Math.max(1, +(z - 0.25).toFixed(2)))}>−</button>
    <button onClick={() => setZoom(1)}>1×</button>
  </div>;
}

function GameMap({ mode, player, setPlayer, onSelect }) {
  const [moving, setMoving] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    function handleKeyDown(event) {
      const key = event.key.toLowerCase();
      const allowed = ["arrowup", "arrowdown", "arrowleft", "arrowright", "z", "q", "s", "d", "w", "a"];
      if (!allowed.includes(key)) return;
      event.preventDefault();
      let dx = 0, dy = 0;
      if (key === "arrowup" || key === "z" || key === "w") dy = -1;
      if (key === "arrowdown" || key === "s") dy = 1;
      if (key === "arrowleft" || key === "q" || key === "a") dx = -1;
      if (key === "arrowright" || key === "d") dx = 1;
      const next = { x: player.x + dx, y: player.y + dy };
      if (!isBlocked(next.x, next.y)) {
        setPlayer(next); setMoving(true); window.setTimeout(() => setMoving(false), 120);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [player, setPlayer]);

  useEffect(() => { if (mode === "player") setZoom(1); }, [mode]);

  const mapWidth = MAP_WIDTH * TILE;
  const mapHeight = MAP_HEIGHT * TILE;
  const playerPxX = player.x * TILE + TILE / 2;
  const playerPxY = player.y * TILE + TILE / 2;
  const scale = zoom;

  const cameraStyle = useMemo(() => {
    if (mode === "gm") {
      return { width: mapWidth, height: mapHeight, transform: `scale(${scale})`, transformOrigin: "top left" };
    }
    return { width: mapWidth, height: mapHeight, transform: "scale(1)", transformOrigin: "top left" };
  }, [mapWidth, mapHeight, mode, scale]);

  const viewportStyle = mode === "player" ? {
    "--camera-x": `${-(playerPxX - 224)}px`,
    "--camera-y": `${-(playerPxY - 224)}px`,
  } : undefined;

  return <div className="map-shell">
    {mode === "gm" && <ZoomControls zoom={zoom} setZoom={setZoom}/>} 
    <div className="map-viewport" style={viewportStyle}>
      <div className="map-camera" style={cameraStyle}>
        <div className="gen1-map-background" style={{ backgroundImage: `url(${MAP_IMAGE})` }} />
        {NPCS.map((npc) => <NPC key={npc.id} npc={npc} mode={mode} onSelect={onSelect}/>) }
        {WILD_POKEMON.map((pokemon) => <WildPokemon key={`${pokemon.id}-${pokemon.x}-${pokemon.y}`} pokemon={pokemon} mode={mode} onSelect={onSelect}/>) }
        <PlayerCharacter player={player} moving={moving}/>
      </div>
    </div>
    {mode === "gm" && <div className="zoom-hint">Molette ou boutons : zoom MJ · 100–300 %</div>}
  </div>;
}

function Controls() {
  return <div className="controls"><div className="dpad"><button>▲</button><div><button>◀</button><button>●</button><button>▶</button></div><button>▼</button></div><div className="controls-text"><strong>DÉPLACEMENT</strong><span>ZQSD · WASD · FLÈCHES</span></div></div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [player, setPlayer] = useState(PLAYER_START);
  const [selected, setSelected] = useState(null);
  useEffect(() => setSelected(null), [mode]);

  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}>
    <Header mode={mode} setMode={setMode}/>
    <main className="game-layout">
      <section className="game-area">
        <PlayerHUD player={player}/>
        <div className="map-heading"><div><span>CARTE DE JEU</span><strong>ROUTE 1 · KANTO</strong></div><small>{mode === "gm" ? "VUE MJ · CARTE COMPLÈTE" : "VUE JOUEUR · CAMÉRA CENTRÉE"}</small></div>
        <GameMap mode={mode} player={player} setPlayer={setPlayer} onSelect={setSelected}/>
        <Controls/>
        <div className="mode-indicator"><span className={`indicator-dot ${mode === "gm" ? "gm-dot" : "player-dot"}`}/>{mode === "gm" ? "MODE MAÎTRE DU JEU" : "MODE JOUEUR"}</div>
      </section>
      {mode === "gm" ? <GMPanel selected={selected} player={player}/> : <aside className="player-panel">
        <div className="panel-title">ÉQUIPE</div>
        {[{name:"Pikachu",level:18,hp:"52 / 52",id:25,width:"100%"},{name:"Salamèche",level:16,hp:"38 / 44",id:4,width:"86%"}].map((p)=><div className="team-card" key={p.name}><img className="team-sprite" src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`} alt={p.name}/><div className="team-info"><strong>{p.name}</strong><span>Niveau {p.level}</span><div className="hp-label">PV <b>{p.hp}</b></div><div className="hp-bar"><div className="hp-fill" style={{width:p.width}}/></div></div></div>)}
        <div className="panel-section"><span>ZONE</span><strong>Route 1</strong></div><div className="panel-section"><span>RENCONTRES</span><strong>Herbes hautes</strong><small>Pokémon sauvages possibles</small></div>
      </aside>}
    </main>
  </div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
