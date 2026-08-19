import mapping from '/data/pokemon-gen1-sprite-mapping.json';

export const GEN1_SPRITES = mapping;

export function getPokemonSprite(dex, side = 'front') {
  const entry = mapping[String(dex)];
  if (!entry) return null;
  return entry[side] || entry.front || entry.back || null;
}
