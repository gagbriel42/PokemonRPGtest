import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const MAP_IMAGE = "https://fotografias-2.larazon.es/assets/videojuegos/2019/04/Mapa-de-Kanto.jpg";
const MAP_WIDTH = 7520;
const MAP_HEIGHT = 6400;
const GM_FIT_SCALE = 0.105;
const PLAYER_SCALE = 0.55;
const MAX_GM_ZOOM = 4;

const VERSION_INFO = {
  red: { label: "ROUGE", color: "#d32f2f", title: "Pokémon Rouge", details: ["Exclusivités : Ekans, Oddish, Mankey, Growlithe, Scyther, Electabuzz…", "Référence principale des rencontres du JDR."] },
  blue: { label: "BLEU", color: "#1976d2", title: "Pokémon Bleu", details: ["Exclusivités : Sandshrew, Vulpix, Meowth, Bellsprout, Magmar, Pinsir…", "Rencontres superposées à la carte commune."] },
  yellow: { label: "JAUNE", color: "#d4a900", title: "Pokémon Jaune", details: ["Pikachu, événements, équipes et plusieurs intérieurs diffèrent."] },
  green: { label: "VERT JP", color: "#388e3c", title: "Pokémon Vert japonais", details: ["Sprites et certains graphismes diffèrent des versions internationales."] },
};

const LOCATIONS = [["BOURG PALETTE",11,75],["JADIELLE",22,64],["ARGENTA",31,44],["AZURIA",52,35],["CARMIN-SUR-MER",52,61],["LAVANVILLE",68,55],["CÉLADOPOLE",48,62],["SAFRANIA",64,48],["PARMANIE",67,72],["CRAMOIS'ÎLE",43,89],["PLATEAU INDIGO",27,13]];
const VERSION_MARKERS = [
  {id:"red",version:"red",x:18,y:73,text:"Ekans · Oddish · Mankey · Growlithe · Scyther · Electabuzz"},
  {id:"blue",version:"blue",x:82,y:73,text:"Sandshrew · Vulpix · Meowth · Bellsprout · Magmar · Pinsir"},
  {id:"yellow",version:"yellow",x:63,y:48,text:"Éléments propres à Pokémon Jaune"},
  {id:"green",version:"green",x:36,y:28,text:"Différences historiques Red/Green"}
];

function Header({mode,setMode}){return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span/></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode==="player"?"active":""} onClick={()=>setMode("player")}>JOUEUR</button><button className={mode==="gm"?"active gm":""} onClick={()=>setMode("gm")}>MJ</button></div></header>}
function VersionLegend({enabled,setEnabled}){return <div className="version-legend"><div className="legend-title">COUCHES GEN I</div>{Object.entries(VERSION_INFO).map(([id,info])=><button key={id} className={`version-chip ${enabled[id]?"on":""}`} style={{"--version-color":info.color}} onClick={()=>setEnabled(v=>({...v,[id]:!v[id]}))}><span className="version-dot"/>{info.label}</button>)}</div>}
function VersionPanel({enabled}){const active=Object.entries(enabled).filter(([,on])=>on).map(([id])=>VERSION_INFO[id]);return <aside className="gm-panel"><div className="panel-title">ÉLÉMENTS DISTINCTIFS</div>{active.map(v=><div className="version-card" key={v.label} style={{"--version-color":v.color}}><div className="version-card-title"><span className="version-dot"/>{v.title}</div>{v.details.map(d=><p key={d}>{d}</p>)}</div>)}<div className="gm-message"><strong>Carte Gen I</strong><p>Glisser pour déplacer. Molette souris pour zoomer. Trackpad : deux doigts pour déplacer, pincement pour zoomer. Écran tactile : glisser à un doigt, pincement à deux doigts.</p></div></aside>}

