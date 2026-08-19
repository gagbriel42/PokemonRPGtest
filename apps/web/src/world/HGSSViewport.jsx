import React,{useEffect,useMemo,useState}from'react';

const BASE=import.meta.env.BASE_URL||'/';

async function getJson(path){
 const r=await fetch(`${BASE}${path}`);
 if(!r.ok)throw new Error(`${path} HTTP ${r.status}`);
 return r.json();
}

export default function HGSSViewport({mapId=30,name='Route 29',connections=[],onChange}){
 const [matrix,setMatrix]=useState(null),[catalog,setCatalog]=useState(null),[error,setError]=useState('');
 useEffect(()=>{
  let alive=true;
  Promise.all([getJson('assets/hgss/johto-matrix.json'),getJson('assets/hgss/map-catalog.json')])
   .then(([m,c])=>{if(!alive)return;setMatrix(m);setCatalog(c);setError('')})
   .catch(e=>alive&&setError(e.message));
  return()=>{alive=false};
 },[]);

 const current=catalog?.maps?.[String(mapId)];
 const width=matrix?.width||47;
 const height=matrix?.height||17;
 const cells=useMemo(()=>{
  if(!matrix)return [];
  const occupied=new Map((matrix.nonZero||[]).map(([x,y,id])=>[`${x},${y}`,id]));
  return Array.from({length:width*height},(_,i)=>{
   const x=i%width,y=Math.floor(i/width),id=occupied.get(`${x},${y}`)||0;
   return {x,y,id,selected:current?.matrix?.[0]===x&&current?.matrix?.[1]===y};
  });
 },[matrix,width,height,current]);

 return <section className="hgss-play">
  <div className="hgss-head">
   <b>{current?.name||name}</b>
   <span>{error?`ERREUR : ${error}`:matrix?`HGSS · map ${mapId} · matrice ${current?.matrix?.join(', ')||'—'}`:'Chargement HGSS…'}</span>
  </div>

  <div className="hgss-canvas hgss-matrix-canvas">
   {error?<div className="hgss-error"><b>Impossible de charger la carte.</b><br/>{error}</div>:!matrix?<div className="hgss-error">Chargement des données extraites…</div>:
    <div className="hgss-matrix" style={{gridTemplateColumns:`repeat(${width},minmax(24px,1fr))`}}>
     {cells.map(c=><div key={`${c.x}-${c.y}`} className={`hgss-cell ${c.id?'occupied':''} ${c.selected?'selected':''}`} title={`cellule ${c.x},${c.y} · map ${c.id||'vide'}`}>
      {c.id||''}
     </div>)}
    </div>}
  </div>

  <div className="hgss-map-info">
   <div><b>{current?.name||name}</b><span>{current?` · ${current.dimensions?.[0]}×${current.dimensions?.[1]} · ${current.model}`:' · correspondance absente'}</span></div>
   <span>{matrix?`${cells.filter(c=>c.id).length} cellules renseignées / ${width*height}`:''}</span>
  </div>

  <div className="hgss-nav">
   {connections.map(c=><button key={c.id} onClick={()=>onChange?.(c)}>{c.name}</button>)}
  </div>
 </section>;
}
