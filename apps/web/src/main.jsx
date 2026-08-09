import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const COLS = 36;
const ROWS = 26;
const TILE = 32;
const WORLD_W = COLS * TILE;
const WORLD_H = ROWS * TILE;
const MAX_ZOOM = 4;

const SPRITES = {
  red: "https://raw.githubusercontent.com/pret/pokered/master/gfx/sprites/red.png",
  pikachu: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/25.png",
  rattata: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/19.png",
  bulbasaur: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/1.png",
};

const BASE_MAP = Array.from({ length: ROWS }, (_, y) => Array.from({ length: COLS }, (_, x) => {
  if (x < 2 || x > COLS - 3 || y < 2 || y > ROWS - 3) return "tree";
  if (x >= 15 && x <= 18 && y >= 2 && y <= 23) return "water";
  if (x >= 16 && x <= 17 && y >= 10 && y <= 15) return "bridge";
  if ((x >= 5 && x <= 30 && y >= 11 && y <= 13) || (x >= 15 && x <= 18)) return "path";
  if (x >= 4 && x <= 10 && y >= 4 && y <= 9) return "grass";
  if (x >= 23 && x <= 31 && y >= 17 && y <= 22) return "tallgrass";
  if ((x + y) % 17 === 0 && y > 3 && y < 22) return "flower";
  return "grass";
}));

const BUILDINGS = [
  { id: "house", x: 5, y: 5, w: 5, h: 4, title: "Maison du joueur", text: "Entrée vers l'intérieur de la maison." },
  { id: "lab", x: 25, y: 5, w: 6, h: 5, title: "Laboratoire du Professeur", text: "Bâtiment important : dialogue, starter et événements MJ." },
  { id: "center", x: 5, y: 17, w: 6, h: 4, title: "Centre Pokémon", text: "Soins de l'équipe et futur accès à l'intérieur du Centre Pokémon." },
  { id: "mart", x: 25, y: 17, w: 5, h: 4, title: "Boutique", text: "Achats d'objets. Le MJ pourra modifier le stock." },
];

const OBJECTS = [
  { id: "oak", x: 22, y: 7, kind: "npc", title: "Professeur Chen", text: "PNJ Gen I. Le MJ peut ouvrir sa fiche, son dialogue et son équipe.", sprite: "red" },
  { id: "rival", x: 12, y: 11, kind: "npc", title: "Rival", text: "PNJ mobile. Sa position et son équipe peuvent être modifiées par le MJ.", sprite: "red" },
  { id: "cut", x: 12, y: 8, kind: "cut", title: "Arbre à couper", text: "Bloque le passage. Nécessite COUPE. Une fois coupé, il disparaît pour cette partie." },
  { id: "boulder", x: 20, y: 19, kind: "strength", title: "Rocher poussable", text: "Nécessite FORCE. Le rocher peut être déplacé case par case." },
  { id: "sign", x: 13, y: 13, kind: "sign", title: "Panneau", text: "Route 1 — Bourg Palette / Jadielle." },
  { id: "pikachu", x: 27, y: 19, kind: "wild", title: "Pikachu caché", text: "Rencontre sauvage. Invisible pour le joueur, visible par le MJ.", sprite: "pikachu", hidden: true },
  { id: "rattata", x: 29, y: 20, kind: "wild", title: "Rattata caché", text: "Rencontre sauvage. Invisible pour le joueur, visible par le MJ.", sprite: "rattata", hidden: true },
  { id: "bulbasaur", x: 8, y: 7, kind: "wild", title: "Bulbizarre caché", text: "Exemple de rencontre MJ dans une zone d'herbes.", sprite: "bulbasaur", hidden: true },
];

function tileWalkable(type) { return !["tree", "water", "house", "lab", "center", "mart"].includes(type); }
function key(x, y) { return `${x}:${y}`; }
function buildTiles(removed, boulder) { return BASE_MAP.map((row, y) => row.map((type, x) => ({ x, y, type: removed.has(key(x, y)) ? "grass" : (boulder.x === x && boulder.y === y ? "rock" : type) }))); }

