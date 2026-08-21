import React,{useState}from'react';

const playerTeam=[
 {name:'Pikachu',level:12,hp:32,maxHp:35,type:'ÉLECTRIK',icon:'⚡'},
 {name:'Bulbizarre',level:10,hp:24,maxHp:30,type:'PLANTE / POISON',icon:'🌱'}
];
const enemyTeam=[
 {name:'Rattata',level:9,hp:25,maxHp:25,type:'NORMAL',icon:'🐭'},
 {name:'Roucool',level:8,hp:20,maxHp:20,type:'VOL',icon:'🪽'}
];

function Fighter({pokemon,enemy=false}){
 const ratio=Math.max(0,pokemon.hp/pokemon.maxHp)*100;
 return <div className={`fighter ${enemy?'enemy':'player'}`}>
   <div className="fighter-card"><div><b>{pokemon.name}</b><span>♀ · Nv.{pokemon.level}</span></div><div className="hp"><i style={{width:`${ratio}%`}}/></div><small>PV {pokemon.hp} / {pokemon.maxHp}</small></div>
   <div className="battle-sprite" aria-label={pokemon.name}>{pokemon.icon}</div>
 </div>
}

export default function BattleView({onExit}){
 const [turn,setTurn]=useState('player');
 const [message,setMessage]=useState('Que doit faire Pikachu ?');
 const [selected,setSelected]=useState(0);
 const [log,setLog]=useState(['Le combat commence !']);
 const [player,setPlayer]=useState(playerTeam);
 const [enemy,setEnemy]=useState(enemyTeam);
 const activePlayer=player[selected];
 const activeEnemy=enemy[0];
 const attack=(name,power)=>{
   if(turn!=='player')return;
   const damage=Math.min(activeEnemy.hp,power);
   setEnemy(t=>t.map((p,i)=>i? p:{...p,hp:p.hp-damage}));
   setMessage(`${activePlayer.name} utilise ${name} !`);
   setLog(l=>[`${activePlayer.name} → ${name} (-${damage} PV)`,...l].slice(0,5));
   setTurn('enemy');
   setTimeout(()=>{
     setPlayer(t=>t.map((p,i)=>i? p:{...p,hp:Math.max(0,p.hp-4)}));
     setMessage(`${activeEnemy.name} riposte !`);
     setLog(l=>[`${activeEnemy.name} riposte (-4 PV)`,...l].slice(0,5));
     setTurn('player');
   },550);
 };
 return <section className="battle-screen">
   <header className="battle-topbar"><div><small>COMBAT · VUE JOUEUR</small><h2>Combat Pokémon</h2></div><div className="battle-mode"><b>MJ</b><span>vue inversée disponible</span></div><button onClick={onExit}>QUITTER</button></header>
   <div className="battle-field">
     <div className="battle-background"/>
     <Fighter pokemon={activeEnemy} enemy/>
     <Fighter pokemon={activePlayer}/>
     <div className="battle-name enemy-name">PNJ · ADVERSAIRE</div>
     <div className="battle-name player-name">JOUEUR · {activePlayer.name}</div>
   </div>
   <div className="battle-message"><b>{message}</b><small>{turn==='player'?'À votre tour':'Tour du PNJ…'}</small></div>
   <div className="battle-controls">
     <div className="battle-actions">
       <button className="battle-action primary" onClick={()=>attack('Éclair',7)} disabled={turn!=='player'}>⚡ ATTAQUE</button>
       <button className="battle-action" onClick={()=>attack('Charge',5)} disabled={turn!=='player'}>▸ CHARGE</button>
       <button className="battle-action" onClick={()=>{setMessage('Pikachu utilise une Poké Ball !');setLog(l=>['Tentative de capture',...l]);}} disabled={turn!=='player'}>● SAC</button>
       <button className="battle-action" onClick={()=>{setMessage('Choisissez un Pokémon.');setSelected(i=>(i+1)%player.length);}} disabled={turn!=='player'}>↻ POKÉMON</button>
     </div>
     <div className="team-strip">{player.map((p,i)=><button key={p.name} className={i===selected?'active':''} onClick={()=>setSelected(i)}><span>{p.icon}</span><b>{p.name}</b><small>{p.hp}/{p.maxHp}</small></button>)}</div>
     <aside className="battle-log"><b>JOURNAL</b>{log.map((x,i)=><span key={`${x}-${i}`}>{x}</span>)}</aside>
   </div>
 </section>
}

export function GmBattleView({onExit}){
 const [selected,setSelected]=useState(0);
 const [message,setMessage]=useState('Sélectionnez une action pour le PNJ.');
 return <section className="battle-screen gm-battle">
   <header className="battle-topbar"><div><small>COMBAT · VUE MJ</small><h2>Gestion du combat</h2></div><div className="battle-mode gm"><b>MJ</b><span>PNJ / adversaire principal</span></div><button onClick={onExit}>QUITTER</button></header>
   <div className="gm-field"><div className="gm-column"><label>PNJ / ADVERSAIRE</label>{enemyTeam.map((p,i)=><button key={p.name} className={i===selected?'gm-card selected':'gm-card'} onClick={()=>setSelected(i)}><span className="gm-icon">{p.icon}</span><div><b>{p.name}</b><small>Nv.{p.level} · {p.type}</small><div className="hp"><i style={{width:`${p.hp/p.maxHp*100}%`}}/></div><small>PV {p.hp}/{p.maxHp}</small></div></button>)}</div><div className="gm-versus">VS</div><div className="gm-column"><label>PERSONNAGES JOUEURS</label>{playerTeam.map(p=><div className="gm-card"><span className="gm-icon">{p.icon}</span><div><b>{p.name}</b><small>Nv.{p.level} · {p.type}</small><div className="hp"><i style={{width:`${p.hp/p.maxHp*100}%`}}/></div><small>PV {p.hp}/{p.maxHp}</small></div></div>)}</div></div>
   <div className="gm-command"><div><small>PNJ SÉLECTIONNÉ</small><b>{enemyTeam[selected].name}</b></div><button onClick={()=>setMessage(`${enemyTeam[selected].name} attaque !`)}>ATTAQUER</button><button onClick={()=>setMessage('Le PNJ utilise une capacité spéciale.')}>CAPACITÉ</button><button onClick={()=>setMessage('Le PNJ change de Pokémon.')}>CHANGER</button><button onClick={()=>setMessage('Le PNJ défend.')}>DÉFENDRE</button><p>{message}</p></div>
 </section>
}
