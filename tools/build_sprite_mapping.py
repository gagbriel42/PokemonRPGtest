#!/usr/bin/env python3
"""
Build a non-destructive index and semantic mapping for the extracted Pokegra PNGs.

IMPORTANT:
- NEVER opens PNGs for writing.
- NEVER modifies anything under tools/pokegra/png.
- Writes only generated JSON files under apps/web/public/data/.

The Gen IV pokegra archive uses 6 entries per National Dex slot:
  +0 female back
  +1 male back
  +2 female front
  +3 male front
  +4 normal palette
  +5 shiny palette

Our extracted PNG directory contains the image entries, while palette files are
kept separately. The original archive index is therefore retained in each URL.
For the Gen 1 JDR, entries 1..151 are mapped deterministically from that archive
layout; missing extracted entries are reported rather than guessed.
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
    "Racaillou", "Gravalanch", "Grolem", "Ponyta", "Galopa", "Ramoloss", "Flagadoss",
    "Magnéti", "Magnéton", "Canarticho", "Doduo", "Dodrio", "Otaria", "Lamantine", "Tadmorv",
    "Grotadmorv", "Kokiyas", "Crustabri", "Fantominus", "Spectrum", "Ectoplasma", "Onix",
    "Soporifik", "Hypnomade", "Krabby", "Krabboss", "Voltorbe", "Électrode", "Noeunoeuf",
    "Noadkoko", "Osselait", "Ossatueur", "Kicklee", "Tygnon", "Excelangue", "Smogo", "Smogogo",
    "Rhinocorne", "Rhydon", "Leveinard", "Tangtang", "Kangourex", "Horsea", "Hypocéan", "Poissirène",
    "Poissoroy", "Stari", "Staross", "M. Mime", "Insécateur", "Lippoutou", "Élektek", "Magmar",
    "Scarabrute", "Tauros", "Magicarpe", "Léviator", "Lokhlass", "Métamorph", "Évoli", "Aquali",
    "Voltali", "Pyroli", "Porygon", "Amonita", "Amonistar", "Kabuto", "Kabutops", "Ptéra", "Ronflex",
    "Artikodin", "Électhor", "Sulfura", "Minidraco", "Draco", "Dracolosse", "Mewtwo", "Mew"
]


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def png_info(path: Path) -> dict[str, Any]:
    result: dict[str, Any] = {"width": None, "height": None, "mode": None}
    if Image is None:
        return result
    try:
        with Image.open(path) as im:
            result["width"], result["height"], result["mode"] = im.size[0], im.size[1], im.mode
    except Exception as exc:
        result["error"] = str(exc)
    return result


def main() -> int:
    if not PNG_DIR.is_dir():
        raise SystemExit(f"PNG directory not found: {PNG_DIR}")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(PNG_DIR.glob("*.png"), key=lambda p: int(p.stem) if p.stem.isdigit() else p.stem)
    by_id: dict[int, Path] = {}
    invalid_names: list[str] = []
    duplicate_hashes: dict[str, list[str]] = {}
    assets: list[dict[str, Any]] = []

    for path in files:
        if not path.stem.isdigit():
            invalid_names.append(path.name)
            continue
        asset_id = int(path.stem)
        by_id[asset_id] = path
        info = png_info(path)
        digest = sha256(path)
        duplicate_hashes.setdefault(digest, []).append(path.name)
        rel = path.relative_to(ROOT).as_posix()
        assets.append({
            "assetId": asset_id,
            "file": rel,
            "url": "/" + rel,
            "palette": f"tools/pokegra/pal/{asset_id:04d}.pal" if (PAL_DIR / f"{asset_id:04d}.pal").exists() else None,
            "sha256": digest,
            **info,
        })

    def asset_url(asset_id: int) -> str | None:
        p = by_id.get(asset_id)
        return "/" + p.relative_to(ROOT).as_posix() if p else None

    mapping: dict[str, Any] = {}
    missing: list[dict[str, Any]] = []
    for dex, name in enumerate(GEN1_NAMES, start=1):
        base = (dex - 1) * 6
        entry = {
            "nationalDex": dex,
            "name": name,
            "archiveBase": base,
            "front": asset_url(base + 3),
            "back": asset_url(base + 1),
            "frontFemale": asset_url(base + 2),
            "backFemale": asset_url(base + 0),
            "normalPalette": f"/tools/pokegra/pal/{base + 4:04d}.pal" if (PAL_DIR / f"{base + 4:04d}.pal").exists() else None,
            "shinyPalette": f"/tools/pokegra/pal/{base + 5:04d}.pal" if (PAL_DIR / f"{base + 5:04d}.pal").exists() else None,
            "status": "mapped" if asset_url(base + 3) or asset_url(base + 1) else "missing_extracted_image"
        }
        mapping[str(dex)] = entry
        if entry["status"] != "mapped":
            missing.append({"nationalDex": dex, "name": name, "expectedArchiveRange": [base, base + 5]})

    duplicate_groups = [v for v in duplicate_hashes.values() if len(v) > 1]
    dimensions: dict[str, int] = {}
    modes: dict[str, int] = {}
    for a in assets:
        key = f"{a['width']}x{a['height']}"
        dimensions[key] = dimensions.get(key, 0) + 1
        if a["mode"]:
            modes[a["mode"]] = modes.get(a["mode"], 0) + 1

    payload = {
        "version": 2,
        "generatedBy": "tools/build_sprite_mapping.py",
        "source": "tools/pokegra/png",
        "sourceIsReadOnly": True,
        "count": len(assets),
        "assets": assets,
        "semanticMapping": mapping,
        "semanticMappingStatus": "gen1_deterministic_archive_order",
        "archiveLayout": {
            "entriesPerPokemon": 6,
            "femaleBackOffset": 0,
            "maleBackOffset": 1,
            "femaleFrontOffset": 2,
            "maleFrontOffset": 3,
            "normalPaletteOffset": 4,
            "shinyPaletteOffset": 5
        }
    }

    report = {
        "version": 2,
        "pngCount": len(files),
        "indexedCount": len(assets),
        "gen1Count": 151,
        "gen1Mapped": 151 - len(missing),
        "gen1Missing": missing,
        "invalidNames": invalid_names,
        "duplicateContentGroups": duplicate_groups,
        "dimensions": dimensions,
        "modes": modes,
        "pngDirectory": str(PNG_DIR.relative_to(ROOT)),
        "pngFilesModified": False,
        "mappingMethod": "National Dex order with 6-entry Pokegra archive slots; no image content is rewritten."
    }

    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    OUT_MAPPING.write_text(json.dumps(mapping, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print("=== POKEGRA SPRITE MAPPING ===")
    print(f"PNG trouvés       : {len(files)}")
    print(f"PNG indexés       : {len(assets)}")
    print(f"Gen 1 mappés      : {151 - len(missing)}/151")
    print(f"PNG originaux     : INTACTS")
    print(f"Mapping           : {OUT_MAPPING.relative_to(ROOT)}")
    print(f"Rapport           : {OUT_REPORT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
