import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

// Full Gen I Kanto rendering. The source image is 7520x6400; keeping its
// native aspect ratio is essential or the whole map becomes visibly distorted.
const MAP_IMAGE = "https://fotografias-2.larazon.es/assets/videojuegos/2019/04/Mapa-de-Kanto.jpg";
const MAP_WIDTH = 7520;
const MAP_HEIGHT = 6400;
const FIT_SCALE = 0.105;
const MAX_GM_ZOOM = 6;

const VERSION_INFO = {
  red: { label: "ROUGE", color: "#d32f2f", title: "Pokémon Rouge", details: ["Exclusivités : Ekans, Oddish, Mankey, Growlithe, Scyther, Electabuzz…", "Référence principale des rencontres du JDR."] },
  blue: { label: "BLEU", color: "#1976d2", title: "Pokémon Bleu", details: ["Exclusivités : Sandshrew, Vulpix, Meowth, Bellsprout, Magmar, Pinsir…", "Rencontres superposées à la carte commune."] },
  yellow: { label: "JAUNE", color: "#d4a900", title: "Pokémon Jaune", details: ["Pikachu, événements, équipes et plusieurs intérieurs diffèrent."] },
  green: { label: "VERT JP", color: "#388e3c", title: "Pokémon Vert japonais", details: ["Sprites et certains graphismes diffèrent des versions internationales."] },
};

const LOCATIONS = [
  ["BOURG PALETTE", 11, 75], ["JADIELLE", 22, 64], ["ARGENTA", 31, 44], ["AZURIA", 52, 35],
  ["CARMIN-SUR-MER", 52, 61], ["LAVANVILLE", 68, 55], ["CÉLADOPOLE", 48, 62], ["SAFRANIA", 64, 48],
  ["PARMANIE", 67, 72], ["CRAMOIS'ÎLE", 43, 89], ["PLATEAU INDIGO", 27, 13],
];

const VERSION_MARKERS = [
  { id: "red", version: "red", name: "Exclusivités Rouge", x: 18, y: 73, text: "Ekans · Oddish · Mankey · Growlithe · Scyther · Electabuzz" },
  { id: "blue", version: "blue", name: "Exclusivités Bleu", x: 82, y: 73, text: "Sandshrew · Vulpix · Meowth · Bellsprout · Magmar · Pinsir" },
  { id: "yellow", version: "yellow", name: "Jaune", x: 63, y: 48, text: "Éléments propres à Pokémon Jaune" },
  { id: "green", version: "green", name: "Vert japonais", x: 36, y: 28, text: "Différences historiques Red/Green" },
];

function Header({ mode, setMode }) {
  return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>;
}

function VersionLegend({ enabled, setEnabled }) {
  return <div className="version-legend"><div className="legend-title">COUCHES GEN I</div>{Object.entries(VERSION_INFO).map(([id, info]) => <button key={id} className={`version-chip ${enabled[id] ? "on" : ""}`} style={{ "--version-color": info.color }} onClick={() => setEnabled(v => ({ ...v, [id]: !v[id] }))}><span className="version-dot" />{info.label}</button>)}</div>;
}

function VersionPanel({ enabled }) {
  const active = Object.entries(enabled).filter(([, on]) => on).map(([id]) => VERSION_INFO[id]);
  return <aside className="gm-panel"><div className="panel-title">ÉLÉMENTS DISTINCTIFS</div>{active.map(v => <div className="version-card" key={v.label} style={{ "--version-color": v.color }}><div className="version-card-title"><span className="version-dot" />{v.title}</div>{v.details.map(d => <p key={d}>{d}</p>)}</div>)}<div className="gm-message"><strong>Carte Gen I</strong><p>La carte conserve son rapport largeur/hauteur original. Le MJ peut la déplacer et la zoomer sans déformation.</p></div></aside>;
}

function ZoomControls({ zoom, setZoom }) {
  return <div className="map-zoom-controls"><button onClick={() => setZoom(z => Math.min(MAX_GM_ZOOM, +(z + .5).toFixed(1)))}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom(z => Math.max(1, +(z - .5).toFixed(1)))}>−</button><button onClick={() => setZoom(1)}>1×</button></div>;
}

