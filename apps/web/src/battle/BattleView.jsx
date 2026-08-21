import React,{useState}from'react';
import{getHgssSpriteCandidates,spriteLabel}from'./hgssAssets.js';

const initialPlayer=[
 {name:'Pikachu',level:12,hp:32,maxHp:35,type:'ÉLECTRIK',icon:'⚡',moves:[['Éclair',7],['Vive-Attaque',5],['Tonnerre',10],['Rugissement',0]]},
 {name:'Bulbizarre',level:10,hp:24,maxHp:30,type:'PLANTE / POISON',icon:'🌱',moves:[['Charge',5],['Fouet Lianes',7],['Vampigraine',0],['Rugissement',0]]}
];
const availableEnemies=[
 {name:'Rattata',level:9,hp:25,maxHp:25,type:'NORMAL',icon:'🐭'},
 {name:'Roucool',level:8,hp:20,maxHp:20,type:'VOL',icon:'🪽'},
 {name:'Chenipan',level:7,hp:22,maxHp:22,type:'INSECTE',icon:'🐛'},
 {name:'Nosferapti',level:10,hp:27,maxHp:27,type:'POISON / VOL',icon:'🦇'},
 {name:'Fantominus',level:11,hp:28,maxHp:28,type:'SPECTRE / POISON',icon:'👻'},
 {name:'Ponyta',level:12,hp:34,maxHp:34,type:'FEU',icon:'🔥'}
];
function Hp({hp,maxHp}){const ratio=Math.max(0,Math.min(100,hp/maxHp*100));return <div className="hp hgss-hp"><i style={{width:`${ratio}%`}}/></div>}
function Sprite({pokemon,side}){const[attempt,setAttempt]=useState(0);const candidates=getHgssSpriteCandidates(pokemon.name,side);const src=candidates[attempt];return <div className={`hgss-sprite ${side}`}>
 {src?<img src={src} alt={spriteLabel(pokemon.name,side)} onError={()=>setAttempt(a=>a+1)}/>:<div className="sprite-fallback" aria-label={pokemon.name}>{pokemon.icon}</div>}
 </div>}
function Fighter({pokemon,enemy=false}){return <div className={`fighter ${enemy?'enemy':'player'}`}>
 <div className="hgss-status"><div className="status-line"><b>{pokemon.name}</b><span>♂</span><strong>Lv{pokemon.level}</strong></div><Hp hp={pokemon.hp} maxHp={pokemon.maxHp}/><small>HP {Math.max(0,pokemon.hp)}/{pokemon.maxHp}</small></div>
 <Sprite pokemon={pokemon} side={enemy?'front':'back'}/>
 </div>}
