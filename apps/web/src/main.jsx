import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";

const COLS=32, ROWS=24, TILE=32, WORLD_W=COLS*TILE, WORLD_H=ROWS*TILE, MAX_ZOOM=4;
const TILESET="https://raw.githubusercontent.com/pret/pokered/master/gfx/tilesets/overworld.png";
const RED_SPRITE="https://raw.githubusercontent.com/pret/pokered/master/gfx/sprites/red.png";
const SPRITES={pikachu:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/25.png",rattata:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/19.png",bulbasaur:"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-i/red-blue/front_transparent/1.png"};

// Authentic Red/Blue overworld tiles from pret/pokered. The source is 128x48px;
// each original 8x8 tile is enlarged with nearest-neighbour rendering.
const TEXTURES={grass:"0 -32px",path:"-32px -32px",water:"-64px -32px",tree:"-96px -16px",tallgrass:"-40px -32px",flower:"-56px -32px",rock:"-88px -32px",bridge:"-24px -16px"};
const BASE_MAP=Array.from({length:ROWS},(_,y)=>Array.from({length:COLS},(_,x)=>{
  if(x===0||y===0||x===COLS-1||y===ROWS-1)return "tree";
  if(x>=13&&x<=16&&y>=1&&y<=22)return "water";
  if(x===14||x===15)return "bridge";
  if((y>=11&&y<=13)||(x>=14&&x<=15))return "path";
  if(x>=3&&x<=9&&y>=4&&y<=9)return "grass";
  if(x>=21&&x<=28&&y>=16&&y<=21)return "tallgrass";
  if((x*7+y*11)%31===0)return "flower";
  return "grass";
}));
const BUILDINGS=[
 {id:"house",x:4,y:4,w:5,h:4,title:"Maison de Red",text:"Maison du joueur. La porte servira de warp vers l'intérieur."},
 {id:"lab",x:24,y:4,w:6,h:5,title:"Laboratoire du Professeur Chen",text:"Laboratoire de Bourg Palette. Starter et événements seront liés ici."},
 {id:"center",x:4,y:17,w:6,h:4,title:"Centre Pokémon",text:"Centre Pokémon. Les soins et l'intérieur seront ajoutés avec le tileset dédié."},
 {id:"mart",x:24,y:17,w:5,h:4,title:"Boutique",text:"Boutique. Les objets et le stock seront gérés par le MJ."}
];
const OBJECTS=[
 {id:"oak",x:21,y:7,kind:"npc",title:"Professeur Chen",text:"PNJ Gen I. Dialogue et équipe gérés par le MJ."},
 {id:"rival",x:11,y:11,kind:"npc",title:"Rival",text:"PNJ mobile. Le MJ pourra définir son équipe et son comportement."},
 {id:"cut",x:11,y:8,kind:"cut",title:"Arbre à couper",text:"Nécessite COUPE. L'arbre est retiré de la carte après interaction."},
 {id:"boulder",x:19,y:19,kind:"strength",title:"Rocher poussable",text:"Nécessite FORCE. Le rocher se déplace sur la grille si la case suivante est libre."},
 {id:"sign",x:12,y:13,kind:"sign",title:"Panneau",text:"BOURG PALETTE — ROUTE 1."},
 {id:"pikachu",x:25,y:18,kind:"wild",title:"Pikachu caché",text:"Rencontre sauvage. Invisible au joueur, visible au MJ.",sprite:"pikachu",hidden:true},
 {id:"rattata",x:27,y:19,kind:"wild",title:"Rattata caché",text:"Rencontre sauvage. Invisible au joueur, visible au MJ.",sprite:"rattata",hidden:true},
 {id:"bulbasaur",x:7,y:6,kind:"wild",title:"Bulbizarre caché",text:"Rencontre de test dans les hautes herbes.",sprite:"bulbasaur",hidden:true}
];
function key(x,y){return `${x}:${y}`}
function walkable(type){return !["tree","water"].includes(type)}
function buildTiles(removed,boulder){return BASE_MAP.map((row,y)=>row.map((type,x)=>({x,y,type:removed.has(key(x,y))?"grass":(boulder.x===x&&boulder.y===y?"rock":type)})))}
function Header({mode,setMode}){return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span/></div><div><strong>POKÉMON JDR</strong><small>GÉNÉRATION I · KANTO</small></div></div><div className="mode-switch"><button className={mode==="player"?"active":""} onClick={()=>setMode("player")}>JOUEUR</button><button className={mode==="gm"?"active gm":""} onClick={()=>setMode("gm")}>MJ</button></div></header>}
function Tile({tile}){return <div className={`tile tile-${tile.type}`} style={{left:tile.x*TILE,top:tile.y*TILE}}/>}
function Building({b,onClick}){return <button className={`building building-${b.id}`} style={{left:b.x*TILE,top:b.y*TILE,width:b.w*TILE,height:b.h*TILE}} onClick={()=>onClick(b.id)} title={b.title}><span>{b.id==="lab"?"LAB":b.id==="center"?"P.C.":b.id==="mart"?"SHOP":"HOUSE"}</span><i/></button>}
function RedSprite({direction="down"}){const frame={down:0,up:1,left:2,right:3}[direction]??0;return <span className={`red-sprite red-${direction}`} style={{backgroundImage:`url(${RED_SPRITE})`,backgroundPosition:`0 -${frame*32}px`}}/>}
function ObjectSprite({object,visible,selected,onInteract}){if(!visible)return null;const content=object.sprite?<img src={SPRITES[object.sprite]} alt=""/>:object.kind==="npc"?<RedSprite/>:<span className={`object-icon icon-${object.kind}`}/>;return <button className={`map-object object-${object.kind} ${selected?"selected":""}`} style={{left:object.x*TILE,top:object.y*TILE}} onClick={()=>onInteract(object.id)} title={object.title}>{content}<b>{object.kind==="npc"?"PNJ":object.kind==="wild"?"?":object.kind==="cut"?"COUPE":object.kind==="strength"?"FORCE":""}</b></button>}
function InteractionPanel({selected,mode,onAction}){const item=[...OBJECTS,...BUILDINGS].find(x=>x.id===selected);if(!item)return <aside className="side-panel"><div className="panel-title">{mode==="gm"?"MJ · OUTILS":"JOUEUR · AIDE"}</div><div className="panel-empty"><strong>Carte Gen I interactive</strong><p>{mode==="gm"?"Sélectionnez un PNJ, une rencontre, un obstacle ou un bâtiment.":"ZQSD / WASD / flèches pour marcher. E pour interagir avec ce qui est devant vous."}</p></div></aside>;return <aside className="side-panel"><div className="panel-title">{mode==="gm"?"MJ · ÉLÉMENT":"INTERACTION"}</div><div className="interaction"><span className={`kind kind-${item.kind||"building"}`}>{(item.kind||"building").toUpperCase()}</span><h2>{item.title}</h2><p>{item.text}</p>{mode==="gm"&&item.kind==="npc"&&<div className="stats"><span>ÉQUIPE</span><strong>À définir</strong><span>NIVEAU</span><strong>À définir</strong><span>PV</span><strong>À définir</strong></div>}<button className="action" onClick={()=>onAction(item)}>{mode==="gm"?"OUVRIR LA FICHE MJ":"INTERAGIR"}</button></div></aside>}
function MapControls({zoom,setZoom}){return <div className="controls"><button onClick={()=>setZoom(Math.min(MAX_ZOOM,+(zoom+.25).toFixed(2)))}>+</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(Math.max(1,+(zoom-.25).toFixed(2)))}>−</button><button onClick={()=>setZoom(1)}>1×</button></div>}
function GameMap({mode,selected,setSelected,onAction}){
 const viewportRef=useRef(null),pointers=useRef(new Map()),gesture=useRef(null);
 const [zoom,setZoom]=useState(1),[camera,setCamera]=useState({x:0,y:0}),[player,setPlayer]=useState({x:12,y:14,direction:"down"}),[removed,setRemoved]=useState(()=>new Set()),[boulder,setBoulder]=useState({x:19,y:19}),[message,setMessage]=useState("");
 const tiles=useMemo(()=>buildTiles(removed,boulder),[removed,boulder]);
 const viewport=()=>{const el=viewportRef.current;return {w:el?.clientWidth||800,h:el?.clientHeight||600}};
 const clamp=(x,y,z=zoom)=>{const {w,h}=viewport(),minX=Math.min(0,w-WORLD_W*z),minY=Math.min(0,h-WORLD_H*z);return{x:Math.min(0,Math.max(minX,x)),y:Math.min(0,Math.max(minY,y))}};
 const playerCamera=(p=player,z=zoom)=>{const {w,h}=viewport();return{x:w/2-(p.x+.5)*TILE*z,y:h/2-(p.y+.5)*TILE*z}};
 useEffect(()=>{if(mode==="player")setCamera(playerCamera());else setCamera(c=>clamp(c.x,c.y))},[mode,player.x,player.y,zoom]);
 useEffect(()=>{const f=()=>setCamera(mode==="player"?playerCamera():clamp(camera.x,camera.y));window.addEventListener("resize",f);return()=>window.removeEventListener("resize",f)},[mode,player.x,player.y,zoom]);
 function blocked(x,y){if(x<0||y<0||x>=COLS||y>=ROWS)return true;if(!walkable(BASE_MAP[y][x]))return true;if(boulder.x===x&&boulder.y===y)return true;for(const b of BUILDINGS)if(x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h){const door=x===b.x+Math.floor(b.w/2)&&y===b.y+b.h-1;if(!door)return true}return false}
 function interact(p){const tx=p.x+(p.direction==="left"?-1:p.direction==="right"?1:0),ty=p.y+(p.direction==="up"?-1:p.direction==="down"?1:0);const near=OBJECTS.find(o=>o.x===tx&&o.y===ty)||OBJECTS.find(o=>Math.abs(o.x-p.x)<=1&&Math.abs(o.y-p.y)<=1);const building=BUILDINGS.find(b=>tx>=b.x&&tx<b.x+b.w&&ty>=b.y&&ty<b.y+b.h);if(near){setSelected(near.id);if(near.kind==="cut"){const n=new Set(removed);n.add(key(near.x,near.y));setRemoved(n);setMessage("COUPE : arbre supprimé.")}else if(near.kind==="strength"){const nx=near.x+(p.direction==="left"?-1:1);if(!blocked(nx,near.y)){setBoulder({x:nx,y:near.y});setMessage("FORCE : rocher déplacé.")}else setMessage("Impossible de pousser le rocher ici.")}else setMessage(near.text)}else if(building){setSelected(building.id);setMessage(building.text)}else setMessage("Aucune interaction ici.")}
 useEffect(()=>{if(mode!=="player")return;const dirs={arrowleft:[-1,0,"left"],q:[-1,0,"left"],a:[-1,0,"left"],arrowright:[1,0,"right"],d:[1,0,"right"],arrowup:[0,-1,"up"],z:[0,-1,"up"],w:[0,-1,"up"],arrowdown:[0,1,"down"],s:[0,1,"down"]};const down=e=>{const k=e.key.toLowerCase();if(k==="e"){e.preventDefault();interact(player);return}if(!dirs[k])return;e.preventDefault();const[dx,dy,direction]=dirs[k];setPlayer(p=>{const nx=p.x+dx,ny=p.y+dy;return blocked(nx,ny)?{...p,direction}:{x:nx,y:ny,direction}})};window.addEventListener("keydown",down,{passive:false});return()=>window.removeEventListener("keydown",down)},[mode,player,removed,boulder]);
 function pointerDown(e){if(mode!=="gm")return;e.currentTarget.setPointerCapture(e.pointerId);pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.current.size===1)gesture.current={type:"pan",x:e.clientX,y:e.clientY,origin:camera};else{const p=[...pointers.current.values()];gesture.current={type:"pinch",distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom}}}
 function pointerMove(e){if(mode!=="gm"||!pointers.current.has(e.pointerId))return;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...pointers.current.values()];if(p.length===1&&gesture.current?.type==="pan"){const g=gesture.current;setCamera(clamp(g.origin.x+e.clientX-g.x,g.origin.y+e.clientY-g.y))}else if(p.length===2&&gesture.current?.type==="pinch"){const g=gesture.current,d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);setZoom(Math.min(MAX_ZOOM,Math.max(1,+(g.zoom*d/g.distance).toFixed(2)))}}
 function pointerUp(e){pointers.current.delete(e.pointerId);if(!pointers.current.size)gesture.current=null}
 function wheel(e){if(mode!=="gm")return;e.preventDefault();if(e.ctrlKey)setZoom(z=>Math.min(MAX_ZOOM,Math.max(1,+(z+(e.deltaY<0?.15:-.15)).toFixed(2))));else setCamera(c=>clamp(c.x-e.deltaX,c.y-e.deltaY))}
 const pos=mode==="player"?playerCamera():camera;
 return <div className="map-shell"><div className="map-heading"><div><span>MONDE DE JEU</span><strong>BOURG PALETTE · ROUTE 1</strong></div><small>{mode==="gm"?"MJ · PAN / PINCEMENT / MOLETTE":"JOUEUR · ZQSD / WASD / FLÈCHES · E"}</small></div>{mode==="gm"&&<MapControls zoom={zoom} setZoom={z=>{setZoom(z);setCamera(c=>clamp(c.x,c.y,z))}}/>}<div ref={viewportRef} className="map-viewport" onWheel={wheel} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={pointerUp}>{message&&<div className="map-toast">{message}</div>}<div className="world" style={{left:pos.x,top:pos.y,width:WORLD_W,height:WORLD_H,transform:`scale(${zoom})`}}><div className="texture-attribution">TUILES ORIGINALES · POKERED</div>{tiles.flat().map(t=><Tile tile={t} key={`${t.x}-${t.y}`)} />)}{BUILDINGS.map(b=><Building key={b.id} b={b} onClick={id=>{setSelected(id);onAction(b)}}/>)}{OBJECTS.map(o=>{const visible=mode==="gm"||!o.hidden;return <ObjectSprite key={o.id} object={o} visible={visible} selected={selected===o.id} onInteract={id=>{setSelected(id);onAction(o)}}/>})}{mode==="player"&&<div className="player" style={{left:player.x*TILE,top:player.y*TILE}}><RedSprite direction={player.direction}/></div>}</div></div></div>}
function App(){const[mode,setMode]=useState("player"),[selected,setSelected]=useState(null),[message,setMessage]=useState("");const action=item=>setMessage(`${item.title} : interaction JDR activée.`);return <div className={`game ${mode==="gm"?"gm-mode":"player-mode"}`}><Header mode={mode} setMode={setMode}/><main className="layout"><GameMap mode={mode} selected={selected} setSelected={setSelected} onAction={action}/><InteractionPanel selected={selected} mode={mode} onAction={action}/></main>{message&&<button className="global-message" onClick={()=>setMessage("")}>{message}</button>}</div>}
createRoot(document.getElementById("root")).render(<React.StrictMode><App/></React.StrictMode>);
