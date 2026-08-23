const extracted={
  background:'/assets/hgss/generated/nitrofs/pbr/batt_bg.narc',
  objects:'/assets/hgss/generated/nitrofs/pbr/batt_obj.narc',
  pokemon:'/assets/hgss/generated/nitrofs/pbr/pokegra.narc',
  icons:'/assets/hgss/generated/nitrofs/pbr/poke_icon.narc',
  ui:'/assets/hgss/generated/nitrofs/data/battle_win.NSCR',
  bag:'/assets/hgss/generated/nitrofs/pbr/bag_gra.narc',
  font:'/assets/hgss/generated/nitrofs/pbr/font.narc',
  extractedRoot:'/assets/hgss/generated/battle-assets',
  manifest:'/assets/hgss/battle/manifest.json'
};

const localBattleSprite=(id)=>`/assets/hgss/generated/battle-png/${String(id).padStart(4,'0')}.png`;
const hgssRemote=(id,side)=>side==='back'
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/back/${id}.png`
  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-iv/heartgold-soulsilver/${id}.png`;
const modernRemote=(id,side)=>side==='back'
  ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/${id}.png`
  : `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

export function getPokemonDexId(pokemon){
  if(typeof pokemon==='number')return pokemon;
  return pokemon?.id??pokemon?.pokedexNumber??null;
}

export function getHgssSpriteCandidates(pokemon,side='front'){
  const id=getPokemonDexId(pokemon);
  if(!id)return[];
  const local=side==='front'&&id<=493?[localBattleSprite(id)]:[];
  return [...local,hgssRemote(id,side),modernRemote(id,side)];
}

export function getHgssBattleAssets(){return extracted;}
export function getHgssBattleTexture(name){return `/assets/hgss/battle-ui/${name}.png`;}
export function spriteLabel(name,side){return `${name} · sprite HGSS ${side==='back'?'dos':'face'}`;}
