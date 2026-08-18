# Extraction des données HGSS

Ce dossier contient les outils du pipeline qui transforme une ROM SoulSilver fournie localement en données utilisables par l'overworld.

## Utilisation dans Codespaces

Placez votre copie locale de la ROM dans le Codespace (la ROM elle-même n'est pas stockée dans GitHub), puis lancez :

```bash
python tools/hgss/extract_rom.py "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds"
```

La sortie est créée sous `apps/web/public/assets/hgss/generated/`.

Le pipeline cible notamment :

- `a/0/4/1` : matrice des cartes ;
- `a/0/4/4` : ressources de textures ;
- `a/0/6/5` : données des cartes HGSS.

La prochaine étape du renderer consomme ces données au lieu de générer artificiellement des rectangles d'herbe, de chemin et d'eau.

## Important

Ne commitez pas la ROM ou les fichiers propriétaires extraits. Le dépôt contient uniquement les scripts et métadonnées nécessaires au développement.
