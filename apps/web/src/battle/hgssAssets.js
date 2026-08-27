const spriteRoot='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';
export function getPokemonDexId(pokemon){if(typeof pokemon==='number')return pokemon;return Number(pokemon?.id??pokemon?.pokedexNumber??0)||null}
export function getHgssSpriteCandidates(pokemon,side='front'){const id=getPokemonDexId(pokemon);if(!id)return[];const hgss=side==='back'?`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/back/${id}.png`:`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/${id}.png`;const standard=side==='back'?`${spriteRoot}/back/${id}.png`:`${spriteRoot}/${id}.png`;return[hgss,standard]}
export function getBattlePickerSprite(pokemon){const id=getPokemonDexId(pokemon);return id?`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/${id}.png`:''}
export function getHgssBattleAssets(){return{background:'/assets/hgss/generated/nitrofs/pbr/batt_bg.narc',objects:'/assets/hgss/generated/nitrofs/pbr/batt_obj.narc',pokemon:'/assets/hgss/generated/nitrofs/pbr/pokegra.narc',icons:'/assets/hgss/generated/nitrofs/pbr/poke_icon.narc'}}
export function getHgssBattleTexture(name){return `/assets/hgss/battle-ui/${name}.png`}
export function spriteLabel(name,side){return `${name} — ${side==='back'?'sprite arrière':'sprite avant'}`}
