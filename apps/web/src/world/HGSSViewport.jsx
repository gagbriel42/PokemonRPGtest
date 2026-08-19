import React,{useEffect,useMemo,useState}from'react';
const BASE=import.meta.env.BASE_URL||'/';
export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const [matrix,setMatrix]=useState(null),[catalog,setCatalog]=useState(null),[error,setError]=useState('');
 useEffect(()=>{let alive=true;Promise.all([
  fetch(`${BASE}assets/hgss/johto-matrix.json`).then(r=>{if(!r.ok)throw Error(`matrix ${r.status}`);return r.json()}),
  fetch(`${BASE}assets/hgss/map-catalog.json`).then(r=>{if(!r.ok)throw Error(`catalog ${r.status}`);return r.json()})
 ]).then(([m,c])=>alive&&(setMatrix(m),setCatalog(c))).catch(e=>alive&&setError(`Données HGSS indisponibles : ${e.message}`));return()=>{alive=false}},[]);
 const current=catalog?.maps?.[String(mapId)];
 const cells=useMemo(()=>{if(!matrix)return [];const w=matrix.width||47,h=matrix.height||17,ids=new Map((matrix.nonZero||[]).map(([x,y,id])=>[`${x},${y}`,id]));return Array.from({length:w*h},(_,i)=>{const x=i%w,y=Math.floor(i/w);return{x,y,id:ids.get(`${x},${y}`)||0,selected:current?.matrix?.[0]===x&&current?.matrix?.[1]===y}})},[matrix,current]);
 return <section className="hgss-play"><div className="hgss-head"><b>{name}</b><span>{error||(!matrix?'Chargement de la matrice HGSS…':`HGSS réel · map ${mapId} · matrice ${current?.matrix?.join(', ')||'—'}`)}</span></div>
 <div className="hgss-canvas hgss-matrix-canvas">{error?<div className="hgss-error">{error}</div>:<div className="hgss-matrix" style={{gridTemplateColumns:`repeat(${matrix?.width||47},minmax(18px,1fr))`}}>{cells.map(c=><div key={`${c.x}-${c.y}`} className={`hgss-cell ${c.id?'occupied':''} ${c.selected?'selected':''}`} title={`Matrice ${c.x},${c.y} · map ${c.id||'—'}`}>{c.id||''}</div>)}</div>}</div>
 <div className="hgss-map-info"><b>{current?.name||name}</b><span>{current?`${current.dimensions?.[0]||32}×${current.dimensions?.[1]||32} · ${current.model}`:'Carte non cataloguée'}</span></div>
 <div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div></section>;
}
