import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const MAP_IMAGE = "https://blog.vjeux.com/wp-content/uploads/2023/12/pokemon_blue-1.png";
const MAP_WIDTH = 7200;
const MAP_HEIGHT = 7200;
const GM_FIT_SCALE = 0.09;
const PLAYER_SCALE = 0.42;
const MAX_GM_ZOOM = 5;

const VERSION_INFO = {
  red: { label: "ROUGE", color: "#b83a3a", title: "Pokémon Rouge", details: ["Palette Rouge/Vert et rencontres Rouge.", "Exclusivités Rouge disponibles dans les tables du JDR."] },
  blue: { label: "BLEU", color: "#3b73b9", title: "Pokémon Bleu", details: ["Palette Bleu et rencontres Bleu.", "Exclusivités Bleu disponibles dans les tables du JDR."] },
  yellow: { label: "JAUNE", color: "#c5a72a", title: "Pokémon Jaune", details: ["Éléments et événements propres à Jaune."] },
  green: { label: "VERT JP", color: "#4d8b5a", title: "Pokémon Vert japonais", details: ["Différences historiques Red/Green."] },
};

const LOCATIONS = [
  ["BOURG PALETTE", 12, 77], ["JADIELLE", 23, 65], ["ARGENTA", 31, 45], ["AZURIA", 52, 35],
  ["CARMIN-SUR-MER", 52, 61], ["LAVANVILLE", 68, 55], ["CÉLADOPOLE", 48, 62], ["SAFRANIA", 64, 48],
  ["PARMANIE", 67, 73], ["CRAMOIS'ÎLE", 43, 89], ["PLATEAU INDIGO", 27, 14],
];

const INTERACTABLES = [
  { id: "oak", x: 12, y: 77, kind: "npc", title: "Professeur Chen", text: "Un PNJ majeur. Le MJ peut remplacer son équipe, son dialogue et ses statistiques." },
  { id: "pallet-center", x: 13.5, y: 76, kind: "building", title: "Bâtiment — Bourg Palette", text: "Entrée de bâtiment. Dans la version JDR, cette interaction ouvrira la carte intérieure correspondante." },
  { id: "route1-grass", x: 17, y: 71, kind: "grass", title: "Hautes herbes", text: "Zone de rencontre sauvage. Le joueur voit uniquement les herbes ; le MJ voit les rencontres présentes." },
  { id: "cut-tree", x: 20, y: 67, kind: "cut", title: "Arbre à couper", text: "Obstacle interactif : nécessite la capacité COUPE. Le MJ peut activer ou désactiver l'obstacle." },
  { id: "viridian-npc", x: 23, y: 65, kind: "npc", title: "PNJ de Jadielle", text: "PNJ sélectionnable par le MJ : dialogue, niveau, équipe et statistiques seront attachés à cette fiche." },
  { id: "boulder", x: 37, y: 49, kind: "strength", title: "Rocher poussable", text: "Obstacle de type FORCE. Il pourra être déplacé sur la grille lorsque FORCE sera disponible." },
  { id: "forest", x: 28, y: 52, kind: "grass", title: "Forêt / hautes herbes", text: "Zone exploratoire avec rencontres sauvages. Les Pokémon cachés restent invisibles pour le joueur." },
  { id: "cerulean-npc", x: 52, y: 35, kind: "npc", title: "PNJ d'Azuria", text: "Fiche PNJ prête à recevoir dialogue, équipe, niveau et statistiques." },
  { id: "water", x: 55, y: 42, kind: "water", title: "Eau", text: "Surface infranchissable à pied. Une future interaction SURF permettra le déplacement sur l'eau." },
  { id: "saffron-door", x: 64, y: 48, kind: "building", title: "Entrée de bâtiment", text: "Interaction de porte : ouvrira la zone intérieure liée au bâtiment." },
  { id: "power-boulder", x: 68, y: 55, kind: "strength", title: "Rocher bloquant", text: "Obstacle nécessitant FORCE. Le MJ pourra le déplacer ou le supprimer." },
  { id: "safari-grass", x: 67, y: 73, kind: "grass", title: "Hautes herbes — Parc Safari", text: "Zone de rencontre sauvage spéciale. Les rencontres seront tirées selon la table de la zone." },
  { id: "cinnabar-door", x: 43, y: 89, kind: "building", title: "Bâtiment de Cramois'Île", text: "Porte interactive vers une future carte intérieure." },
];

