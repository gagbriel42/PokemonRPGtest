const spriteRoot='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

// PokeAPI peut répondre temporairement en 429/5xx lorsque plusieurs Pokémon
// sont hydratés au lancement d'un combat. On rejoue ces requêtes afin de ne
// pas perdre silencieusement les données d'attaques.
if(typeof window!=='undefined'&&!window.__pokeApiFetchRetry){
  const nativeFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    for(let attempt=0;attempt<4;attempt++){
      try{
        const response=await nativeFetch(...args);
        if(response.ok||![429,500,502,503,504].includes(response.status)||attempt===3)return response;
        await new Promise(r=>setTimeout(r,250*(attempt+1)));
      }catch(error){
        if(attempt===3)throw error;
        await new Promise(r=>setTimeout(r,250*(attempt+1)));
      }
    }
    throw new Error('fetch retry exhausted');
  };
  window.__pokeApiFetchRetry=true;
}

export function getPokemonDexId(pokemon){if(typeof pokemon==='number')return pokemon;return Number(pokemon?.id??pokemon?.pokedexNumber??0)||null}
export function getHgssSpriteCandidates(pokemon,side='front'){const id=getPokemonDexId(pokemon);if(!id)return[];const hgss=side==='back'?`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/back/${id}.png`:`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/${id}.png`;const standard=side==='back'?`${spriteRoot}/back/${id}.png`:`${spriteRoot}/${id}.png`;return[hgss,standard]}
export function getBattlePickerSprite(pokemon){const id=getPokemonDexId(pokemon);return id?`${spriteRoot}/versions/generation-iv/heartgold-soulsilver/${id}.png`:''}
export function getHgssBattleAssets(){return{background:'/assets/hgss/generated/nitrofs/pbr/batt_bg.narc',objects:'/assets/hgss/generated/nitrofs/pbr/batt_obj.narc',pokemon:'/assets/hgss/generated/nitrofs/pbr/pokegra.narc',icons:'/assets/hgss/generated/nitrofs/pbr/poke_icon.narc'}}
export function getHgssBattleTexture(name){return `/assets/hgss/battle-ui/${name}.png`}
export function spriteLabel(name,side){return `${name} — ${side==='back'?'sprite arrière':'sprite avant'}`}
