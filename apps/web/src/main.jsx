import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

// Full-scale Gen I reconstruction reference: the complete Red/Blue map includes
// overworld, buildings, caves and connected sub-maps rather than only the Town Map.
const MAP_IMAGE = "https://fotografias-2.larazon.es/assets/videojuegos/2019/04/Mapa-de-Kanto.jpg";
const MAP_WIDTH = 7520;
const MAP_HEIGHT = 6400;
const MAX_ZOOM = 6;

const VERSION_INFO = {
  red: { label: "ROUGE", color: "#d32f2f", title: "Pokémon Rouge", details: ["Exclusivités : Ekans, Oddish, Mankey, Growlithe, Scyther, Electabuzz…", "Référence principale des rencontres et contenus du JDR."] },
  blue: { label: "BLEU", color: "#1976d2", title: "Pokémon Bleu", details: ["Exclusivités : Sandshrew, Vulpix, Meowth, Bellsprout, Magmar, Pinsir…", "Différences de rencontres superposées à la carte commune."] },
  yellow: { label: "JAUNE", color: "#d4a900", title: "Pokémon Jaune", details: ["Pikachu suit le joueur et les équipes/starter diffèrent.", "PNJ, événements et plusieurs intérieurs sont spécifiques à Jaune."] },
  green: { label: "VERT JP", color: "#388e3c", title: "Pokémon Vert japonais", details: ["Version japonaise originale de 1996.", "Sprites et certains graphismes de cartes diffèrent des versions internationales."] },
};

const VERSION_MARKERS = [
  { id: "red-pokemon", version: "red", name: "Exclusivités Rouge", x: 18, y: 73, text: "Ekans · Oddish · Mankey · Growlithe · Scyther · Electabuzz" },
  { id: "blue-pokemon", version: "blue", name: "Exclusivités Bleu", x: 82, y: 73, text: "Sandshrew · Vulpix · Meowth · Bellsprout · Magmar · Pinsir" },
  { id: "yellow-pallet", version: "yellow", name: "Pallet Town · Jaune", x: 11, y: 75, text: "Différences propres à Pokémon Jaune" },
  { id: "green-pallet", version: "green", name: "Pallet Town · Vert", x: 11, y: 70, text: "Référence Red/Green japonaise" },
  { id: "yellow-saffron", version: "yellow", name: "Saffron · Jaune", x: 63, y: 48, text: "Événements et intérieurs propres à Jaune" },
  { id: "green-mtmoon", version: "green", name: "Mont Sélénite · Vert", x: 36, y: 28, text: "Différences historiques Red/Green" },
];

const LOCATIONS = [
  ["BOURG PALETTE", 11, 75], ["JADIELLE", 22, 64], ["ARGENTA", 31, 44], ["AZURIA", 52, 35],
  ["CARMIN-SUR-MER", 52, 61], ["LAVANVILLE", 68, 55], ["CÉLADOPOLE", 48, 62], ["SAFRANIA", 64, 48],
  ["PARMANIE", 67, 72], ["CRAMOIS'ÎLE", 43, 89], ["PLATEAU INDIGO", 27, 13],
];

function Header({ mode, setMode }) {
  return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>;
}

function VersionLegend({ enabled, setEnabled }) {
  return <div className="version-legend"><div className="legend-title">COUCHES GEN I</div>{Object.entries(VERSION_INFO).map(([id, info]) => <button key={id} className={`version-chip ${enabled[id] ? "on" : ""}`} style={{ "--version-color": info.color }} onClick={() => setEnabled((v) => ({ ...v, [id]: !v[id] }))}><span className="version-dot" />{info.label}</button>)}</div>;
}

function VersionPanel({ enabled }) {
  const active = Object.entries(enabled).filter(([, on]) => on).map(([id]) => VERSION_INFO[id]);
  return <aside className="gm-panel"><div className="panel-title">ÉLÉMENTS DISTINCTIFS</div>{active.length === 0 ? <div className="gm-message"><strong>Aucune couche</strong><p>Active une version pour afficher ses marqueurs.</p></div> : active.map((v) => <div className="version-card" key={v.label} style={{ "--version-color": v.color }}><div className="version-card-title"><span className="version-dot" />{v.title}</div>{v.details.map((d) => <p key={d}>{d}</p>)}</div>)}<div className="gm-message"><strong>Carte complète</strong><p>La carte de référence regroupe le monde extérieur et les sous-cartes intérieures de Pokémon Rouge/Bleu. Les marqueurs de version sont une couche JDR au-dessus de cette base commune.</p></div></aside>;
}