function Header({ mode, setMode }) {
  return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span /></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode === "player" ? "active" : ""} onClick={() => setMode("player")}>JOUEUR</button><button className={mode === "gm" ? "active gm" : ""} onClick={() => setMode("gm")}>MJ</button></div></header>;
}

function VersionLegend({ enabled, setEnabled }) {
  return <div className="version-legend"><div className="legend-title">COUCHES GEN I</div>{Object.entries(VERSION_INFO).map(([id, info]) => <button key={id} className={`version-chip ${enabled[id] ? "on" : ""}`} style={{ "--version-color": info.color }} onClick={() => setEnabled(v => ({ ...v, [id]: !v[id] }))}><span className="version-dot" />{info.label}</button>)}</div>;
}

function VersionPanel({ enabled, selected }) {
  const active = Object.entries(enabled).filter(([, on]) => on).map(([id]) => VERSION_INFO[id]);
  const item = INTERACTABLES.find(x => x.id === selected);
  return <aside className="gm-panel"><div className="panel-title">MJ · CARTE ET INTERACTIONS</div>{item && <div className="interaction-card"><div className="interaction-kind">{item.kind.toUpperCase()}</div><strong>{item.title}</strong><p>{item.text}</p><div className="interaction-actions"><button>MODIFIER</button><button>FICHE</button></div></div>}<div className="panel-title secondary">COUCHES DE VERSION</div>{active.map(v => <div className="version-card" key={v.label} style={{ "--version-color": v.color }}><div className="version-card-title"><span className="version-dot" />{v.title}</div>{v.details.map(d => <p key={d}>{d}</p>)}</div>)}<div className="gm-message"><strong>Interactions actives</strong><p>Cliquer un élément sélectionne son type. Les hautes herbes, PNJ, portes, arbres COUPE et rochers FORCE sont maintenant représentés comme objets de jeu, prêts à être reliés aux données des cartes Gen I.</p></div></aside>;
}