function GameMap({mode,enabled}){
  const viewportRef=useRef(null);
  const pointers=useRef(new Map());
  const gesture=useRef(null);
  const [zoom,setZoom]=useState(1);
  const [offset,setOffset]=useState({x:0,y:0});
  const [player,setPlayer]=useState({x:11,y:75});
  const scale=mode==="gm"?GM_FIT_SCALE*zoom:PLAYER_SCALE;

  const size=()=>{const e=viewportRef.current;return {w:e?.clientWidth||720,h:e?.clientHeight||560};};
  const clamp=(x,y,s=scale)=>{const {w,h}=size();const minX=Math.min(0,w-MAP_WIDTH*s),minY=Math.min(0,h-MAP_HEIGHT*s);return {x:Math.min(0,Math.max(minX,x)),y:Math.min(0,Math.max(minY,y))};};
  const playerCamera=()=>{const {w,h}=size();return {x:w/2-MAP_WIDTH*player.x/100*scale,y:h/2-MAP_HEIGHT*player.y/100*scale};};

  const setZoomAt=(value,cx,cy)=>{
    const next=Math.min(MAX_GM_ZOOM,Math.max(1,value));
    setZoom(prev=>{const {x,y}=offset;const contentX=(cx-x)/prev,contentY=(cy-y)/prev;const nextOffset=clamp(cx-contentX*next,cy-contentY*next,next);setOffset(nextOffset);return next;});
  };
  const zoomBy=(delta,cx,cy)=>setZoomAt(zoom+delta,cx,cy);

  useEffect(()=>{const onResize=()=>mode==="gm"&&setOffset(o=>clamp(o.x,o.y,GM_FIT_SCALE*zoom));window.addEventListener("resize",onResize);return()=>window.removeEventListener("resize",onResize)},[mode,zoom]);
  useEffect(()=>{if(mode==="gm")setOffset(clamp(0,0,GM_FIT_SCALE));},[mode]);

  useEffect(()=>{if(mode!=="player")return;const keys=new Set();const down=e=>{const k=e.key.toLowerCase();if(["arrowleft","arrowright","arrowup","arrowdown","z","q","s","d","w","a"].includes(k))e.preventDefault();keys.add(k)};const up=e=>keys.delete(e.key.toLowerCase());window.addEventListener("keydown",down,{passive:false});window.addEventListener("keyup",up);let raf;const tick=()=>{let dx=0,dy=0;if(keys.has("arrowleft")||keys.has("q")||keys.has("a"))dx-=.1;if(keys.has("arrowright")||keys.has("d"))dx+=.1;if(keys.has("arrowup")||keys.has("z")||keys.has("w"))dy-=.1;if(keys.has("arrowdown")||keys.has("s"))dy+=.1;if(dx||dy)setPlayer(p=>({x:Math.max(0,Math.min(100,p.x+dx)),y:Math.max(0,Math.min(100,p.y+dy))}));raf=requestAnimationFrame(tick)};raf=requestAnimationFrame(tick);return()=>{cancelAnimationFrame(raf);window.removeEventListener("keydown",down);window.removeEventListener("keyup",up)}},[mode]);

  function pointDistance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)};
  function pointCenter(a,b){return {x:(a.x+b.x)/2,y:(a.y+b.y)/2}};
  function onPointerDown(e){if(mode!=="gm")return;e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===1){gesture.current={type:"pan",start:{x:e.clientX,y:e.clientY},origin:{...offset}}}else if(pointers.current.size===2){const pts=[...pointers.current.values()];gesture.current={type:"pinch",distance:pointDistance(pts[0],pts[1]),center:pointCenter(pts[0],pts[1]),zoom,origin:{...offset}}}}
  function onPointerMove(e){if(mode!=="gm"||!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===1&&gesture.current?.type==="pan"){const g=gesture.current;setOffset(clamp(g.origin.x+e.clientX-g.start.x,g.origin.y+e.clientY-g.start.y))}else if(pointers.current.size===2){const pts=[...pointers.current.values()];const g=gesture.current;if(!g||g.type!=="pinch")return;const d=pointDistance(pts[0],pts[1]);const c=pointCenter(pts[0],pts[1]);const next=g.zoom*(d/g.distance);const contentX=(g.center.x-g.origin.x)/g.zoom,contentY=(g.center.y-g.origin.y)/g.zoom;setZoom(Math.min(MAX_GM_ZOOM,Math.max(1,next)));setOffset(clamp(c.x-contentX*next,c.y-contentY*next,next))}}
  function onPointerUp(e){pointers.current.delete(e.pointerId);if(pointers.current.size===0)gesture.current=null;else if(pointers.current.size===1){const p=[...pointers.current.values()][0];gesture.current={type:"pan",start:{x:p.x,y:p.y},origin:{...offset}}}}
  function onWheel(e){if(mode!=="gm")return;e.preventDefault();const rect=viewportRef.current.getBoundingClientRect();const cx=e.clientX-rect.left,cy=e.clientY-rect.top;if(e.ctrlKey){zoomBy(e.deltaY<0?.15:-.15,cx,cy)}else if(Math.abs(e.deltaX)>0){setOffset(o=>clamp(o.x-e.deltaX,o.y-e.deltaY))}else{zoomBy(e.deltaY<0?.25:-.25,cx,cy)}}

  const pos=mode==="gm"?offset:playerCamera();const markers=VERSION_MARKERS.filter(m=>enabled[m.version]);
  return <div className="map-shell"><div className="map-heading"><div><span>CARTE DU MONDE</span><strong>KANTO · GEN I</strong></div><small>{mode==="gm"?"MJ · PAN + ZOOM":"JOUEUR · EXPLORATION"}</small></div>{mode==="gm"&&<div className="map-zoom-controls"><button onClick={()=>zoomBy(.25,viewportRef.current?.clientWidth/2||360,viewportRef.current?.clientHeight/2||280)}>+</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>zoomBy(-.25,viewportRef.current?.clientWidth/2||360,viewportRef.current?.clientHeight/2||280)}>−</button><button onClick={()=>{setZoom(1);setOffset(clamp(0,0,GM_FIT_SCALE))}}>1×</button></div>}<div ref={viewportRef} className={`map-viewport ${mode==="gm"?"interactive":"player-camera"}`} onWheel={onWheel} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}><div className="full-kanto-map" style={{left:`${pos.x}px`,top:`${pos.y}px`,width:`${MAP_WIDTH}px`,height:`${MAP_HEIGHT}px`,transform:`translate3d(0,0,0) scale(${scale})`}}><img src={MAP_IMAGE} alt="Carte complète de Kanto Pokémon Rouge et Bleu" draggable="false"/>{LOCATIONS.map(([name,x,y])=><div className="location-label" key={name} style={{left:`${MAP_WIDTH*x/100}px`,top:`${MAP_HEIGHT*y/100}px`}}>{name}</div>)}{markers.map(m=><button key={m.id} className="version-marker" style={{left:`${MAP_WIDTH*m.x/100}px`,top:`${MAP_HEIGHT*m.y/100}px`,"--version-color":VERSION_INFO[m.version].color}} title={m.text}>{VERSION_INFO[m.version].label}</button>)}{mode==="player"&&<div className="player-map-marker" style={{left:`${MAP_WIDTH*player.x/100}px`,top:`${MAP_HEIGHT*player.y/100}px`}}><span/></div>}</div></div><div className="zoom-hint">{mode==="gm"?"Souris : molette · Trackpad : 2 doigts / pincement · Tactile : glisser / pincement · boutons +/−":"ZQSD / WASD / flèches · caméra centrée sur le joueur"}</div></div>;
}

function App(){const [mode,setMode]=useState("player");const [enabled,setEnabled]=useState({red:true,blue:true,yellow:true,green:true});return <div className={`game ${mode==="gm"?"gm-mode":"player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="game-layout"><section className="game-area"><div className="player-hud"><div className="trainer-icon"/><div className="trainer-data"><span>DRESSEUR</span><strong>GABRIEL</strong><small>JDR Pokémon · Kanto</small></div><div className="location"><span>RÉGION</span><strong>KANTO</strong><small>Rouge · Bleu · Jaune · Vert</small></div></div><VersionLegend enabled={enabled} setEnabled={setEnabled}/><GameMap mode={mode} enabled={enabled}/></section>{mode==="gm"?<VersionPanel enabled={enabled}/>:<aside className="player-panel"><div className="panel-title">EXPLORATION</div><div className="gm-message"><strong>Déplacement actif</strong><p>Le personnage suit actuellement la carte. La collision case par case sera branchée sur les données Gen I à l'étape suivante.</p></div></aside>}</main></div>}

createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
