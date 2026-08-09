import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const COLS = 32, ROWS = 24, TILE = 32;
const WORLD_W = COLS * TILE, WORLD_H = ROWS * TILE, MAX_ZOOM = 4;
const RED_SPRITE = "https://raw.githubusercontent.com/pret/pokered/master/gfx/sprites/red.png";
const SPRITES = {
  pikachu: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/25.png",
  rattata: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/19.png",
  bulbasaur: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/1.png"
};

const BASE_MAP = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => {
  if (x === 0 || y === 0 || x === COLS - 1 || y === ROWS - 1) return "tree";
  if (x >= 13 && x <= 16 && y >= 1 && y <= 22) return "water";
  if (x === 14 || x === 15) return "bridge";
  if ((y >= 11 && y <= 13) || (x >= 14 && x <= 15)) return "path";
  if (x >= 3 && x <= 9 && y >= 4 && y <= 9) return "grass";
  if (x >= 21 && x <= 28 && y >= 16 && y <= 21) return "tallgrass";
  if ((x * 7 + y * 11) % 31 === 0) return "flower";
  return "grass";
}));

const BUILDINGS = [
  { id: "house", x: 4, y: 4, w: 5, h: 4, title: "Maison de Red", text: "Entrée de la maison du joueur." },
  { id: "lab", x: 24, y: 4, w: 6, h: 5, title: "Laboratoire du Professeur Chen", text: "Laboratoire de Bourg Palette." },
  { id: "center", x: 4, y: 17, w: 6, h: 4, title: "Centre Pokémon", text: "Soins Pokémon." },
  { id: "mart", x: 24, y: 17, w: 5, h: 4, title: "Boutique", text: "Objets et achats." }
];

const OBJECTS = [
  { id: "oak", x: 21, y: 7, kind: "npc", title: "Professeur Chen", text: "PNJ Gen I." },
  { id: "rival", x: 11, y: 11, kind: "npc", title: "Rival", text: "PNJ mobile." },
  { id: "cut", x: 11, y: 8, kind: "cut", title: "Arbre à couper", text: "Nécessite COUPE." },
  { id: "boulder", x: 19, y: 19, kind: "strength", title: "Rocher poussable", text: "Nécessite FORCE." },
  { id: "sign", x: 12, y: 13, kind: "sign", title: "Panneau", text: "BOURG PALETTE — ROUTE 1." },
  { id: "pikachu", x: 25, y: 18, kind: "wild", title: "Pikachu caché", text: "Rencontre sauvage.", sprite: "pikachu", hidden: true },
  { id: "rattata", x: 27, y: 19, kind: "wild", title: "Rattata caché", text: "Rencontre sauvage.", sprite: "rattata", hidden: true },
  { id: "bulbasaur", x: 7, y: 6, kind: "wild", title: "Bulbizarre caché", text: "Rencontre sauvage.", sprite: "bulbasaur", hidden: true }
];

const key = (x, y) => `${x}:${y}`;
const walkable = type => !["tree", "water"].includes(type);

function Header({ mode, setMode }) {
  return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>;
}

function RedSprite({ direction = "down" }) {
  const frame = { down: 0, up: 1, left: 2, right: 3 }[direction] ?? 0;
  return <span className={`red-sprite red-${direction}`} style={{ backgroundImage: `url(${RED_SPRITE})`, backgroundPosition: `0 -${frame * 32}px` }} />;
}

function Tile({ type, x, y }) {
  return <div className={`tile tile-${type}`} style={{ left: x * TILE, top: y * TILE }} />;
}

function Building({ building, onClick }) {
  const label = building.id === "lab" ? "LAB" : building.id === "center" ? "P.C." : building.id === "mart" ? "SHOP" : "HOUSE";
  return <button className={`building building-${building.id}`} style={{ left: building.x * TILE, top: building.y * TILE, width: building.w * TILE, height: building.h * TILE }} onClick={() => onClick(building)} title={building.title}><span>{label}</span><i /></button>;
}

function MapObject({ object, visible, selected, onClick }) {
  if (!visible) return null;
  let content;
  if (object.sprite) content = <img src={SPRITES[object.sprite]} alt="" />;
  else if (object.kind === "npc") content = <RedSprite />;
  else content = <span className={`object-icon icon-${object.kind}`} />;
  const label = object.kind === "npc" ? "PNJ" : object.kind === "wild" ? "?" : object.kind === "cut" ? "COUPE" : object.kind === "strength" ? "FORCE" : "";
  return <button className={`map-object object-${object.kind} ${selected ? "selected" : ""}`} style={{ left: object.x * TILE, top: object.y * TILE }} onClick={() => onClick(object)} title={object.title}>{content}<b>{label}</b></button>;
}

