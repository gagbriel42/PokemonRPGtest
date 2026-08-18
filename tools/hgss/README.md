# Extraction des données HGSS

Le pipeline utilise **la ROM SoulSilver fournie localement** comme source de vérité. La ROM n'est jamais commitée dans GitHub.

## Commande

```bash
npm run hgss:extract -- "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds"
```

ou directement :

```bash
python tools/hgss/extract_rom.py "/workspaces/PokemonRPGtest/Pokemon SoulSilver.nds"
```

Le script est autonome : il lit le header NDS, le FNT/FAT, extrait le NitroFS et décompresse les NARC nécessaires sans dépendre de `ndstool`.

### Données HGSS utilisées

- `a/0/4/1` : matrice des cartes ;
- `a/0/4/4` : ressources de textures ;
- `a/0/6/5` : conteneur des cartes.

Les conteneurs de carte HGSS sont ensuite séparés en :

```text
BGS
PER   collisions/permissions
BLD   bâtiments
NSBMD modèle + textures
BDHC  géométrie/hauteurs
```

`tools/hgss/mapbin.py` contient le lecteur du conteneur.

Par défaut, l'extracteur prépare les cartes **30 (Route 29)** et **57 (New Bark Town)**, puis peut être étendu à toutes les cartes :

```bash
python tools/hgss/extract_rom.py "Pokemon SoulSilver.nds" --maps 30,57,58,59,60
```

La sortie locale se trouve dans `apps/web/public/assets/hgss/generated/`.

## Vérification effectuée sur la ROM fournie

Le pipeline a été testé sur la ROM SoulSilver fournie dans cette conversation :

- 384 fichiers NitroFS détectés ;
- 676 entrées dans `a/0/6/5` ;
- Route 29 = entrée 30 ;
- New Bark Town = entrée 57 ;
- Route 29 : PER 2048 octets, BLD 672, NSBMD 29792, BDHC 602 ;
- New Bark Town : PER 2048, BLD 48, NSBMD 34944, BDHC 1326.

Ces fichiers extraits restent locaux et ne sont pas publiés dans le dépôt.

## Étape renderer

Le renderer doit maintenant consommer ces données HGSS réelles. Il ne faut plus générer une carte avec des règles artificielles `grass/path/water/tree` dans `main.jsx`.
