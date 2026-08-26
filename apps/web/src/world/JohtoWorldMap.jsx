import React,{useEffect,useState}from'react';
import'./johto-world-map.css';
import{LOCATIONS}from'./locations.js';
const BASE=(import.meta.env.BASE_URL||'/').replace(/\/$/,'');
export default function JohtoWorldMap({location,onChange}){
 const [map,setMap]=useState(null),[error,setError]=useState(false);
 useEffect(()=>{let alive=true;fetch(`${BASE}/assets/hgss/johto-world-map.png`).then(r=>{if(!r.ok)throw Error();return r.blob()}).then(b=>alive&&setMap(URL.createObjectURL(b))).catch(()=>alive&&setError(true));return()=>{alive=false}},[]);
 const locations=LOCATIONS.filter(x=>x.region==='Johto');
 return <section className="jwm"><header><div><b>JOHTO · CARTE SOULSILVER</b><small>Carte générée depuis les données graphiques HGSS</small></div></header><div className="jwm-map">{map?<img className="jwm-real-map" src={map} alt="Carte de Johto"/>:<div className="jwm-loading">{error?'La carte HGSS n’est pas encore générée.':'Chargement de la carte HGSS…'}</div>}{locations.map(l=><button key={l.id} type="button" className={`jwm-location ${l.type} ${location?.name===l.name?'active':''}`} onClick={()=>onChange?.(l)} title={l.name}><span>{l.name}</span></button>)}</div><footer className="jwm-current"><b>POSITION : {location?.name||'Johto'}</b></footer></section>;
}