function PartySprite({pokemon}){return <Sprite pokemon={pokemon} side="front"/>}
function TeamStrip({team,selected,setSelected}){return <div className="team-strip hgss-party">{team.map((p,i)=><button key={p.name} className={i===selected?'active':''} disabled={p.hp<=0} onClick={()=>setSelected(i)}><span className="party-ball"><PartySprite pokemon={p}/></span><div><b>{p.name}</b><small>Lv{p.level}</small></div><div className="party-hp"><Hp hp={p.hp} maxHp={p.maxHp}/><small>{Math.max(0,p.hp)}/{p.maxHp}</small></div></button>)}</div>}
function BattleHud({message,turn,children}){return <><div className="hgss-dialog"><b>{message}</b><small>{turn==='player'?'À vous de jouer.':'Le PNJ joue…'}</small></div>{children}</>}
export default function BattleView({onExit}){
 const[player,setPlayer]=useState(initialPlayer),[enemy,setEnemy]=useState([availableEnemies[0]]),[selected,setSelected]=useState(0),[turn,setTurn]=useState('player'),[message,setMessage]=useState('Que doit faire Pikachu ?'),[panel,setPanel]=useState(null);
 const activePlayer=player[selected],activeEnemy=enemy.find(p=>p.hp>0)||enemy[0];
 const enemyTurn=()=>setTimeout(()=>{if(!activeEnemy||activeEnemy.hp<=0){setTurn('player');setMessage('Victoire !');return}const d=Math.min(activePlayer.hp,4);setPlayer(t=>t.map((p,i)=>i===selected?{...p,hp:Math.max(0,p.hp-d)}:p));setMessage(`${activeEnemy.name} attaque !`);setTurn('player')},450);
 const attack=(name,power)=>{if(turn!=='player'||!activePlayer||activePlayer.hp<=0)return;setPanel(null);const d=Math.min(activeEnemy.hp,power);setEnemy(t=>t.map(p=>p.name===activeEnemy.name?{...p,hp:p.hp-d}:p));setMessage(`${activePlayer.name} utilise ${name} !`);setTurn('enemy');setTimeout(()=>{if(activeEnemy.hp-d<=0){setMessage(`${activeEnemy.name} est K.O. !`);setTurn('player')}else enemyTurn()},300)};
 const switchPokemon=()=>{const next=player.findIndex((p,i)=>i!==selected&&p.hp>0);if(next<0){setMessage('Aucun autre Pokémon disponible.');return}setSelected(next);setMessage(`Go, ${player[next].name} !`);setPanel(null)};
 return <section className="battle-screen hgss-battle"><header className="battle-topbar hgss-battle-top"><div><small>COMBAT · INTERFACE JOUEUR</small><h2>Combat Pokémon</h2></div><div className="battle-mode"><b>JOUEUR</b><span>sprites HGSS réels</span></div><button onClick={onExit}>QUITTER</button></header>
 <div className="battle-field hgss-field"><div className="hgss-sky"/><div className="hgss-ground enemy-ground"/><div className="hgss-ground player-ground"/><Fighter pokemon={activeEnemy} enemy/><Fighter pokemon={activePlayer}/></div>
 <BattleHud message={message} turn={turn}><div className="battle-controls hgss-controls"><div className="battle-actions hgss-actions"><button className="battle-action primary" disabled={turn!=='player'} onClick={()=>setPanel('moves')}>COMBAT</button><button className="battle-action" disabled={turn!=='player'} onClick={()=>setPanel('bag')}>SAC</button><button className="battle-action" disabled={turn!=='player'} onClick={switchPokemon}>POKÉMON</button><button className="battle-action" disabled={turn!=='player'} onClick={()=>setMessage('Vous tentez de fuir…')}>FUITE</button>
 {panel==='moves'&&<div className="battle-subpanel hgss-moves"><b>CHOISIR UNE ATTAQUE</b>{activePlayer.moves.map(([n,p])=><button key={n} disabled={!p} onClick={()=>attack(n,p)}><strong>{n}</strong><small>{p?'Puissance '+p:'—'}</small></button>)}</div>}
 {panel==='bag'&&<div className="battle-subpanel hgss-moves"><b>SAC</b><button onClick={()=>{setPlayer(t=>t.map((p,i)=>i===selected?{...p,hp:Math.min(p.maxHp,p.hp+10)}:p));setMessage('Potion utilisée : +10 HP');setPanel(null)}}><strong>Potion</strong><small>+10 HP</small></button></div>}
 </div><TeamStrip team={player} selected={selected} setSelected={setSelected}/></div></BattleHud></section>
}
export function GmBattleView({onExit}){
 const[setup,setSetup]=useState(true),[choice,setChoice]=useState(0),[enemies,setEnemies]=useState([]),[players,setPlayers]=useState(initialPlayer),[selected,setSelected]=useState(0),[target,setTarget]=useState(0),[message,setMessage]=useState('');
 const current=enemies[selected],targetPlayer=players[target];
 if(setup)return <section className="battle-screen gm-battle hgss-battle"><header className="battle-topbar hgss-battle-top"><div><small>COMBAT · INTERFACE MJ</small><h2>Préparer le combat</h2></div><div className="battle-mode gm"><b>MJ</b><span>sprites HGSS réels</span></div><button onClick={onExit}>QUITTER</button></header><div className="gm-setup hgss-setup"><div className="hgss-panel-title">CHOISIR LE POKÉMON DU PNJ</div><div className="hgss-selection-grid">{availableEnemies.map((p,i)=><button key={p.name} className={i===choice?'hgss-mon-card selected':'hgss-mon-card'} onClick={()=>setChoice(i)}><Sprite pokemon={p} side="front"/><div><b>{p.name}</b><small>Lv{p.level} · {p.type}</small><Hp hp={p.maxHp} maxHp={p.maxHp}/><small>{p.maxHp}/{p.maxHp} HP</small></div></button>)}</div><button className="gm-launch" onClick={()=>{const p={...availableEnemies[choice]};setEnemies([p]);setSelected(0);setTarget(0);setMessage(`${p.name} est envoyé au combat !`);setSetup(false)}}>⚔ LANCER LE COMBAT</button></div></section>;
 const damage=(amount,label)=>{if(!current||current.hp<=0||!targetPlayer||targetPlayer.hp<=0)return;const d=Math.min(targetPlayer.hp,amount);setPlayers(t=>t.map((p,i)=>i===target?{...p,hp:Math.max(0,p.hp-d)}:p));setMessage(`${current.name} ${label} sur ${targetPlayer.name} : -${d} HP.`)};
 return <section className="battle-screen gm-battle hgss-battle"><header className="battle-topbar hgss-battle-top"><div><small>COMBAT · INTERFACE MJ</small><h2>Gestion du combat</h2></div><div className="battle-mode gm"><b>MJ</b><span>PNJ principal · sprites HGSS</span></div><button onClick={onExit}>QUITTER</button></header><div className="gm-battle-stage"><div className="gm-stage-enemy"><span>PNJ ACTIF</span>{current&&<><Sprite pokemon={current} side="front"/><h3>{current.name} · Lv{current.level}</h3><Hp hp={current.hp} maxHp={current.maxHp}/></>}</div><div className="gm-vs">VS</div><div className="gm-stage-player"><span>CIBLE JOUEUR</span>{targetPlayer&&<><Sprite pokemon={targetPlayer} side="back"/><h3>{targetPlayer.name} · Lv{targetPlayer.level}</h3><Hp hp={targetPlayer.hp} maxHp={targetPlayer.maxHp}/></>}</div></div><div className="gm-command hgss-gm-command"><div className="gm-target-list"><b>PNJ</b>{enemies.map((p,i)=><button className={i===selected?'selected':''} key={p.name} onClick={()=>setSelected(i)}><PartySprite pokemon={p}/>{p.name}</button>)}</div><div className="gm-target-list"><b>JOUEURS</b>{players.map((p,i)=><button className={i===target?'selected target':''} key={p.name} onClick={()=>setTarget(i)}><PartySprite pokemon={p}/>{p.name}</button>)}</div><div className="gm-buttons"><button onClick={()=>damage(5,'attaque')}>ATTAQUER</button><button onClick={()=>damage(8,'utilise sa capacité')}>CAPACITÉ</button><button onClick={()=>setMessage(`${current?.name} se défend.`)}>DÉFENDRE</button><button onClick={()=>setSetup(true)}>CHANGER DE PNJ</button></div><p>{message}</p></div></section>;
}