function ZoomControls({ zoom, setZoom }) {
  return <div className="map-zoom-controls"><button onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)))}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}>−</button><button onClick={() => setZoom(1)}>1×</button></div>;
}

function GameMap({ mode, enabled }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  useEffect(() => { if (mode === "player") { setZoom(1); setOffset({ x: 0, y: 0 }); } }, [mode]);

  function viewportSize() {
    const el = document.querySelector(".map-viewport");
    return { w: el?.clientWidth || 720, h: el?.clientHeight || (mode === "gm" ? 560 : 448) };
  }

  function clampOffset(x, y, nextZoom = zoom) {
    const { w, h } = viewportSize();
    const scaledW = MAP_WIDTH * nextZoom;
    const scaledH = MAP_HEIGHT * nextZoom;
    return { x: Math.min(0, Math.max(w - scaledW, x)), y: Math.min(0, Math.max(h - scaledH, y)) };
  }

  function changeZoom(next) {
    const z = Math.min(MAX_ZOOM, Math.max(1, next));
    setZoom(z);
    setOffset((o) => clampOffset(o.x, o.y, z));
  }

  function onWheel(event) {
    if (mode !== "gm") return;
    event.preventDefault();
    changeZoom(zoom + (event.deltaY < 0 ? 0.5 : -0.5));
  }

  function onPointerDown(event) {
    if (mode !== "gm" || zoom <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { x: event.clientX, y: event.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(event) {
    if (!drag.current) return;
    setOffset(clampOffset(drag.current.ox + event.clientX - drag.current.x, drag.current.oy + event.clientY - drag.current.y));
  }
  function onPointerUp() { drag.current = null; }

  const mapTransform = mode === "gm" ? `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` : "scale(1)";
  const markerList = VERSION_MARKERS.filter((m) => enabled[m.version]);

  return <div className="map-shell"><div className="map-heading"><div><span>CARTE DU MONDE</span><strong>KANTO · CARTE COMPLÈTE GEN I</strong></div><small>{mode === "gm" ? "MJ · MONDE + INTÉRIEURS · PAN + ZOOM" : "JOUEUR · VUE RÉGIONALE"}</small></div>{mode === "gm" && <ZoomControls zoom={zoom} setZoom={changeZoom} />}<div className={`map-viewport ${mode === "gm" ? "interactive" : ""}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><div className="full-kanto-map" style={{ transform: mapTransform }}><img src={MAP_IMAGE} alt="Carte complète Pokémon Rouge et Bleu avec routes, villes, bâtiments et sous-cartes" draggable="false" />{LOCATIONS.map(([name, x, y]) => <div className="location-label" key={name} style={{ left: `${x}%`, top: `${y}%` }}>{name}</div>)}{markerList.map((m) => <button key={m.id} className="version-marker" style={{ left: `${m.x}%`, top: `${m.y}%`, "--version-color": VERSION_INFO[m.version].color }} title={m.text}><span>{VERSION_INFO[m.version].label}</span></button>)}</div></div>{mode === "gm" && <div className="zoom-hint">Molette · boutons · glisser la carte · zoom 100–600 %</div>}</div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [enabled, setEnabled] = useState({ red: true, blue: true, yellow: true, green: true });
  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="game-layout"><section className="game-area"><div className="player-hud"><div className="trainer-icon"/><div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>JDR Pokémon · Kanto</small></div><div className="location"><span>RÉGION</span><strong>KANTO</strong><small>Rouge · Bleu · Jaune · Vert</small></div></div><VersionLegend enabled={enabled} setEnabled={setEnabled}/><GameMap mode={mode} enabled={enabled}/></section>{mode === "gm" ? <VersionPanel enabled={enabled}/> : <aside className="player-panel"><div className="panel-title">CARTE DE KANTO</div><div className="gm-message"><strong>Exploration</strong><p>Le MJ dispose de la carte complète et de ses sous-cartes. Le joueur conserve une vue régionale simplifiée.</p></div><div className="panel-section"><span>RÉFÉRENCE</span><strong>GEN I · ROUGE / BLEU</strong><small>Jaune et Vert sont superposés comme variantes.</small></div></aside>}</main></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