function GameMap({ mode, enabled, onSelect, selected }) {
  const viewportRef = useRef(null);
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [player, setPlayer] = useState({ x: 12, y: 77 });

  const scale = mode === "gm" ? GM_FIT_SCALE * zoom : PLAYER_SCALE;
  const size = () => { const e = viewportRef.current; return { w: e?.clientWidth || 720, h: e?.clientHeight || 560 }; };
  const clamp = (x, y, s = scale) => { const { w, h } = size(); const minX = Math.min(0, w - MAP_WIDTH * s); const minY = Math.min(0, h - MAP_HEIGHT * s); return { x: Math.min(0, Math.max(minX, x)), y: Math.min(0, Math.max(minY, y)) }; };
  const playerCamera = () => { const { w, h } = size(); return { x: w / 2 - MAP_WIDTH * player.x / 100 * scale, y: h / 2 - MAP_HEIGHT * player.y / 100 * scale }; };
  const setZoomAt = (value, cx, cy) => { const next = Math.min(MAX_GM_ZOOM, Math.max(1, value)); setZoom(prev => { const contentX = (cx - offset.x) / prev; const contentY = (cy - offset.y) / prev; setOffset(clamp(cx - contentX * next, cy - contentY * next, GM_FIT_SCALE * next)); return next; }); };
  const zoomBy = (delta, cx, cy) => setZoomAt(zoom + delta, cx, cy);

  useEffect(() => { const onResize = () => mode === "gm" && setOffset(o => clamp(o.x, o.y, GM_FIT_SCALE * zoom)); window.addEventListener("resize", onResize); return () => window.removeEventListener("resize", onResize); }, [mode, zoom]);
  useEffect(() => { if (mode === "gm") setOffset(clamp(0, 0, GM_FIT_SCALE)); }, [mode]);

  useEffect(() => {
    if (mode !== "player") return;
    const keys = new Set();
    const down = e => { const k = e.key.toLowerCase(); if (["arrowleft", "arrowright", "arrowup", "arrowdown", "z", "q", "s", "d", "w", "a", "e"].includes(k)) e.preventDefault(); keys.add(k); };
    const up = e => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down, { passive: false }); window.addEventListener("keyup", up);
    let raf;
    const tick = () => { let dx = 0, dy = 0; if (keys.has("arrowleft") || keys.has("q") || keys.has("a")) dx -= .08; if (keys.has("arrowright") || keys.has("d")) dx += .08; if (keys.has("arrowup") || keys.has("z") || keys.has("w")) dy -= .08; if (keys.has("arrowdown") || keys.has("s")) dy += .08; if (dx || dy) setPlayer(p => ({ x: Math.max(0, Math.min(100, p.x + dx)), y: Math.max(0, Math.min(100, p.y + dy)) })); if (keys.has("e")) { const near = nearestInteractable(player); if (near) onSelect(near.id); } raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, [mode, player]);

  function nearestInteractable(p) { let best = null, dist = Infinity; for (const item of INTERACTABLES) { const d = Math.hypot(item.x - p.x, item.y - p.y); if (d < 3.2 && d < dist) { best = item; dist = d; } } return best; }
  function pointDistance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
  function pointCenter(a, b) { return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  function onPointerDown(e) { if (mode !== "gm") return; e.currentTarget.setPointerCapture(e.pointerId); pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.current.size === 1) gesture.current = { type: "pan", start: { x: e.clientX, y: e.clientY }, origin: { ...offset } }; else { const pts = [...pointers.current.values()]; gesture.current = { type: "pinch", distance: pointDistance(pts[0], pts[1]), center: pointCenter(pts[0], pts[1]), zoom, origin: { ...offset } }; } }
  function onPointerMove(e) { if (mode !== "gm" || !pointers.current.has(e.pointerId)) return; pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (pointers.current.size === 1 && gesture.current?.type === "pan") { const g = gesture.current; setOffset(clamp(g.origin.x + e.clientX - g.start.x, g.origin.y + e.clientY - g.start.y)); } else if (pointers.current.size === 2) { const pts = [...pointers.current.values()]; const g = gesture.current; if (!g || g.type !== "pinch") return; const d = pointDistance(pts[0], pts[1]); const c = pointCenter(pts[0], pts[1]); const next = Math.min(MAX_GM_ZOOM, Math.max(1, g.zoom * d / g.distance)); const contentX = (g.center.x - g.origin.x) / g.zoom; const contentY = (g.center.y - g.origin.y) / g.zoom; setZoom(next); setOffset(clamp(c.x - contentX * next, c.y - contentY * next, GM_FIT_SCALE * next)); } }
  function onPointerUp(e) { pointers.current.delete(e.pointerId); if (!pointers.current.size) gesture.current = null; else if (pointers.current.size === 1) { const p = [...pointers.current.values()][0]; gesture.current = { type: "pan", start: { x: p.x, y: p.y }, origin: { ...offset } }; } }
  function onWheel(e) { if (mode !== "gm") return; e.preventDefault(); const rect = viewportRef.current.getBoundingClientRect(); const cx = e.clientX - rect.left, cy = e.clientY - rect.top; if (e.ctrlKey || Math.abs(e.deltaY) > Math.abs(e.deltaX)) zoomBy(e.deltaY < 0 ? .25 : -.25, cx, cy); else setOffset(o => clamp(o.x - e.deltaX, o.y - e.deltaY)); }

  const pos = mode === "gm" ? offset : playerCamera();
  const markers = VERSION_INFO;
  const near = nearestInteractable(player);
  return <div className="map-shell"><div className="map-heading"><div><span>CARTE DU MONDE</span><strong>KANTO · GEN I · HAUTE RÉSOLUTION</strong></div><small>{mode === "gm" ? "MJ · PAN + ZOOM + INTERACTIONS" : "JOUEUR · EXPLORATION + INTERACTIONS"}</small></div>{mode === "gm" && <div className="map-zoom-controls"><button onClick={() => zoomBy(.25, (viewportRef.current?.clientWidth || 720) / 2, (viewportRef.current?.clientHeight || 560) / 2)}>+</button><span>{Math.round(zoom * 100)}%</span><button onClick={() => zoomBy(-.25, (viewportRef.current?.clientWidth || 720) / 2, (viewportRef.current?.clientHeight || 560) / 2)}>−</button><button onClick={() => { setZoom(1); setOffset(clamp(0, 0, GM_FIT_SCALE)); }}>1×</button></div>}<div ref={viewportRef} className={`map-viewport ${mode === "gm" ? "interactive" : "player-camera"}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><div className="full-kanto-map" style={{ left: `${pos.x}px`, top: `${pos.y}px`, width: `${MAP_WIDTH}px`, height: `${MAP_HEIGHT}px`, transform: `translate3d(0,0,0) scale(${scale})` }}><img className="gen1-map-image" src={MAP_IMAGE} alt="Carte complète haute résolution Pokémon Rouge et Bleu" draggable="false" />{LOCATIONS.map(([name, x, y]) => <div className="location-label" key={name} style={{ left: `${MAP_WIDTH * x / 100}px`, top: `${MAP_HEIGHT * y / 100}px` }}>{name}</div>)}{INTERACTABLES.map(item => <button key={item.id} className={`map-interaction interaction-${item.kind} ${selected === item.id ? "selected" : ""}`} style={{ left: `${MAP_WIDTH * item.x / 100}px`, top: `${MAP_HEIGHT * item.y / 100}px` }} title={`${item.title} — ${item.text}`} onClick={e => { e.stopPropagation(); onSelect(item.id); }}>{item.kind === "npc" ? "●" : item.kind === "grass" ? "✣" : item.kind === "cut" ? "♣" : item.kind === "strength" ? "◆" : item.kind === "water" ? "≈" : "↗"}</button>)}{mode === "gm" && INTERACTABLES.map(item => <div key={`gm-${item.id}`} className="gm-object-label" style={{ left: `${MAP_WIDTH * item.x / 100}px`, top: `${MAP_HEIGHT * item.y / 100 + 1.8}px` }}>{item.title}</div>)}{mode === "player" && <div className="player-map-marker" style={{ left: `${MAP_WIDTH * player.x / 100}px`, top: `${MAP_HEIGHT * player.y / 100}px` }}><span /></div>}</div></div><div className="zoom-hint">{mode === "gm" ? "Souris : molette · Trackpad : défilement/pincement · Tactile : glisser/pincer · clic sur objet" : near ? `E / toucher : ${near.title}` : "ZQSD / WASD / flèches · E pour interagir · caméra centrée"}</div></div>;
}

function App() {
  const [mode, setMode] = useState("player");
  const [enabled, setEnabled] = useState({ red: true, blue: true, yellow: true, green: true });
  const [selected, setSelected] = useState(null);
  return <div className={`game ${mode === "gm" ? "gm-mode" : "player-mode"}`}><Header mode={mode} setMode={m => { setMode(m); setSelected(null); }} /><main className="game-layout"><section className="game-area"><div className="player-hud"><div className="trainer-icon"/><div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>JDR Pokémon · Kanto</small></div><div className="location"><span>RÉGION</span><strong>KANTO</strong><small>Rouge · Bleu · Jaune · Vert</small></div></div><VersionLegend enabled={enabled} setEnabled={setEnabled}/><GameMap mode={mode} enabled={enabled} onSelect={setSelected} selected={selected}/></section>{mode === "gm" ? <VersionPanel enabled={enabled} selected={selected}/> : <aside className="player-panel"><div className="panel-title">EXPLORATION</div><div className="gm-message"><strong>{selected ? INTERACTABLES.find(x => x.id === selected)?.title : "Exploration active"}</strong><p>{selected ? INTERACTABLES.find(x => x.id === selected)?.text : "Approchez-vous d'un élément du décor puis utilisez E. Les interactions sont séparées du rendu graphique afin de pouvoir brancher ensuite les vraies données des cartes Gen I."}</p></div></aside>}</main></div>;
}

createRoot(document.getElementById("root")).render(<React.StrictMode><App /></React.StrictMode>);
