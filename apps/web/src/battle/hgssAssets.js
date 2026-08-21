const DEX={Bulbizarre:1,Herbizarre:2,Florizarre:3,Salamèche:4,Reptincel:5,Dracaufeu:6,Carapuce:7,Carabaffe:8,Tortank:9,Pikachu:25,Rattata:19,Roucool:16,Chenipan:10,Nosferapti:41,Fantominus:92,Ponyta:77};

const localCandidates=(id,side)=>[
  `/assets/hgss/battle/${id}-${side}.png`,
  `/assets/hgss/battle/${side}/${String(id).padStart(3,'0')}.png`,
  `/assets/hgss/pokemon/${String(id).padStart(3,'0')}/${side}.png`,
  `/assets/pokemon/hgss/${String(id).padStart(3,'0')}-${side}.png`
];

// Official HGSS sprite set mirrored by PokeAPI. Local extracted assets always win;
// the remote source is only a fallback so the battle UI is immediately usable.
const remote=(id,side)=>side==='back'
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/back/${id}.png`
  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/${id}.png`;

export function getPokemonDexId(name){return DEX[name]??null}
export function getHgssSpriteCandidates(name,side='front'){
  const id=getPokemonDexId(name);
  return id?[...localCandidates(id,side),remote(id,side)]:[];
}
export function getHgssBattleTexture(name){return `/assets/hgss/battle-ui/${name}.png`}
export function spriteLabel(name,side){return `${name} · sprite HGSS ${side==='back'?'dos':'face'}`}
