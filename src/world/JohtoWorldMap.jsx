import React,{useEffect,useMemo,useState}from'react';
import'./johto-world-map.css';

const BASE=(import.meta.env.BASE_URL||'/').replace(/\/$/,'');
const DEFAULT={width:47,height:17,nonZero:[]};

function pos(name){
 const P={
  'New Bark Town':[32,15],'Cherrygrove City':[28,12],'Violet City':[16,7],'Azalea Town':[14,11],
  'Goldenrod City':[20,8],'Ecruteak City':[28,8],'Olivine City':[11,12],'Cianwood City':[7,10],
  'Mahogany Town':[40,7],'Blackthorn City':[37,14],'Lake of Rage':[42,5],'Victory Road':[44,8],
  'Mt. Silver':[44,6],'Route 29':[31,14],'Route 30':[27,12],'Route 31':[18,9],'Route 32':[15,10],
  'Route 33':[13,12],'Route 34':[20,9],'Route 35':[22,8],'Route 36':[25,7],'Route 37':[28,7],
  'Route 38':[25,6],'Route 39':[21,6],'Route 40':[18,5],'Route 41':[10,6],'Route 42':[35,7],
  'Route 43':[40,5],'Route 44':[37,9],'Route 45':[36,12],'Route 46':[28,14],'Route 47':[8,13],
  'Route 48':[11,13]
 };
 return P[name]||null;
}

export default function JohtoWorldMap({location,onChange}){
 const[matrix,setMatrix]=useState(DEFAULT);const[zoom,setZoom]=useState(1);
 useEffect(()=>{let alive=true;fetch(`${BASE}/assets/hgss/johto-matrix.json`).then(r=>r.ok?r.json():DEFAULT).then(m=>alive&&setMatrix(m||DEFAULT)).catch(()=>{});return()=>{alive=false}},[]);
 const cells=useMemo(()=>{const m=new Map;for(const[x,y,id]of matrix.nonZero||[])m.set(`${x}:${y}`,id);return m},[matrix]);
 const selected=pos(location?.name);
 const locations=useMemo(()=>Object.keys({
  'New Bark Town':1,'Cherrygrove City':1,'Violet City':1,'Azalea Town':1,'Goldenrod City':1,'Ecruteak City':1,'Olivine City':1,'Cianwood City':1,'Mahogany Town':1,'Blackthorn City':1,'Lake of Rage':1,'Victory Road':1,'Mt. Silver':1,'Route 29':1,'Route 30':1,'Route 31':1,'Route 32':1,'Route 33':1,'Route 34':1,'Route 35':1,'Route 36':1,'Route 37':1,'Route 38':1,'Route 39':1,'Route 40':1,'Route 41':1,'Route 42':1,'Route 43':1,'Route 44':1,'Route 45':1,'Route 46':1,'Route 47':1,'Route 48':1
 }),[]);
 return <section className="jwm"><header><div><b>JOHTO · CARTE RÉELLE</b><small>Matrice extraite de Pokémon SoulSilver · {matrix.width} × {matrix.height}</small></div><span>{matrix.nonZero?.length||0} zones ROM</span></header><div className="jwm-map"><div className="jwm-rom-grid" style={{'--cols':matrix.width,'--rows':matrix.height,transform:`scale(${zoom})`}}>{Array.from({length:matrix.width*matrix.height},(_,i)=>{const x=i%matrix.width,y=Math.floor(i/matrix.width),id=cells.get(`${x}:${y}`);return <div key={`${x}:${y}`} className={`jwm-cell ${id!=null?'land':''}`} title={id!=null?`Map ${id} · cellule ${x},${y}`:''}/>})}</div>{locations.map(name=>{const p=pos(name);if(!p)return null;const active=location?.name===name;return <button key={name} type="button" className={`jwm-location ${active?'active':''}`} style={{left:`${(p[0]/matrix.width)*100}%`,top:`${(p[1]/matrix.height)*100}%`}} onClick={()=>onChange?.({name})}><i/ ><span>{name}</span></button>})}<div className="jwm-compass">N</div><div className="jwm-legend"><b>STRUCTURE ROM</b><span>Chaque zone = une entrée de la matrice HGSS</span><small>Les positions sont calculées sur la matrice extraite, pas sur une carte dessinée artificiellement.</small></div></div><footer className="jwm-current"><b>{location?.name||'Johto'}</b><div><button onClick={()=>setZoom(z=>Math.max(.7,z-.15))}>−</button><b>{Math.round(zoom*100)}%</b><button onClick={()=>setZoom(z=>Math.min(1.8,z+.15))}>+</button></div></footer></section>
}
