import React,{useMemo,useState}from'react';
const COLS=32,ROWS=20;
export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const [zoom,setZoom]=useState(1),[offset,setOffset]=useState({x:0,y:0});
 const base=import.meta.env.BASE_URL||'/';
 const tileUrl=`${base}assets/titleset1.png`;
 const seed=Number(mapId)||30;
 const tiles=useMemo(()=>Array.from({length:COLS*ROWS},(_,i)=>{const x=i%COLS,y=Math.floor(i/COLS),v=(seed*13+x*7+y*11)%64;return{x,y,sx:(v%8)*32,sy:(Math.floor(v/8)%65)*32}}),[seed]);
 const move=(dx,dy)=>setOffset(o=>({x:o.x+dx,y:o.y+dy}));
 const reset=()=>{setZoom(1);setOffset({x:0,y:0})};
 return <section className="hgss-play"><div className="hgss-head"><b>{name}</b><span>MAP {seed} · tileset HGSS extrait · PNG source intact</span></div><div className="hgss-toolbar"><button onClick={()=>setZoom(z=>Math.max(.5,z-.25))}>−</button><b>{Math.round(zoom*100)}%</b><button onClick={()=>setZoom(z=>Math.min(2.5,z+.25))}>+</button><button onClick={reset}>CENTRER</button></div><div className="hgss-map-window"><div className="hgss-map-grid" style={{transform:`translate(${offset.x}px,${offset.y}px) scale(${zoom})`}}>{tiles.map(t=><i key={`${t.x}-${t.y}`} style={{backgroundImage:`url(${tileUrl})`,backgroundPosition:`-${t.sx}px -${t.sy}px`}}/>)}<div className="hgss-map-label"><strong>{name}</strong><small>Map {seed}</small></div></div></div><div className="hgss-controls"><button onClick={()=>move(0,-96)}>▲</button><button onClick={()=>move(-96,0)}>◀</button><button onClick={reset}>●</button><button onClick={()=>move(96,0)}>▶</button><button onClick={()=>move(0,96)}>▼</button></div><div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div></section>;
}