function SidePanel({ mode, selected, onAction }) {
  const item = [...OBJECTS, ...BUILDINGS].find(x => x.id === selected);
  if (!item) return <aside className="side-panel"><div className="panel-title">{mode === "gm" ? "MJ · OUTILS" : "JOUEUR · AIDE"}</div><div className="panel-empty"><strong>Carte Gen I interactive</strong><p>{mode === "gm" ? "Sélectionnez un PNJ, une rencontre ou un élément du décor." : "ZQSD / WASD / flèches pour marcher. E pour interagir."}</p></div></aside>;
  return <aside className="side-panel"><div className="panel-title">{mode === "gm" ? "MJ · ÉLÉMENT" : "INTERACTION"}</div><div className="interaction"><span className={`kind kind-${item.kind || "building"}`}>{(item.kind || "building").toUpperCase()}</span><h2>{item.title}</h2><p>{item.text}</p>{mode === "gm" && item.kind === "npc" && <div className="stats"><span>ÉQUIPE</span><strong>À définir</strong><span>NIVEAU</span><strong>À définir</strong><span>PV</span><strong>À définir</strong></div>}<button className="action" onClick={() => onAction(item)}>{mode === "gm" ? "OUVRIR LA FICHE MJ" : "INTERAGIR"}</button></div></aside>;
}

function MapControls({ zoom, setZoom }) {
  return <div className="controls"><button onClick={() => setZoom(Math.min(MAX_ZOOM, +(zoom + 0.25).toFixed(2)))}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.max(1, +(zoom - 0.25).toFixed(2)))}>−</button><button onClick={() => setZoom(1)}>1×</button></div>;
}

