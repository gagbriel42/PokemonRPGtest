# Extraction des données HGSS

Le pipeline utilise **la ROM SoulSilver fournie localement** comme source de vérité. La ROM n'est jamais commitée dans GitHub.

## Extraction complète

```bash
npm run hgss:extract -- "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds"
```

ou directement :

```bash
python tools/hgss/extract_rom.py "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds"
```

Le script lit le header NDS, le FNT/FAT, extrait le NitroFS et prépare les cartes réelles.

## Textures des cartes

Les modèles NSBMD ne contiennent pas nécessairement les textures de terrain. HGSS conserve les ressources graphiques des cartes dans `a/0/4/4`.

Pour extraire ces ressources originales **sans publier la ROM**, une seule commande suffit :

```bash
python tools/hgss/extract_map_textures.py "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds" --maps 30
```

Elle crée localement `apps/web/public/assets/hgss/generated/map-textures/` avec les ressources originales et `index.json`.

### Données HGSS utilisées

- `a/0/4/1` : matrice des cartes ;
- `a/0/4/4` : ressources graphiques/textures des cartes ;
- `a/0/6/5` : conteneur des cartes.

Les conteneurs de carte HGSS sont séparés en BGS, PER, BLD, NSBMD et BDHC. Le renderer Three.js utilise la géométrie NSBMD réelle. Les textures doivent être décodées depuis les ressources de `a/0/4/4`; elles ne doivent pas être remplacées par des couleurs artificielles.
