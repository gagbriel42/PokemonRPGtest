import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const MAP_IMAGE = "https://archives.bulbagarden.net/wiki/Special:Redirect/file/RBY_Kanto.png";
const MAP_WIDTH = 800;
const MAP_HEIGHT = 553;
const MAX_ZOOM = 6;

const VERSION_INFO = {
  red: {
    label: "ROUGE",
    color: "#d32f2f",
    title: "Pokémon Rouge",
    details: ["Exclusivités : Ekans, Oddish, Mankey, Growlithe, Scyther, Electabuzz…", "Sprites et tables de rencontres Rouge."],
  },
  blue: {
    label: "BLEU",
    color: "#1976d2",
    title: "Pokémon Bleu",
    details: ["Exclusivités : Sandshrew, Vulpix, Meowth, Bellsprout, Magmar, Pinsir…", "Sprites et tables de rencontres Bleu."],
  },
  yellow: {
    label: "JAUNE",
    color: "#d4a900",
    title: "Pokémon Jaune",
    details: ["Pikachu suit le joueur et les starters sont différents.", "PNJ, équipes et plusieurs intérieurs diffèrent de Rouge/Bleu."],
  },
  green: {
    label: "VERT JP",
    color: "#388e3c",
    title: "Pokémon Vert japonais",
    details: ["Version japonaise originale de 1996.", "Sprites, graphismes et certaines salles diffèrent des versions internationales."],
  },
};

const VERSION_MARKERS = [
  { id: "red-pokemon", version: "red", name: "Exclusivités Rouge", x: 20, y: 72, text: "Ekans · Oddish · Mankey · Growlithe · Scyther · Electabuzz" },
  { id: "blue-pokemon", version: "blue", name: "Exclusivités Bleu", x: 80, y: 72, text: "Sandshrew · Vulpix · Meowth · Bellsprout · Magmar · Pinsir" },
  { id: "yellow-pallet", version: "yellow", name: "Pallet Town · Jaune", x: 11, y: 73, text: "Maison du joueur et laboratoire avec différences propres à Jaune" },
  { id: "green-pallet", version: "green", name: "Pallet Town · Vert", x: 12, y: 67, text: "Éléments graphiques et sprites propres à Red/Green japonais" },
  { id: "yellow-saffron", version: "yellow", name: "Saffron · Jaune", x: 63, y: 45, text: "Contenu et événements propres à Jaune" },
  { id: "green-mtmoon", version: "green", name: "Mont Sélénite · Vert", x: 36, y: 27, text: "Référence aux cartes et graphismes Red/Green japonais" },
];

const LOCATIONS = [
  ["Bourg Palette", 10, 74], ["Jadielle", 22, 64], ["Argenta", 30, 44], ["Azuria", 52, 35],
  ["Carmin-sur-Mer", 52, 61], ["Lavanville", 67, 56], ["Céladopole", 48, 62], ["Safrania", 64, 48],
  ["Parmanie", 66, 72], ["Cramois'Île", 43, 89], ["Plateau Indigo", 27, 13],
];

function Header({ mode, setMode }) {
  return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>;
}

function VersionLegend({ enabled, setEnabled }) {
  return <div className="version-legend"><div className="legend-title">COUCHES GEN I</div>{Object.entries(VERSION_INFO).map(([id, info]) => <button key={id} className={`version-chip ${enabled[id] ? "on" : ""}`} style={{ "--version-color": info.color }} onClick={() => setEnabled((v) => ({ ...v, [id]: !v[id] }))}><span className="version-dot" />{info.label}</button>)}</div>;
}

function VersionPanel({ enabled }) {
  const active = Object.entries(enabled).filter(([, on]) => on).map(([id]) => VERSION_INFO[id]);
  return <aside className="gm-panel"><div className="panel-title">ÉLÉMENTS DISTINCTIFS</div>{active.length === 0 ? <div className="gm-message"><strong>Aucune couche</strong><p>Active Rouge, Bleu, Jaune ou Vert pour afficher les différences sur la carte.</p></div> : active.map((v) => <div className="version-card" key={v.label} style={{ "--version-color": v.color }}><div className="version-card-title"><span className="version-dot" />{v.title}</div>{v.details.map((d) => <p key={d}>{d}</p>)}</div>)}<div className="gm-message"><strong>Carte complète de Kanto</strong><p>La vue utilise l'ensemble de Kanto comme fond. Les couches colorées servent à superposer les différences de version sans remplacer la carte commune.</p></div></aside>;
}

function ZoomControls({ zoom, setZoom }) {
  return <div className="map-zoom-controls"><button onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.5).toFixed(1)))}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => setZoom((z) => Math.max(1, +(z - 0.5).toFixed(1)))}>−</button><button onClick={() => setZoom(1)}>1×</button></div>;
}

function GameMap({ mode, enabled }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef(null);

  useEffect(() => {
    if (mode === "player") { setZoom(1); setOffset({ x: 0, y: 0 }); }
  }, [mode]);

  function clampOffset(x, y, nextZoom = zoom) {
    const vw = 720;
    const vh = mode === "gm" ? 560 : 448;
    const scaledW = MAP_WIDTH * nextZoom;
    const scaledH = MAP_HEIGHT * nextZoom;
    return {
      x: Math.min(0, Math.max(vw - scaledW, x)),
      y: Math.min(0, Math.max(vh - scaledH, y)),
    };
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

  return <div className="map-shell"><div className="map-heading"><div><span>CARTE DU MONDE</span><strong>KANTO · GÉNÉRATION I</strong></div><small>{mode === "gm" ? "MJ · CARTE COMPLÈTE · PAN + ZOOM" : "JOUEUR · VUE RÉGIONALE"}</small></div>{mode === "gm" && <ZoomControls zoom={zoom} setZoom={changeZoom} />}<div className={`map-viewport ${mode === "gm" ? "interactive" : ""}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><div className="full-kanto-map" style={{ transform: mapTransform }}><img src={MAP_IMAGE} alt="Carte complète de Kanto Pokémon Rouge Bleu Jaune Vert" draggable="false" />{LOCATIONS.map(([name, x, y]) => <div className="location-label" key={name} style={{ left: `${x}%`, top: `${y}%` }}>{name}</div>)}{markerList.map((m) => <button key={m.id} className="version-marker" style={{ left: `${m.x}%`, top: `${m.y}%`, "--version-color": VERSION_INFO[m.version].color }} title={m.text}><span>{VERSION_INFO[m.version].label}</span></button>)}</div></div>{mode === "gm" && <div className="zoom-hint">Molette · boutons · glisser la carte · zoom 100–600 %</div>}</div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [enabled, setEnabled] = useState({ red: true, blue: true, yellow: true, green: true });
  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="game-layout"><section className="game-area"><div className="player-hud"><div className="trainer-icon"/><div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>JDR Pokémon · Kanto</small></div><div className="location"><span>RÉGION</span><strong>KANTO</strong><small>Rouge · Bleu · Jaune · Vert</small></div></div><VersionLegend enabled={enabled} setEnabled={setEnabled}/><GameMap mode={mode} enabled={enabled}/></section>{mode === "gm" ? <VersionPanel enabled={enabled}/> : <aside className="player-panel"><div className="panel-title">CARTE DE KANTO</div><div className="gm-message"><strong>Exploration</strong><p>La carte complète de Kanto est affichée. Les détails de version sont superposés par couches.</p></div><div className="panel-section"><span>VERSIONS</span><strong>ROUGE · BLEU · JAUNE · VERT</strong><small>Les quatre références Gen I sont réunies sur une même carte.</small></div></aside>}</main></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