function Header({ mode, setMode }) { return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · CARTE INTERACTIVE</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>; }
function Tile({ tile }) { return <div className={`tile tile-${tile.type}`} style={{ left: tile.x * TILE, top: tile.y * TILE }} />; }
function Building({ building, onInteract }) { return <button className={`building building-${building.id}`} style={{ left: building.x * TILE, top: building.y * TILE, width: building.w * TILE, height: building.h * TILE }} onClick={() => onInteract(building.id)} title={building.title}><span>{building.id === "lab" ? "LAB" : building.id === "center" ? "P.C." : building.id === "mart" ? "SHOP" : "HOUSE"}</span><i /></button>; }
function ObjectSprite({ object, visible, selected, onInteract }) { if (!visible) return null; const icon = object.sprite ? <img src={SPRITES[object.sprite]} alt="" /> : <span className={`object-icon icon-${object.kind}`} />; return <button className={`map-object object-${object.kind} ${selected ? "selected" : ""}`} style={{ left: object.x * TILE, top: object.y * TILE }} onClick={() => onInteract(object.id)} title={object.title}>{icon}<b>{object.kind === "npc" ? "PNJ" : object.kind === "wild" ? "?" : object.kind === "cut" ? "COUPE" : object.kind === "strength" ? "FORCE" : ""}</b></button>; }

function InteractionPanel({ selected, mode, onAction }) {
  const item = [...OBJECTS, ...BUILDINGS].find(x => x.id === selected);
  if (!item) return <aside className="side-panel"><div className="panel-title">{mode === "gm" ? "MJ · OUTILS" : "JOUEUR · AIDE"}</div><div className="panel-empty"><strong>Carte interactive</strong><p>{mode === "gm" ? "Sélectionnez un PNJ, une rencontre, un obstacle ou un bâtiment." : "Déplacez-vous avec ZQSD, WASD ou les flèches. Approchez-vous d'un objet puis appuyez sur E."}</p></div></aside>;
  return <aside className="side-panel"><div className="panel-title">{mode === "gm" ? "MJ · ÉLÉMENT SÉLECTIONNÉ" : "INTERACTION"}</div><div className="interaction"><span className={`kind kind-${item.kind || "building"}`}>{(item.kind || "building").toUpperCase()}</span><h2>{item.title}</h2><p>{item.text}</p>{mode === "gm" && item.kind === "npc" && <div className="stats"><span>ÉQUIPE</span><strong>À définir</strong><span>NIVEAU</span><strong>À définir</strong><span>PV</span><strong>À définir</strong></div>}<button className="action" onClick={() => onAction(item)}>{mode === "gm" ? "OUVRIR LA FICHE MJ" : "INTERAGIR"}</button></div></aside>;
}
function MapControls({ zoom, setZoom }) { return <div className="controls"><button onClick={() => setZoom(Math.min(MAX_ZOOM, +(zoom + .25).toFixed(2)))}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(Math.max(1, +(zoom - .25).toFixed(2)))}>−</button><button onClick={() => setZoom(1)}>1×</button></div>; }

