import React,{useEffect,useMemo,useState}from'react';
const spriteUrl=(url,base)=>url?`${base}sprite-source/${url.replace(/^\//,'')}`:null;
export default function Pokedex({open,onClose}){
 const[mapping,setMapping]=useState({}),[query,setQuery]=useState('');
 useEffect(()=>{if(!open)return;fetch(`${import.meta.env.BASE_URL}data/pokemon-gen1-sprite-mapping.json`).then(r=>r.json()).then(setMapping).catch(()=>setMapping({}));},[open]);
 const entries=useMemo(()=>Object.values(mapping).filter(p=>p.name?.toLowerCase().includes(query.toLowerCase())),[mapping,query]);
 if(!open)return null; const base=import.meta.env.BASE_URL||'/';
 return <div className="modal-backdrop"><section className="modal pokedex"><header><div><small>DONNÉES EXTRAITES</small><h2>Pokédex · Génération I</h2></div><button onClick={onClose}>×</button></header><div className="pokedex-search"><input value={query}onChange={e=>setQuery(e.target.value)}placeholder="Rechercher un Pokémon…"/><span>{entries.length}/151</span></div><div className="pokedex-grid">{entries.map(p=><article key={p.nationalDex} className="pokemon-card"><div className="dex">#{String(p.nationalDex).padStart(3,'0')}</div><div className="pokemon-sprites">{p.front&&<img src={spriteUrl(p.front,base)} alt={`${p.name} face`}/>} {p.back&&<img src={spriteUrl(p.back,base)} alt={`${p.name} dos`}/>}</div><b>{p.name}</b><small>{p.status==='mapped'?'SPRITE MAPPÉ':'MANQUANT'}</small></article>)}</div><footer>Source : <code>tools/pokegra/png</code> · lecture seule · aucun PNG original n'est modifié.</footer></section></div>;
}
