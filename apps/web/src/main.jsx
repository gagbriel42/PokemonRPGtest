import React,{useEffect,useMemo,useRef,useState}from"react";
import{createRoot}from"react-dom/client";
import"./style.css";

const TILE=32,MIN_ZOOM=.5,MAX_ZOOM=4;
const BASE=import.meta.env.BASE_URL||"/";
const TILESET=`${BASE}assets/titleset1.png`;
const SPRITES="https://raw.githubusercontent.com/pret/pokecrystal/master/gfx/sprites/";
const POKE="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/";

const TILE_POS={grass:[2,2],path:[5,0],water:[1,0],tree:[0,0],tallgrass:[0,2],flower:[1,2],rock:[3,2],bridge:[1,1]};
const FALLBACK={grass:"#69a84b",path:"#d5b878",water:"#4ba7cf",tree:"#397445",tallgrass:"#57994a",flower:"#6ba64b",rock:"#8d887c",bridge:"#a9784c"};
const TYPES=Object.keys(TILE_POS);

const GENS=[
 {id:1,name:"Kanto",style:"Rouge · Bleu · Jaune"},
 {id:2,name:"Johto",style:"Or · Argent · Cristal"},
 {id:3,name:"Hoenn",style:"Rubis · Saphir · Émeraude"},
 {id:4,name:"Johto",style:"HeartGold · SoulSilver"},
 {id:5,name:"Unys",style:"Noir · Blanc"}
];
const MAPS=[
 {id:"palette",gen:1,name:"Bourg Palette",region:"Kanto",width:36,height:28},
 {id:"route1",gen:1,name:"Route 1",region:"Kanto",width:42,height:30},
 {id:"bourg-geon",gen:2,name:"Bourg Geon",region:"Johto",width:42,height:30},
 {id:"route29",gen:2,name:"Route 29",region:"Johto",width:46,height:30},
 {id:"newbark-hgss",gen:4,name:"Bourg Geon · HGSS",region:"Johto",width:46,height:32},
 {id:"route29-hgss",gen:4,name:"Route 29 · HGSS",region:"Johto",width:52,height:34}
];
function makeGrid(w,h,id="palette"){
 const g=Array.from({length:h},()=>Array(w).fill("grass"));
 const set=(x,y,t)=>{if(x>=0&&y>=0&&x<w&&y<h)g[y][x]=t};
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(x<2||y<2||x>=w-2||y>=h-2)set(x,y,"tree");
 const cx=Math.floor(w/2);
 for(let y=2;y<h-2;y++)for(let x=cx-1;x<=cx+1;x++)set(x,y,"path");
 for(let y=Math.floor(h*.47);y<=Math.floor(h*.53);y++)for(let x=2;x<w-2;x++)set(x,y,"path");
 if(id.includes("route")){for(let y=4;y<Math.floor(h*.45);y++)for(let x=4;x<14;x++)if((x+y)%2===0)set(x,y,"tallgrass");for(let y=Math.floor(h*.62);y<h-3;y++)for(let x=w-16;x<w-3;x++)if((x+y)%3!==0)set(x,y,"tallgrass");}
 else{for(let y=4;y<11;y++)for(let x=5;x<13;x++)if((x+y)%3!==0)set(x,y,"tallgrass");for(let y=h-10;y<h-3;y++)for(let x=w-14;x<w-4;x++)if((x+y)%3===0)set(x,y,"flower");}
 if(id.includes("route29")){for(let y=6;y<13;y++)for(let x=w-15;x<w-4;x++)set(x,y,"water");for(let x=w-17;x<w-14;x++)for(let y=7;y<11;y++)set(x,y,"water");}
 if(id.includes("newbark")||id==="bourg-geon"){for(let y=5;y<11;y++)for(let x=3;x<11;x++)if((x+y)%2===0)set(x,y,"flower");for(let y=5;y<10;y++)for(let x=w-15;x<w-7;x++)set(x,y,"water");}
 return g;
}
const BUILDINGS=[
 {id:"house",x:4,y:4,w:7,h:5,name:"Maison"},
 {id:"lab",x:25,y:4,w:8,h:6,name:"Laboratoire"},
 {id:"center",x:4,y:18,w:8,h:5,name:"Centre Pokémon"},
 {id:"mart",x:25,y:18,w:7,h:5,name:"Boutique"}
];
const SPRITE={chris:`${SPRITES}chris.png`,oak:`${SPRITES}oak.png`,silver:`${SPRITES}silver.png`,youngster:`${SPRITES}youngster.png`,lass:`${SPRITES}lass.png`};
const OBJECTS=[
 {id:"oak",x:21,y:11,kind:"npc",name:"Professeur Chen",text:"Le professeur observe la route.",sprite:SPRITE.oak,palette:"npc-blue"},
 {id:"rival",x:12,y:14,kind:"npc",name:"Rival",text:"Le rival attend ici.",sprite:SPRITE.silver,palette:"npc-purple"},
 {id:"youngster",x:18,y:9,kind:"npc",name:"Dresseur",text:"Un dresseur de la Route 1.",sprite:SPRITE.youngster,palette:"npc-green"},
 {id:"lass",x:27,y:12,kind:"npc",name:"Dresseuse",text:"Elle surveille le passage.",sprite:SPRITE.lass,palette:"npc-pink"},
 {id:"cut",x:12,y:9,kind:"cut",name:"Petit arbre",text:"COUPE permet de retirer cet obstacle."},
 {id:"boulder",x:22,y:20,kind:"strength",name:"Rocher",text:"FORCE permet de pousser ce rocher."},
 {id:"sign",x:13,y:15,kind:"sign",name:"Panneau",text:"BOURG PALETTE"},
 {id:"pikachu",x:28,y:20,kind:"wild",name:"Pikachu sauvage",text:"Rencontre dans les hautes herbes.",sprite:`${POKE}25.png`},
 {id:"rattata",x:30,y:22,kind:"wild",name:"Rattata sauvage",text:"Rencontre dans les hautes herbes.",sprite:`${POKE}19.png`}
];
function Header({mode,setMode,onMaps,onEditor}){return <header className="topbar"><div className="brand"><div className="pokeball-logo"><span/></div><div><strong>POKÉMON JDR</strong><small>MAP ENGINE · ESSENTIALS STYLE</small></div></div><div className="top-actions"><button onClick={onMaps}>CARTES</button><button onClick={onEditor}>ÉDITEUR</button><div className="mode-switch"><button className={mode==="player"?"active":""}onClick={()=>setMode("player")}>JOUEUR</button><button className={mode==="gm"?"active gm":""}onClick={()=>setMode("gm")}>MJ</button></div></div></header>}
function CharacterSprite({src,palette="npc-blue",direction="down"}){const row={down:0,up:1,left:2,right:3}[direction]??0;return <span className={`character-sprite ${palette}`}style={{backgroundImage:`url(${src})`,backgroundSize:"96px 128px",backgroundPosition:`-32px -${row*32}px`}}/>}
function Tile({type,x,y,onPaint}){const p=TILE_POS[type]||TILE_POS.grass;return <div className={`tile tile-${type}`}style={{left:x*TILE,top:y*TILE,backgroundColor:FALLBACK[type],backgroundImage:`url(${TILESET})`,backgroundSize:"256px 2080px",backgroundPosition:`-${p[0]*TILE}px -${p[1]*TILE}px`}}onPointerDown={onPaint?e=>{e.stopPropagation();onPaint(x,y)}:undefined}/>}
function Controls({zoom,setZoom,onFit}){return <div className="controls"><button onClick={()=>setZoom(z=>Math.min(MAX_ZOOM,z+.25))}>+</button><span>{Math.round(zoom*100)}%</span><button onClick={()=>setZoom(z=>Math.max(MIN_ZOOM,z-.25))}>−</button><button onClick={onFit}>FIT</button></div>}
function MapLibrary({open,onClose,onSelect,current}){const[g,setG]=useState(current?.gen||1);if(!open)return null;return <div className="modal-backdrop"onClick={onClose}><section className="modal map-library"onClick={e=>e.stopPropagation()}><header><div><small>BIBLIOTHÈQUE</small><h2>Cartes Pokémon</h2></div><button onClick={onClose}>×</button></header><nav className="gen-tabs">{GENS.map(x=><button className={g===x.id?"selected":""}key={x.id}onClick={()=>setG(x.id)}>GEN {x.id}<small>{x.name}</small></button>)}</nav><div className="map-list">{MAPS.filter(x=>x.gen===g).map(m=><button key={m.id}onClick={()=>{onSelect({...m,grid:makeGrid(m.width,m.height,m.id)});onClose()}}><b>{m.name}</b><small>{m.region} · {m.width}×{m.height}</small></button>)}</div><footer>Atlas 16×16 · rendu pixel-art 2× · caméra et zoom tactiles.</footer></section></div>}
function MapEditor({open,onClose,map,onSave}){const[grid,setGrid]=useState(map.grid),[tool,setTool]=useState("grass"),[name,setName]=useState(map.name+" — copie"),[cols,setCols]=useState(map.width),[rows,setRows]=useState(map.height);useEffect(()=>{if(open){setGrid(map.grid);setName(map.name+" — copie");setCols(map.width);setRows(map.height)}},[open,map]);if(!open)return null;const paint=(x,y)=>setGrid(g=>g.map((r,yy)=>yy===y?r.map((v,xx)=>xx===x?tool:v):r));const resize=(w,h)=>{setGrid(g=>Array.from({length:h},(_,y)=>Array.from({length:w},(_,x)=>g[y]?.[x]||"grass")));setCols(w);setRows(h)};return <div className="modal-backdrop"><section className="modal editor"onClick={e=>e.stopPropagation()}><header><div><small>ÉDITEUR DE MAP</small><h2>{name}</h2></div><button onClick={onClose}>×</button></header><div className="editor-toolbar"><label>Nom<input value={name}onChange={e=>setName(e.target.value)}/></label><label>L<input type="number"min="8"max="80"value={cols}onChange={e=>resize(Math.max(8,+e.target.value||8),rows)}/></label><label>H<input type="number"min="8"max="60"value={rows}onChange={e=>resize(cols,Math.max(8,+e.target.value||8))}/></label></div><div className="editor-body"><aside className="palette">{TYPES.map(t=><button className={tool===t?"selected":""}key={t}onClick={()=>setTool(t)}><i className={`swatch ${t}`}style={{backgroundImage:`url(${TILESET})`,backgroundSize:"256px 2080px",backgroundPosition:`-${TILE_POS[t][0]*2}px -${TILE_POS[t][1]*2}px`,backgroundColor:FALLBACK[t]}}/>{t}</button>)}</aside><div className="editor-canvas"><div className="editor-grid"style={{width:cols*TILE,height:rows*TILE}}>{grid.map((r,y)=>r.map((t,x)=><Tile key={`${x}-${y}`}type={t}x={x}y={y}onPaint={paint}/>))}</div></div></div><footer><span>Outil : <b>{tool}</b></span><button className="action"onClick={()=>{onSave({...map,name,width:cols,height:rows,grid,custom:true});onClose()}}>ENREGISTRER</button></footer></section></div>}
function Building({b,onSelect}){return <button className={`building building-${b.id}`}style={{left:b.x*TILE,top:b.y*TILE,width:b.w*TILE,height:b.h*TILE}}onClick={()=>onSelect(b)}><span>{b.name}</span><i/></button>}
function MapObject({o,visible,selected,onSelect}){if(!visible)return null;const body=o.kind==="wild"?<img src={o.sprite}alt=""/>:o.sprite?<CharacterSprite src={o.sprite}palette={o.palette}/>:<span className={`object-icon icon-${o.kind}`}/>;return <button className={`map-object object-${o.kind} ${selected?"selected":""}`}style={{left:o.x*TILE,top:o.y*TILE}}onClick={()=>onSelect(o)}>{body}<b>{o.kind==="wild"?"WILD":o.kind.toUpperCase()}</b></button>}
function GameMap({mode,selected,setSelected,setMessage,map}){
 const ref=useRef(null),points=useRef(new Map()),gesture=useRef(null);
 const[zoom,setZoom]=useState(1),[camera,setCamera]=useState({x:0,y:0}),[player,setPlayer]=useState({x:14,y:16,direction:"down"});
 const W=map.width*TILE,H=map.height*TILE;
 const viewport=()=>({w:ref.current?.clientWidth||800,h:ref.current?.clientHeight||600});
 const clamp=(x,y,z=zoom)=>{const{w,h}=viewport();return{x:Math.min(0,Math.max(w-W*z,x)),y:Math.min(0,Math.max(h-H*z,y))}};
 const fit=()=>{const{w,h}=viewport();const z=Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,w/W,h/H)*.96);setZoom(z);setCamera({x:(w-W*z)/2,y:(h-H*z)/2})};
 const center=()=>{const{w,h}=viewport();return{x:w/2-(player.x+.5)*TILE*zoom,y:h/2-(player.y+.5)*TILE*zoom}};
 useEffect(()=>{if(mode==="player")setCamera(center());else fit()},[map.id,mode]);
 const blocked=(x,y)=>{if(x<0||y<0||x>=map.width||y>=map.height)return true;if(["tree","water"].includes(map.grid[y]?.[x]))return true;return BUILDINGS.some(b=>x>=b.x&&x<b.x+b.w&&y>=b.y&&y<b.y+b.h&&!(x===b.x+Math.floor(b.w/2)&&y===b.y+b.h-1))};
 useEffect(()=>{if(mode!=="player")return;const dirs={z:[0,-1,"up"],w:[0,-1,"up"],arrowup:[0,-1,"up"],q:[-1,0,"left"],a:[-1,0,"left"],arrowleft:[-1,0,"left"],s:[0,1,"down"],arrowdown:[0,1,"down"],d:[1,0,"right"],arrowright:[1,0,"right"]};const f=e=>{const d=dirs[e.key.toLowerCase()];if(!d)return;e.preventDefault();setPlayer(p=>{const nx=p.x+d[0],ny=p.y+d[1];return blocked(nx,ny)?{...p,direction:d[2]}:{x:nx,y:ny,direction:d[2]}})};window.addEventListener("keydown",f,{passive:false});return()=>window.removeEventListener("keydown",f)},[mode,map]);
 const down=e=>{if(mode!=="gm")return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});e.currentTarget.setPointerCapture?.(e.pointerId);if(points.current.size===1)gesture.current={type:"pan",x:e.clientX,y:e.clientY,origin:camera};if(points.current.size===2){const p=[...points.current.values()];gesture.current={type:"pinch",distance:Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y),zoom}}};
 const move=e=>{if(mode!=="gm"||!points.current.has(e.pointerId))return;points.current.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...points.current.values()];if(p.length===1&&gesture.current?.type==="pan"){const g=gesture.current;setCamera(clamp(g.origin.x+e.clientX-g.x,g.origin.y+e.clientY-g.y))}else if(p.length===2&&gesture.current?.type==="pinch"){const g=gesture.current,d=Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y);setZoom(Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,g.zoom*d/g.distance))}};
 const up=e=>{points.current.delete(e.pointerId);if(!points.current.size)gesture.current=null};
 const wheel=e=>{if(mode!=="gm")return;e.preventDefault();if(e.ctrlKey||e.metaKey)setZoom(z=>Math.max(MIN_ZOOM,Math.min(MAX_ZOOM,z+(e.deltaY<0?.15:-.15))));else setCamera(c=>clamp(c.x-e.deltaX,c.y-e.deltaY))};
 const tiles=useMemo(()=>map.grid.flatMap((r,y)=>r.map((t,x)=><Tile key={`${x}-${y}`}type={t}x={x}y={y}/>)),[map.grid]);
 return <div className="map-shell"><div className="map-heading"><div><span>CARTE INTERACTIVE</span><strong>{map.name.toUpperCase()}</strong></div><small>{mode==="gm"?"MJ · PAN + ZOOM":"JOUEUR · CAMÉRA SUIVIE"}</small></div><div ref={ref}className="map-viewport"onWheel={wheel}onPointerDown={down}onPointerMove={move}onPointerUp={up}onPointerCancel={up}><Controls zoom={zoom}setZoom={setZoom}onFit={fit}/><div className="world"style={{width:W,height:H,transform:`translate3d(${camera.x}px,${camera.y}px,0) scale(${zoom})`}}>{tiles}{BUILDINGS.map(b=>b.x+b.w<map.width&&b.y+b.h<map.height?<Building key={b.id}b={b}onSelect={v=>{setSelected(v.id);setMessage(v.name)}}/>:null)}{OBJECTS.map(o=><MapObject key={o.id}o={o}visible={mode==="gm"||o.kind!=="wild"}selected={selected===o.id}onSelect={v=>{setSelected(v.id);setMessage(v.text)}}/>)}<div className="player"style={{left:player.x*TILE,top:player.y*TILE}}><CharacterSprite src={SPRITE.chris}palette="player"direction={player.direction}/></div></div></div><div className="map-hint">{mode==="gm"?"Glisser · molette déplacer · Ctrl/⌘ + molette zoom · 2 doigts zoom · FIT = toute la carte":"ZQSD / WASD / flèches · caméra automatique"}</div></div>;
}
function SidePanel({selected,message,map}){const item=[...OBJECTS,...BUILDINGS].find(x=>x.id===selected);return <aside className="side-panel"><div className="panel-title">INFOS JDR</div><div className="current-map"><span>CARTE</span><strong>{map.name}</strong><small>{map.region} · {map.width}×{map.height}</small></div>{item?<div className="interaction"><span className="kind">{item.kind?.toUpperCase()||"LIEU"}</span><h2>{item.name}</h2><p>{item.text||"Élément de la carte."}</p></div>:<div className="panel-empty"><p>{message||"Sélectionnez un élément de la carte."}</p></div>}</aside>}
function App(){const[mode,setMode]=useState("player"),[maps,setMaps]=useState(false),[editor,setEditor]=useState(false),[selected,setSelected]=useState(null),[message,setMessage]=useState("Bienvenue dans Kanto."),[map,setMap]=useState(()=>{try{const s=localStorage.getItem("pokemon-jdr-map");return s?JSON.parse(s):{...MAPS[0],grid:makeGrid(MAPS[0].width,MAPS[0].height,MAPS[0].id)}}catch{return{...MAPS[0],grid:makeGrid(MAPS[0].width,MAPS[0].height,MAPS[0].id)}}});const saveMap=m=>{setMap(m);try{localStorage.setItem("pokemon-jdr-map",JSON.stringify(m))}catch{}};return <><Header mode={mode}setMode={setMode}onMaps={()=>setMaps(true)}onEditor={()=>setEditor(true)}/><main className="layout"><GameMap mode={mode}selected={selected}setSelected={setSelected}setMessage={setMessage}map={map}/><SidePanel selected={selected}message={message}map={map}/></main><MapLibrary open={maps}onClose={()=>setMaps(false)}onSelect={saveMap}current={map}/><MapEditor open={editor}onClose={()=>setEditor(false)}map={map}onSave={saveMap}/></>}
createRoot(document.getElementById("root")).render(<App/>);