function GameMap({ mode, selected, setSelected, onAction }) {
  const viewportRef = useRef(null); const pointers = useRef(new Map()); const gesture = useRef(null);
  const [zoom, setZoom] = useState(1); const [camera, setCamera] = useState({ x: 0, y: 0 }); const [player, setPlayer] = useState({ x: 14, y: 14 });
  const [removed, setRemoved] = useState(() => new Set()); const [boulder, setBoulder] = useState({ x: 20, y: 19 }); const [message, setMessage] = useState("");
  const tiles = useMemo(() => buildTiles(removed, boulder), [removed, boulder]);
  const viewport = () => { const el = viewportRef.current; return { w: el?.clientWidth || 800, h: el?.clientHeight || 600 }; };
  const clamp = (x, y, z = zoom) => { const { w, h } = viewport(); const minX = Math.min(0, w - WORLD_W * z); const minY = Math.min(0, h - WORLD_H * z); return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) }; };
  const playerCamera = (p = player) => { const { w, h } = viewport(); return { x: w / 2 - (p.x + .5) * TILE * zoom, y: h / 2 - (p.y + .5) * TILE * zoom }; };
  useEffect(() => { if (mode === "player") setCamera(playerCamera()); else setCamera(c => clamp(c.x, c.y)); }, [player.x, player.y, mode, zoom]);
  useEffect(() => { const f = () => setCamera(mode === "player" ? playerCamera() : clamp(camera.x, camera.y)); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, [mode, player.x, player.y, zoom]);

  function blocked(x, y) { if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return true; if (!tileWalkable(BASE_MAP[y][x])) return true; if (boulder.x === x && boulder.y === y) return true; for (const b of BUILDINGS) if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { const door = x === b.x + Math.floor(b.w / 2) && y === b.y + b.h - 1; if (!door) return true; } return false; }
  function interactNearby(p) { const near = OBJECTS.find(o => Math.abs(o.x - p.x) <= 1 && Math.abs(o.y - p.y) <= 1); if (!near) { setMessage("Aucune interaction à proximité."); return; } setSelected(near.id); if (near.kind === "cut") { const next = new Set(removed); next.add(key(near.x, near.y)); setRemoved(next); setMessage("COUPE : l'arbre a été retiré."); } else if (near.kind === "strength") { const nx = near.x + 1; if (!blocked(nx, near.y)) { setBoulder({ x: nx, y: near.y }); setMessage("FORCE : le rocher a été déplacé d'une case."); } else setMessage("Le rocher ne peut pas être poussé ici."); } else setMessage(near.text); }
  useEffect(() => { if (mode !== "player") return; const down = e => { const k = e.key.toLowerCase(); const dirs = { arrowleft: [-1,0], q: [-1,0], a: [-1,0], arrowright: [1,0], d: [1,0], arrowup: [0,-1], z: [0,-1], w: [0,-1], arrowdown: [0,1], s: [0,1] }; if (k === "e") { e.preventDefault(); interactNearby(player); return; } if (!dirs[k]) return; e.preventDefault(); const [dx,dy] = dirs[k]; const nx = player.x + dx, ny = player.y + dy; if (!blocked(nx,ny)) setPlayer({ x:nx, y:ny }); }; window.addEventListener("keydown", down, { passive:false }); return () => window.removeEventListener("keydown", down); }, [mode, player, removed, boulder]);

  function pointerDown(e) { if (mode !== "gm") return; e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY}); if (pointers.current.size === 1) gesture.current={type:"pan",x:e.clientX,y:e.clientY,origin:camera}; else if (pointers.current.size === 2) { const p=[...pointers.current.values()]; gesture.current={type:"pinch",distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom,origin:camera}; } }
  function pointerMove(e) { if (mode !== "gm" || !pointers.current.has(e.pointerId)) return; pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY}); const p=[...pointers.current.values()]; if (p.length === 1 && gesture.current?.type === "pan") { const g=gesture.current; setCamera(clamp(g.origin.x+e.clientX-g.x,g.origin.y+e.clientY-g.y)); } else if (p.length === 2 && gesture.current?.type === "pinch") { const g=gesture.current; const d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y); setZoom(Math.min(MAX_ZOOM,Math.max(1,+(g.zoom*d/g.distance).toFixed(2)))); } }
  function pointerUp(e) { pointers.current.delete(e.pointerId); if (!pointers.current.size) gesture.current=null; }
  function wheel(e) { if (mode !== "gm") return; e.preventDefault(); if (e.ctrlKey) setZoom(z=>Math.min(MAX_ZOOM,Math.max(1,+(z+(e.deltaY<0?.15:-.15)).toFixed(2)))); else setCamera(c=>clamp(c.x-e.deltaX,c.y-e.deltaY)); }

  const pos = mode === "player" ? playerCamera() : camera;
  return <div className="map-shell"><div className="map-heading"><div><span>MONDE DE JEU</span><strong>BOURG PALETTE · ROUTE 1</strong></div><small>{mode === "gm" ? "MJ · 1 DOIGT / SOURIS = PAN · 2 DOIGTS = PAN + PINCEMENT" : "JOUEUR · ZQSD / WASD / FLÈCHES · E = INTERAGIR"}</small></div>{mode === "gm" && <MapControls zoom={zoom} setZoom={z=>{setZoom(z);setCamera(c=>clamp(c.x,c.y,z));}} />}<div ref={viewportRef} className="map-viewport" onWheel={wheel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>{message && <div className="map-toast">{message}</div>}<div className="world" style={{left:pos.x,top:pos.y,width:WORLD_W,height:WORLD_H,transform:`scale(${zoom})`}}>{tiles.flat().map(t=><Tile tile={t} key={`${t.x}-${t.y}`} />)}{BUILDINGS.map(b=><Building key={b.id} building={b} onInteract={id=>{setSelected(id);setMessage(BUILDINGS.find(x=>x.id===id).text);}}/>)}{OBJECTS.map(o=><ObjectSprite key={o.id} object={o} visible={o.kind!=="wild"||mode==="gm"} selected={selected===o.id} onInteract={id=>{setSelected(id);setMessage(OBJECTS.find(x=>x.id===id).text);}}/>)}<div className="player" style={{left:player.x*TILE,top:player.y*TILE}}><img src={SPRITES.red} alt="Dresseur"/><span>VOUS</span></div></div></div></div>;
}

function App(){ const [mode,setMode]=useState("player"); const [selected,setSelected]=useState(null); const [message,setMessage]=useState(""); const action=item=>setMessage(`${item.title} : interaction JDR activée.`); return <div className={`game ${mode=== "gm" ? "gm-mode":"player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="layout"><section><GameMap mode={mode} selected={selected} setSelected={setSelected} onAction={action}/></section><InteractionPanel selected={selected} mode={mode} onAction={action}/></main>{message&&<div className="global-message" onClick={()=>setMessage("")}>{message}</div>}</div>; }

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