function GameMap({ mode, selected, setSelected, onAction }) {
  const viewportRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [player, setPlayer] = useState({ x: 12, y: 14, direction: "down" });
  const [removed, setRemoved] = useState(() => new Set());
  const [boulder, setBoulder] = useState({ x: 19, y: 19 });
  const [message, setMessage] = useState("");

  const tiles = useMemo(() => BASE_MAP.flatMap((row, y) => row.map((type, x) => ({ x, y, type: removed.has(key(x, y)) ? "grass" : (boulder.x === x && boulder.y === y ? "rock" : type) }))), [removed, boulder]);
  const viewport = () => { const el = viewportRef.current; return { w: el?.clientWidth || 800, h: el?.clientHeight || 600 }; };
  const clamp = (x, y, z = zoom) => { const { w, h } = viewport(); const minX = Math.min(0, w - WORLD_W * z); const minY = Math.min(0, h - WORLD_H * z); return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) }; };
  const playerCamera = (p = player, z = zoom) => { const { w, h } = viewport(); return { x: w / 2 - (p.x + 0.5) * TILE * z, y: h / 2 - (p.y + 0.5) * TILE * z }; };

  useEffect(() => { setCamera(mode === "player" ? playerCamera() : c => clamp(c.x, c.y)); }, [mode, player.x, player.y, zoom]);
  useEffect(() => { const resize = () => setCamera(mode === "player" ? playerCamera() : c => clamp(c.x, c.y)); window.addEventListener("resize", resize); return () => window.removeEventListener("resize", resize); }, [mode, player.x, player.y, zoom]);

  function blocked(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true;
    if (!walkable(BASE_MAP[y][x])) return true;
    if (boulder.x === x && boulder.y === y) return true;
    for (const b of BUILDINGS) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) {
      const door = x === b.x + Math.floor(b.w / 2) && y === b.y + b.h - 1;
      if (!door) return true;
    }
    return false;
  }

  function interact(p) {
    const dx = p.direction === "left" ? -1 : p.direction === "right" ? 1 : 0;
    const dy = p.direction === "up" ? -1 : p.direction === "down" ? 1 : 0;
    const tx = p.x + dx, ty = p.y + dy;
    const object = OBJECTS.find(o => o.x === tx && o.y === ty);
    const building = BUILDINGS.find(b => tx >= b.x && tx < b.x + b.w && ty >= b.y && ty < b.y + b.h);
    if (object) {
      setSelected(object.id);
      if (object.kind === "cut") { const next = new Set(removed); next.add(key(object.x, object.y)); setRemoved(next); setMessage("COUPE : arbre supprimé."); }
      else if (object.kind === "strength") {
        const nx = object.x + dx, ny = object.y + dy;
        if (!blocked(nx, ny)) { setBoulder({ x: nx, y: ny }); setMessage("FORCE : rocher déplacé."); }
        else setMessage("Le rocher ne peut pas être poussé ici.");
      } else setMessage(object.text);
    } else if (building) { setSelected(building.id); setMessage(building.text); }
    else setMessage("Aucune interaction ici.");
  }

  useEffect(() => {
    if (mode !== "player") return;
    const dirs = { arrowleft: [-1, 0, "left"], q: [-1, 0, "left"], a: [-1, 0, "left"], arrowright: [1, 0, "right"], d: [1, 0, "right"], arrowup: [0, -1, "up"], z: [0, -1, "up"], w: [0, -1, "up"], arrowdown: [0, 1, "down"], s: [0, 1, "down"] };
    const down = e => {
      const k = e.key.toLowerCase();
      if (k === "e") { e.preventDefault(); interact(player); return; }
      const dir = dirs[k];
      if (!dir) return;
      e.preventDefault();
      const [dx, dy, direction] = dir;
      setPlayer(p => { const nx = p.x + dx, ny = p.y + dy; return blocked(nx, ny) ? { ...p, direction } : { x: nx, y: ny, direction }; });
    };
    window.addEventListener("keydown", down, { passive: false });
    return () => window.removeEventListener("keydown", down);
  }, [mode, player, removed, boulder]);

  function pointerDown(e) {
    if (mode !== "gm") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 1) gesture.current = { type: "pan", x: e.clientX, y: e.clientY, origin: camera };
    else if (pointers.current.size === 2) { const p = [...pointers.current.values()]; gesture.current = { type: "pinch", distance: Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y), zoom }; }
  }

  function pointerMove(e) {
    if (mode !== "gm" || !pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const p = [...pointers.current.values()];
    if (p.length === 1 && gesture.current?.type === "pan") { const g = gesture.current; setCamera(clamp(g.origin.x + e.clientX - g.x, g.origin.y + e.clientY - g.y)); }
    else if (p.length === 2 && gesture.current?.type === "pinch") { const g = gesture.current; const d = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); setZoom(Math.min(MAX_ZOOM, Math.max(1, +(g.zoom * d / g.distance).toFixed(2)))); }
  }

  function pointerUp(e) { pointers.current.delete(e.pointerId); if (!pointers.current.size) gesture.current = null; }

  function wheel(e) {
    if (mode !== "gm") return;
    e.preventDefault();
    if (e.ctrlKey) setZoom(z => Math.min(MAX_ZOOM, Math.max(1, +(z + (e.deltaY < 0 ? 0.15 : -0.15)).toFixed(2))));
    else setCamera(c => clamp(c.x - e.deltaX, c.y - e.deltaY));
  }

  const pos = mode === "player" ? playerCamera() : camera;
  return <div className="map-shell"><div className="map-heading"><div><span>MONDE DE JEU</span><strong>BOURG PALETTE · ROUTE 1</strong></div><small>{mode === "gm" ? "MJ · PAN / PINCEMENT / MOLETTE" : "JOUEUR · ZQSD / WASD / FLÈCHES · E"}</small></div>{mode === "gm" && <MapControls zoom={zoom} setZoom={z => { setZoom(z); setCamera(c => clamp(c.x, c.y, z)); }} />}<div ref={viewportRef} className="map-viewport" onWheel={wheel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>{message && <div className="map-toast">{message}</div>}<div className="world" style={{ left: pos.x, top: pos.y, width: WORLD_W, height: WORLD_H, transform: `scale(${zoom})` }}><div className="texture-attribution">TUILES ORIGINALES · POKERED</div>{tiles.map(t => <Tile key={`${t.x}-${t.y}`} type={t.type} x={t.x} y={t.y} />)}{BUILDINGS.map(b => <Building key={b.id} building={b} onClick={item => { setSelected(item.id); onAction(item); }} />)}{OBJECTS.map(o => <MapObject key={o.id} object={o} visible={mode === "gm" || !o.hidden} selected={selected === o.id} onClick={item => { setSelected(item.id); onAction(item); }} />)}{mode === "player" && <div className="player" style={{ left: player.x * TILE, top: player.y * TILE }}><RedSprite direction={player.direction} /></div>}</div></div></div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [selected, setSelected] = useState(null);
  const [message, setMessage] = useState("");
  const action = item => setMessage(`${item.title} : ${item.text}`);
  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}><Header mode={mode} setMode={setMode} /><main className="layout"><GameMap mode={mode} selected={selected} setSelected={setSelected} onAction={action} /><SidePanel mode={mode} selected={selected} onAction={action} /></main>{message && <button className="global-message" onClick={() => setMessage("")}>{message}</button>}</div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
