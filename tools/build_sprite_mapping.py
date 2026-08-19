#!/usr/bin/env python3
"""Build a non-destructive index and semantic mapping for Pokegra PNGs.

The PNG files are treated as immutable source assets. The six files belonging to
one Pokegra entry are grouped by *sorted archive extraction order*, not by
numeric filename. This matters because the extracted NARC contains gaps in its
member IDs (e.g. 0000..0003, 0006..), so arithmetic on filenames mis-maps the
Pokemon entries.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
from typing import Any

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = Path(__file__).resolve().parents[1]
PNG_DIR = ROOT / "tools" / "pokegra" / "png"
PAL_DIR = ROOT / "tools" / "pokegra" / "pal"
OUT_DIR = ROOT / "apps" / "web" / "public" / "data"
OUT_JSON = OUT_DIR / "sprite-assets.json"
OUT_REPORT = OUT_DIR / "sprite-assets-report.json"
OUT_MAPPING = OUT_DIR / "pokemon-gen1-sprite-mapping.json"

GEN1_NAMES = [
    "Bulbizarre", "Herbizarre", "Florizarre", "Salamèche", "Reptincel", "Dracaufeu",
    "Carapuce", "Carabaffe", "Tortank", "Chenipan", "Chrysacier", "Papilusion",
    "Aspicot", "Coconfort", "Dardargnan", "Roucool", "Roucoups", "Roucarnage",
    "Rattata", "Rattatac", "Piafabec", "Rapasdepic", "Abo", "Arbok", "Pikachu",
    "Raichu", "Sabelette", "Sablaireau", "Nidoran♀", "Nidorina", "Nidoqueen",
    "Nidoran♂", "Nidorino", "Nidoking", "Mélofée", "Mélodelfe", "Goupix", "Feunard",
    "Rondoudou", "Grodoudou", "Nosferapti", "Nosferalto", "Mystherbe", "Ortide",
    "Rafflesia", "Paras", "Parasect", "Mimitoss", "Aéromite", "Taupiqueur", "Triopikeur",
    "Miaouss", "Persian", "Psykokwak", "Akwakwak", "Férosinge", "Colossinge", "Caninos",
    "Arcanin", "Ptitard", "Têtarte", "Tartard", "Abra", "Kadabra", "Alakazam", "Machoc",
    "Machopeur", "Mackogneur", "Chétiflor", "Boustiflor", "Empiflor", "Tentacool", "Tentacruel",
    "Racaillou", "Gravalanch", "Grolem", "Ponyta", "Galopa", "Ramoloss", "Flagadoss", "Magnéti",
    "Magnéton", "Canarticho", "Doduo", "Dodrio", "Otaria", "Lamantine", "Tadmorv", "Grotadmorv",
    "Kokiyas", "Crustabri", "Fantominus", "Spectrum", "Ectoplasma", "Onix", "Soporifik", "Hypnomade",
    "Krabby", "Krabboss", "Voltorbe", "Électrode", "Noeunoeuf", "Noadkoko", "Osselait", "Ossatueur",
    "Kicklee", "Tygnon", "Excelangue", "Smogo", "Smogogo", "Rhinocorne", "Rhydon", "Leveinard",
    "Tangela", "Kangourex", "Horsea", "Hypocéan", "Poissirène", "Poissoroy", "Stari", "Staross",
    "M. Mime", "Insécateur", "Lippoutou", "Élektek", "Magmar", "Scarabrute", "Tauros", "Magicarpe",
    "Léviator", "Lokhlass", "Métamorph", "Évoli", "Aquali", "Voltali", "Pyroli", "Porygon", "Amonita",
    "Amonistar", "Kabuto", "Kabutops", "Ptéra", "Ronflex", "Artikodin", "Électhor", "Sulfura",
    "Minidraco", "Draco", "Dracolosse", "Mewtwo", "Mew",
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def info(path: Path) -> dict[str, Any]:
    if Image is None:
        return {"width": None, "height": None, "mode": None}
    try:
        with Image.open(path) as im:
            return {"width": im.width, "height": im.height, "mode": im.mode}
    except Exception as exc:
        return {"width": None, "height": None, "mode": None, "error": str(exc)}


def asset_url(path: Path | None) -> str | None:
    if path is None or not path.exists():
        return None
    return "/" + path.relative_to(ROOT).as_posix()


def main() -> None:
    if not PNG_DIR.is_dir():
        raise SystemExit(f"PNG directory not found: {PNG_DIR}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(
        (p for p in PNG_DIR.glob("*.png") if p.stem.isdigit()),
        key=lambda p: int(p.stem),
    )

    assets = []
    for path in files:
        asset_id = int(path.stem)
        palette = PAL_DIR / f"{asset_id:04d}.pal"
        assets.append({
            "assetId": asset_id,
            "file": path.relative_to(ROOT).as_posix(),
            "url": asset_url(path),
            "palette": asset_url(palette),
            "sha256": sha256(path),
            **info(path),
        })

    # IMPORTANT: group by extraction order. Filename IDs contain gaps and are
    # not a contiguous Pokemon index. Six consecutive extracted images form one
    # Pokegra entry: female-back, male-back, female-front, male-front,
    # normal-palette companion, shiny-palette companion.
    groups = [files[i:i + 6] for i in range(0, len(files), 6)]
    mapping: dict[str, dict[str, Any]] = {}
    missing: list[dict[str, Any]] = []

    for dex, name in enumerate(GEN1_NAMES, 1):
        group_index = dex - 1
        group = groups[group_index] if group_index < len(groups) else []
        complete = len(group) == 6

        entry: dict[str, Any] = {
            "nationalDex": dex,
            "name": name,
            "archiveGroup": group_index,
            "archiveIds": [int(p.stem) for p in group],
            "front": asset_url(group[3]) if len(group) > 3 else None,
            "back": asset_url(group[1]) if len(group) > 1 else None,
            "frontFemale": asset_url(group[2]) if len(group) > 2 else None,
            "backFemale": asset_url(group[0]) if len(group) > 0 else None,
            "normalPalette": asset_url(PAL_DIR / f"{int(group[4].stem):04d}.pal") if len(group) > 4 else None,
            "shinyPalette": asset_url(PAL_DIR / f"{int(group[5].stem):04d}.pal") if len(group) > 5 else None,
            "status": "mapped" if complete else "incomplete_group",
        }
        mapping[str(dex)] = entry
        if not complete:
            missing.append({
                "nationalDex": dex,
                "name": name,
                "groupIndex": group_index,
                "found": len(group),
            })

    report = {
        "version": 4,
        "pngCount": len(files),
        "pokegraGroups": len(groups),
        "entriesPerPokemon": 6,
        "gen1Count": 151,
        "gen1Mapped": 151 - len(missing),
        "gen1Missing": missing,
        "pngFilesModified": False,
        "mappingMethod": "Sorted extracted PNG order grouped in blocks of six; numeric filename gaps are preserved and never interpreted as missing assets.",
    }

    payload = {
        "version": 4,
        "generatedBy": "tools/build_sprite_mapping.py",
        "source": "tools/pokegra/png",
        "sourceIsReadOnly": True,
        "count": len(assets),
        "assets": assets,
        "semanticMapping": mapping,
        "archiveLayout": {
            "entriesPerPokemon": 6,
            "femaleBackOffset": 0,
            "maleBackOffset": 1,
            "femaleFrontOffset": 2,
            "maleFrontOffset": 3,
            "normalPaletteOffset": 4,
            "shinyPaletteOffset": 5,
        },
    }

    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_MAPPING.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"Pokegra PNG: {len(files)} | groups of 6: {len(groups)} | Gen 1 mapped: {151 - len(missing)}/151 | PNG originals: INTACTS")


if __name__ == "__main__":
    main()
