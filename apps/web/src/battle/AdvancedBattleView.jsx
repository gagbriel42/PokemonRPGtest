import React,{useState}from'react';
import BattleSystemV2,{GmBattleSystemV2}from'./BattleSystemV2.jsx';
import PokemonDex from'./PokemonDex.jsx';
import'./hgss-battle-ui.css';
function Shell({gm=false,onExit}){const[open,setOpen]=useState(false);return <><div className="hgss-dex-launcher"><button type="button" onClick={()=>setOpen(true)}>POKÉDEX NATIONAL</button></div>{gm?<GmBattleSystemV2 onExit={onExit}/>:<BattleSystemV2 onExit={onExit}/>}<PokemonDex open={open} onClose={()=>setOpen(false)} onSelect={p=>{localStorage.setItem('pokemon-jdr-dex-last',JSON.stringify(p));setOpen(false);window.dispatchEvent(new CustomEvent('pokemon-jdr-dex-selected',{detail:p}))}}/></>}
export default function AdvancedBattleView(props){return <Shell {...props}/>}
export function GmAdvancedBattleView(props){return <Shell {...props} gm/>}
