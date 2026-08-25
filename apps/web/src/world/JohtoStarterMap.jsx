import React,{useMemo,useState}from'react';
import'./johto-starter-map.css';
const POKE='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
const HGSS='https://archives.bulbagarden.net/wiki/Special:Redirect/file/';
const MAPS={
 'New Bark Town':{fr:'Bourg Geon',en:'New Bark Town',image:`${HGSS}New_Bark_Town_HGSS.png`,width:1018,height:615,connections:{west:'Route 29',east:'Route 27'}},
 'Route 29':{fr:'Route 29',en:'Route 29',image:'https://www.pokemontrash.com/images/heartgold-soulsilver/cartes/route-29-partie-1.png',width:1581,height:558,connections:{west:'Cherrygrove City',east:'New Bark Town',north:'Route 46'}},
 'Cherrygrove City':{fr:'Ville Griotte',en:'Cherrygrove City',image:`${HGSS}Cherrygrove_City_HGSS.png`,width:1034,height:370,connections:{east:'Route 29',north:'Route 30'}}
};
const NPCS={
 'New Bark Town':[{name:{fr:'Prof. Orme',en:'Professor Elm'},id:152,x:.49,y:.28,level:5},{name:{fr:'Maman',en:'Mom'},id:25,x:.73,y:.70,level:5}],
 'Route 29':[],
 'Cherrygrove City':[{name:{fr:'Guide de la ville',en:'Guide Gent'},id:16,x:.62,y:.53,level:5}]
};
const GRASS={'Route 29':[
 {x:.20,y:.45,id:16,name:{fr:'Roucool',en:'Pidgey'},level:3},{x:.25,y:.45,id:19,name:{fr:'Rattata',en:'Rattata'},level:3},{x:.31,y:.46,id:161,name:{fr:'Fouinette',en:'Sentret'},level:4},{x:.66,y:.68,id:16,name:{fr:'Roucool',en:'Pidgey'},level:2},{x:.72,y:.68,id:19,name:{fr:'Rattata',en:'Rattata'},level:4}]};
const labels={fr:{map:'CARTE DE JOHTO',wild:'Pokémon sauvage'},en:{map:'JOHTO MAP',wild:'Wild Pokémon'}};
export default function JohtoStarterMap({location='Route 29',lang='fr',onBattle,onChange}){
 const[zoom,setZoom]=useState(1),d=MAPS[location]||MAPS['Route 29'],title=d[lang]||d.en,npcs=NPCS[location]||[],grass=GRASS[location]||[],scale=useMemo(()=>Math.min(1.65,Math.max(.65,zoom)),[zoom]);
 const go=n=>{setZoom(1);onChange?.(n)};
 return <section className="starter-map hgss-map-view"><header className="starter-map-header"><div><small>{labels[lang].map} · HGSS</small><h2>{title}</h2></div><div className="map-toolbar"><button type="button" onClick={()=>setZoom(z=>Math.max(.65,z-.15))}>−</button><span>{Math.round(scale*100)}%</span><button type="button" onClick={()=>setZoom(z=>Math.min(1.65,z+.15))}>+</button><button type="button" onClick={()=>setZoom(1)}>100%</button></div></header>
 <nav className="map-location-tabs">{Object.keys(MAPS).map(n=><button type="button" key={n} className={n===location?'active':''} onClick={()=>go(n)}>{MAPS[n][lang]||MAPS[n].en}</button>)}</nav>
 <div className="map-viewport"><div className="hgss-reference-map" style={{width:d.width*scale,height:d.height*scale}}><img src={d.image} alt={title} draggable="false" style={{width:d.width*scale,height:d.height*scale}}/><div className="map-overlay">
 {npcs.map((n,i)=><button type="button" className="world-npc" key={i} style={{left:`${n.x*100}%`,top:`${n.y*100}%`}} title={`${n.name[lang]} · Nv. ${n.level}`} onClick={()=>onBattle?.({id:n.id,name:n.name[lang],level:n.level,capturable:false})}><img src={`${POKE}/${n.id}.png`} alt=""/><span>{n.name[lang]}</span></button>)}
 {grass.map((g,i)=><button type="button" className="visible-wild" key={i} style={{left:`${g.x*100}%`,top:`${g.y*100}%`}} title={`${labels[lang].wild} : ${g.name[lang]} · Nv. ${g.level}`} onClick={()=>onBattle?.({id:g.id,name:g.name[lang],level:g.level,capturable:true})}><img src={`${POKE}/${g.id}.png`} alt={g.name[lang]}/><span>{g.name[lang]}</span></button>)}
 </div></div></div>
 <div className="map-connections">{Object.entries(d.connections).map(([dir,n])=><button type="button" key={dir} onClick={()=>MAPS[n]&&go(n)}>{dir==='west'?'←':dir==='east'?'→':'↑'} {MAPS[n]?.[lang]||n}</button>)}</div><footer>{lang==='fr'?'Référence visuelle HGSS · sprites Pokémon via PokéAPI · Pokémon sauvages visibles.':'HGSS visual reference · Pokémon sprites via PokéAPI · visible wild Pokémon.'}</footer></section>
}
