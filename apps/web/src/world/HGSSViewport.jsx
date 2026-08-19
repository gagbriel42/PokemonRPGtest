import React,{useEffect,useMemo,useState}from'react';

const BASE=import.meta.env.BASE_URL||'/';

export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const [matrix,setMatrix]=useState(null);
 const [catalog,setCatalog]=useState(null);
 const [error,setError]=useState('');

 useEffect(()=>{
  let alive=true;
  Promise.all([
   fetch(`${BASE}assets/hgss/johto-matrix.json`).then(r=>r.ok?r.json():Promise.reject(new Error(`matrix ${r.status}`))),
   fetch(`${BASE}assets/hgss/map-catalog.json`).then(r=>r.ok?r.json():Promise.reject(new Error(`catalog ${r.status}`)))
  ]).then(([m,c])=>{if(alive){setMatrix(m);setCatalog(c)}}).catch(e=>alive&&setError(`Données HGSS indisponibles : ${e.message}`));
  return()=>{alive=false};
 },[]);

 const cells=useMemo(()=>{
  if(!matrix)return [];
  const out=new Map((matrix.nonZero||[]).map(([x,y,id])=>[`${x},${y}`,id]));
  const selected=catalog?.maps?.[String(mapId)]?.matrix;
  return Array.from({length:(matrix.width||47)*(matrix.height||17)},(_,i)=>{
   const x=i%(matrix.width||47),y=Math.floor(i/(matrix.width||47));
   const id=out.get(`${x},${y}`)||0;
   return {x,y,id,selected:selected?.[0]===x&&selected?.[1]===y};
  });
 },[matrix,catalog,mapId]);

 const current=catalog?.maps?.[String(mapId)];

 return <section className="hgss-play">
  <div className="hgss-head">
   <b>{name}</b>
   <span>{error||current?`HGSS réel · map ${mapId} · matrice ${current?.matrix?.join(', ')||'—'}`:'Chargement de la matrice HGSS…'}</span>
  </div>
  <div className="hgss-canvas hgss-matrix-canvas">
   {error?<div className="hgss-error">{error}</div>:<div className="hgss-matrix" style={{gridTemplateColumns:`repeat(${matrix?.width||47}, minmax(18px,1fr))`}}>
    {cells.map(c=><div key={`${c.x}-${c.y}`} className={`hgss-cell ${c.id?'occupied':''} ${c.selected?'selected':''}`} title={`Matrice ${c.x},${c.y} · map ${c.id||'—'}`}>
      {c.id||''}
    </div>)}
   </div>}
  </div>
  <div className="hgss-map-info">
   <b>{current?.name||name}</b>
   <span>{current?`${current.dimensions?.[0]||32}×${current.dimensions?.[1]||32} · modèle source : ${current.model}`:'Carte non encore cataloguée'}</span>
  </div>
  <div className="hgss-nav">{connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}</div>
 </section>
}