function GameMap({ mode, enabled }) {
  const viewportRef = useRef(null);
  const drag = useRef(null);
  const [gmZoom, setGmZoom] = useState(1);
  const [gmOffset, setGmOffset] = useState({ x: 0, y: 0 });
  const [player, setPlayer] = useState({ x: 11, y: 75 });

  const playerScale = 0.42;
  const scale = mode === "gm" ? FIT_SCALE * gmZoom : playerScale;

  function viewportSize() {
    const el = viewportRef.current;
    return { w: el?.clientWidth || 720, h: el?.clientHeight || 560 };
  }

  function clampOffset(x, y, nextScale = scale) {
    const { w, h } = viewportSize();
    const mapW = MAP_WIDTH * nextScale;
    const mapH = MAP_HEIGHT * nextScale;
    return { x: Math.min(0, Math.max(w - mapW, x)), y: Math.min(0, Math.max(h - mapH, y)) };
  }

  function playerOffset() {
    const { w, h } = viewportSize();
    const px = MAP_WIDTH * player.x / 100 * playerScale;
    const py = MAP_HEIGHT * player.y / 100 * playerScale;
    return { x: w / 2 - px, y: h / 2 - py };
  }

  function changeGmZoom(z) {
    const next = Math.min(MAX_GM_ZOOM, Math.max(1, z));
    setGmZoom(next);
    setGmOffset(o => clampOffset(o.x, o.y, FIT_SCALE * next));
  }

  useEffect(() => {
    if (mode === "gm") setGmOffset(clampOffset(0, 0, FIT_SCALE));
  }, [mode]);

  useEffect(() => {
    if (mode !== "player") return;
    const keys = new Set();
    const down = e => { keys.add(e.key.toLowerCase()); };
    const up = e => { keys.delete(e.key.toLowerCase()); };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    let raf;
    const tick = () => {
      let dx = 0, dy = 0;
      if (keys.has("arrowleft") || keys.has("q") || keys.has("a")) dx -= .12;
      if (keys.has("arrowright") || keys.has("d")) dx += .12;
      if (keys.has("arrowup") || keys.has("z") || keys.has("w")) dy -= .12;
      if (keys.has("arrowdown") || keys.has("s")) dy += .12;
      if (dx || dy) setPlayer(p => ({ x: Math.max(0, Math.min(100, p.x + dx)), y: Math.max(0, Math.min(100, p.y + dy)) }));
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [mode]);

  function onWheel(e) {
    if (mode !== "gm") return;
    e.preventDefault();
    changeGmZoom(gmZoom + (e.deltaY < 0 ? .5 : -.5));
  }

  function onPointerDown(e) {
    if (mode !== "gm") return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: gmOffset.x, oy: gmOffset.y };
  }
  function onPointerMove(e) {
    if (!drag.current) return;
    setGmOffset(clampOffset(drag.current.ox + e.clientX - drag.current.x, drag.current.oy + e.clientY - drag.current.y));
  }
  function onPointerUp() { drag.current = null; }

  const playerPos = playerOffset();
  const mapPos = mode === "gm" ? gmOffset : playerPos;
  const markerList = VERSION_MARKERS.filter(m => enabled[m.version]);

  return <div className="map-shell"><div className="map-heading"><div><span>CARTE DU MONDE</span><strong>KANTO · GEN I</strong></div><small>{mode === "gm" ? "MJ · PAN + ZOOM" : "JOUEUR · EXPLORATION"}</small></div>{mode === "gm" && <ZoomControls zoom={gmZoom} setZoom={changeGmZoom} />}<div ref={viewportRef} className={`map-viewport ${mode === "gm" ? "interactive" : "player-camera"}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><div className="full-kanto-map" style={{ left: `${mapPos.x}px`, top: `${mapPos.y}px`, width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px`, transform: `scale(${scale})` }}><img src={MAP_IMAGE} alt="Carte complète de Kanto Pokémon Rouge et Bleu" draggable="false" />{LOCATIONS.map(([name, x, y]) => <div className="location-label" key={name} style={{ left: `${MAP_WIDTH*x/100}px`, top: `${MAP_HEIGHT*y/100}px` }}>{name}</div>)}{markerList.map(m => <button key={m.id} className="version-marker" style={{ left: `${MAP_WIDTH*m.x/100}px`, top: `${MAP_HEIGHT*m.y/100}px`, "--version-color": VERSION_INFO[m.version].color }} title={m.text}>{VERSION_INFO[m.version].label}</button>)}{mode === "player" && <div className="player-map-marker" style={{ left: `${MAP_WIDTH*player.x/100}px`, top: `${MAP_HEIGHT*player.y/100}px` }}><span /></div>}</div></div>{mode === "gm" ? <div className="zoom-hint">Molette · glisser · boutons · zoom 100–600 %</div> : <div className="zoom-hint">ZQSD / WASD / flèches · caméra centrée sur le joueur</div>}</div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [enabled, setEnabled] = useState({ red: true, blue: true, yellow: true, green: true });
  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="game-layout"><section className="game-area"><div className="player-hud"><div className="trainer-icon"/><div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>JDR Pokémon · Kanto</small></div><div className="location"><span>RÉGION</span><strong>KANTO</strong><small>Rouge · Bleu · Jaune · Vert</small></div></div><VersionLegend enabled={enabled} setEnabled={setEnabled}/><GameMap mode={mode} enabled={enabled}/></section>{mode === "gm" ? <VersionPanel enabled={enabled}/> : <aside className="player-panel"><div className="panel-title">EXPLORATION</div><div className="gm-message"><strong>Déplacement actif</strong><p>Le personnage suit actuellement la carte. La collision case par case sera branchée sur les données Gen I à l'étape suivante.</p></div></aside>}</main></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
